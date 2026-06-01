-- Migración SQL: Plan Maestro de Integridad y Conectividad en Supabase
-- Timestamp: 20260531220000

-- ──────────────────────────────────────────────────────────
-- 1. INTEGRACIÓN DE VENTAS (DTE vs RCV)
-- ──────────────────────────────────────────────────────────

-- Añadir columna de relación en sales_records si no existe
ALTER TABLE public.sales_records 
ADD COLUMN IF NOT EXISTS dte_issued_id uuid REFERENCES public.dte_issued(id) ON DELETE SET NULL;

-- Función de mapeo de tipo de documento RCV a tipo_dte entero
CREATE OR REPLACE FUNCTION public.fn_map_doc_type_to_dte(doc_type text) 
RETURNS integer AS $$
BEGIN
    RETURN CASE 
        WHEN doc_type IN ('33', 'factura_electronica', 'FACTURA ELECTRONICA') THEN 33
        WHEN doc_type IN ('34', 'factura_exenta', 'FACTURA EXENTA') THEN 34
        WHEN doc_type IN ('39', 'boleta_electronica', 'BOLETA ELECTRONICA') THEN 39
        WHEN doc_type IN ('61', 'nota_credito', 'NOTA CREDITO') THEN 61
        WHEN doc_type IN ('56', 'nota_debito', 'NOTA DEBITO') THEN 56
        ELSE NULL
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para deduplicar ventas en sales_records asociándolas al DTE local
CREATE OR REPLACE FUNCTION public.fn_deduplicate_sales_record()
RETURNS trigger AS $$
DECLARE
    v_dte_id uuid;
    v_dte_type integer;
BEGIN
    -- Mapear tipo de documento a entero
    v_dte_type := public.fn_map_doc_type_to_dte(NEW.tipo_documento::text);
    
    IF v_dte_type IS NOT NULL THEN
        -- Buscar DTE emitido localmente con la misma clave de unicidad
        SELECT id INTO v_dte_id 
        FROM public.dte_issued
        WHERE organization_id = NEW.organization_id
          AND tipo_dte = v_dte_type
          AND folio = NEW.folio
        LIMIT 1;
        
        -- Si existe, asociar y marcar para no duplicar contabilidad
        IF v_dte_id IS NOT NULL THEN
            NEW.dte_issued_id := v_dte_id;
            NEW.es_suma := false; -- Excluir de sumatorias contables para evitar duplicados
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_deduplicate_sales_records
BEFORE INSERT ON public.sales_records
FOR EACH ROW
EXECUTE FUNCTION public.fn_deduplicate_sales_record();


-- ──────────────────────────────────────────────────────────
-- 2. SINCRONIZACIÓN AUTOMÁTICA CONTRATO-EMPLEADO
-- ──────────────────────────────────────────────────────────

-- Trigger para actualizar los datos del empleado maestro desde el contrato activo
CREATE OR REPLACE FUNCTION public.fn_sync_contract_to_employee()
RETURNS trigger AS $$
BEGIN
    -- Si el contrato pasa a estar activo/firmado, sincronizar al empleado maestro
    IF NEW.status IN ('activo', 'signed', 'approved') THEN
        UPDATE public.employees
        SET sueldo_base = NEW.sueldo_base,
            cargo = NEW.cargo,
            tipo_contrato = NEW.tipo_contrato::public.contract_type,
            horas_semanales = COALESCE(NEW.jornada_horas, 45),
            descripcion_cargo = NEW.descripcion_cargo,
            updated_at = now()
        WHERE id = NEW.employee_id
          AND organization_id = NEW.organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_contract_to_employee
AFTER INSERT OR UPDATE ON public.employment_contracts
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_contract_to_employee();


-- ──────────────────────────────────────────────────────────
-- 3. SINCRONIZACIÓN LIQUIDACIONES A LIBRO DE REMUNERACIONES
-- ──────────────────────────────────────────────────────────

-- Trigger para mantener payroll_book_details sincronizado con liquidaciones
CREATE OR REPLACE FUNCTION public.fn_sync_liquidation_to_payroll_book()
RETURNS trigger AS $$
DECLARE
    v_book_id uuid;
    v_book_number integer;
    v_org_rut text;
    v_org_name text;
    v_emp_nombres text;
    v_emp_rut text;
    v_emp_paterno text;
    v_emp_materno text;
    v_emp_cargo text;
    v_emp_tipo_contrato text;
    v_emp_horas integer;
BEGIN
    -- Solo sincronizar si la liquidación está finalizada/pagada
    IF NEW.status IN ('finalizada', 'pagada') THEN
        -- 1. Obtener datos de la organización
        SELECT rut_empresa, nombre INTO v_org_rut, v_org_name
        FROM public.organizations
        WHERE id = NEW.organization_id;
        
        -- 2. Obtener datos del empleado
        SELECT rut, nombres, apellido_paterno, apellido_materno, cargo, tipo_contrato::text, horas_semanales
        INTO v_emp_rut, v_emp_nombres, v_emp_paterno, v_emp_materno, v_emp_cargo, v_emp_tipo_contrato, v_emp_horas
        FROM public.employees
        WHERE id = NEW.employee_id;
        
        -- 3. Buscar o crear el libro de remuneraciones de ese periodo
        SELECT id INTO v_book_id
        FROM public.payroll_books
        WHERE organization_id = NEW.organization_id
          AND periodo = date_trunc('month', NEW.periodo)::date
        LIMIT 1;
        
        IF v_book_id IS NULL THEN
            -- Obtener consecutivo de libro
            SELECT COALESCE(MAX(book_number), 0) + 1 INTO v_book_number
            FROM public.payroll_books
            WHERE organization_id = NEW.organization_id;
            
            INSERT INTO public.payroll_books (
                organization_id, periodo, book_number, company_name, company_rut, status, generated_at
            ) VALUES (
                NEW.organization_id, date_trunc('month', NEW.periodo)::date, v_book_number, 
                COALESCE(v_org_name, 'Empresa'), COALESCE(v_org_rut, '1-9'), 'draft', now()
            ) RETURNING id INTO v_book_id;
        END IF;
        
        -- 4. Insertar o actualizar el detalle del empleado en el libro
        INSERT INTO public.payroll_book_details (
            payroll_book_id, employee_id, employee_rut, apellido_paterno, apellido_materno, nombres,
            cargo, dias_trabajados, horas_semanales, sueldo_base, gratificacion_legal, colacion,
            movilizacion, asignacion_familiar, total_haberes_imponibles, total_haberes_brutos,
            descuento_afp, descuento_salud, descuento_afc, impuesto_unico, otros_descuentos,
            total_descuentos, sueldo_liquido, afp_nom, salud_nom, afc_trab, afc_emp, sis_emp,
            tipo_contrato
        ) VALUES (
            v_book_id, NEW.employee_id, v_emp_rut, v_emp_paterno, v_emp_materno, v_emp_nombres,
            v_emp_cargo, NEW.dias_trabajados, COALESCE(v_emp_horas, 45), NEW.sueldo_base, NEW.gratificacion,
            NEW.asignacion_colacion, NEW.asignacion_movilizacion, NEW.asignacion_familiar,
            NEW.base_imponible_afp, NEW.total_haberes_brutos,
            NEW.afp, NEW.salud_total, NEW.afc_trabajador, NEW.impuesto_unico, NEW.otros_descuentos,
            NEW.total_descuentos, NEW.sueldo_liquido, NEW.afp_code, NEW.salud_code, NEW.afc_trabajador, NEW.afc_empresa, NEW.sis_empresa,
            COALESCE(v_emp_tipo_contrato, 'indefinido')
        )
        ON CONFLICT (id) DO UPDATE SET
            dias_trabajados = EXCLUDED.dias_trabajados,
            sueldo_base = EXCLUDED.sueldo_base,
            gratificacion_legal = EXCLUDED.gratificacion_legal,
            colacion = EXCLUDED.colacion,
            movilizacion = EXCLUDED.movilizacion,
            asignacion_familiar = EXCLUDED.asignacion_familiar,
            total_haberes_imponibles = EXCLUDED.total_haberes_imponibles,
            total_haberes_brutos = EXCLUDED.total_haberes_brutos,
            descuento_afp = EXCLUDED.descuento_afp,
            descuento_salud = EXCLUDED.descuento_salud,
            descuento_afc = EXCLUDED.descuento_afc,
            impuesto_unico = EXCLUDED.impuesto_unico,
            otros_descuentos = EXCLUDED.otros_descuentos,
            total_descuentos = EXCLUDED.total_descuentos,
            sueldo_liquido = EXCLUDED.sueldo_liquido;
            
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_liquidation_to_payroll_book
AFTER INSERT OR UPDATE ON public.liquidations
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_liquidation_to_payroll_book();


-- ──────────────────────────────────────────────────────────
-- 4. AUTOMATIZACIÓN DE REVERSAS CONTABLES
-- ──────────────────────────────────────────────────────────

-- Trigger para generar contracargos/reversas en journal_entries ante anulación de eventos
CREATE OR REPLACE FUNCTION public.fn_reverse_journal_entry()
RETURNS trigger AS $$
DECLARE
    v_orig_entry record;
    v_new_entry_id uuid;
    v_line record;
    v_seq integer;
BEGIN
    -- Si el evento pasa a estar reversed, procesar reversa contable
    IF NEW.status = 'reversed' AND OLD.status != 'reversed' THEN
        
        -- Buscar los asientos contables originales asociados al evento
        FOR v_orig_entry IN 
            SELECT * FROM public.journal_entries WHERE event_id = NEW.id
        LOOP
            -- Obtener número de asiento consecutivo para la reversa
            SELECT COALESCE(MAX(numero_asiento), 0) + 1 INTO v_seq
            FROM public.journal_entries
            WHERE organization_id = NEW.organization_id;
            
            -- Crear el encabezado del asiento de reversa
            INSERT INTO public.journal_entries (
                organization_id, fecha, glosa, numero_asiento, created_at, tipo_comprobante, event_id
            ) VALUES (
                NEW.organization_id, CURRENT_DATE, 'REVERSA AUTOMATICA: ' || v_orig_entry.glosa, v_seq, now(), 'T', NEW.id
            ) RETURNING id INTO v_new_entry_id;
            
            -- Copiar las líneas del asiento invirtiendo el tipo (Debe <-> Haber) para netear saldos
            FOR v_line IN 
                SELECT * FROM public.journal_entry_lines WHERE entry_id = v_orig_entry.id
            LOOP
                INSERT INTO public.journal_entry_lines (
                    entry_id, tipo, monto, account_id, organization_id, is_reconciled
                ) VALUES (
                    v_new_entry_id,
                    CASE WHEN v_line.tipo = 'debe' THEN 'haber' ELSE 'debe' END,
                    v_line.monto,
                    v_line.account_id,
                    v_line.organization_id,
                    true -- Quedan auto-conciliadas
                );
            END LOOP;
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_reverse_journal_entry
AFTER UPDATE ON public.accounting_events
FOR EACH ROW
EXECUTE FUNCTION public.fn_reverse_journal_entry();


-- ──────────────────────────────────────────────────────────
-- 5. UNIFICACIÓN DE MAPEO CONTABLE
-- ──────────────────────────────────────────────────────────

-- Agregar columna context_type a account_config_entries
ALTER TABLE public.account_config_entries 
ADD COLUMN IF NOT EXISTS context_type character varying DEFAULT 'general';

-- Migrar datos antiguos de account_mapping_rules de forma segura
INSERT INTO public.account_config_entries (organization_id, module_name, entry_key, account_id, is_active, context_type)
SELECT organization_id, 'mapping_rule', context, account_id, is_active, 'custom_context'
FROM public.account_mapping_rules
ON CONFLICT DO NOTHING;
