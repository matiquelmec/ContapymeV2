-- 20260322000002_contract_modifications_system.sql
-- Sistema de Modificaciones Contractuales Inteligente (Clase Mundial)
-- Permite rastrear cambios de sueldo, jornada, cargo y tipo de contrato con aplicación automática.

CREATE TABLE IF NOT EXISTS public.contract_modifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    effective_date date NOT NULL,
    modification_type text NOT NULL CHECK (modification_type IN ('salary_change', 'hours_change', 'position_change', 'contract_type_change', 'other')),
    
    -- Almacenamos los cambios en un objeto JSONB para flexibilidad máxima
    -- Ejemplo: {"sueldo_base": 750000, "cargo": "Senior Contador"}
    changes jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    -- Valores anteriores para auditoría (Snapshot)
    old_values jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    reason text,
    document_reference_id uuid, -- Link opcional a un contrato generado en la tabla employment_contracts
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT contract_modifications_pkey PRIMARY KEY (id),
    CONSTRAINT contract_modifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
    CONSTRAINT contract_modifications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE,
    CONSTRAINT contract_modifications_document_fkey FOREIGN KEY (document_reference_id) REFERENCES public.employment_contracts(id) ON DELETE SET NULL
);

-- Habilitar RLS
ALTER TABLE public.contract_modifications ENABLE ROW LEVEL SECURITY;

-- Política de Seguridad (Aislamiento Multi-Tenant)
CREATE POLICY "contract_modifications_isolation" ON public.contract_modifications
    FOR ALL
    USING (organization_id = (SELECT active_organization_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id = (SELECT active_organization_id FROM profiles WHERE id = auth.uid()));

-- Índices para rendimiento
CREATE INDEX idx_contract_modifications_employee ON public.contract_modifications(employee_id, effective_date);
CREATE INDEX idx_contract_modifications_org ON public.contract_modifications(organization_id);

-- Función Inteligente: Obtener parámetros contractuales para una fecha específica
-- Esta función combina los datos base del empleado con la última modificación vigente.
CREATE OR REPLACE FUNCTION public.get_effective_contract_data(p_employee_id uuid, p_target_date date)
RETURNS jsonb AS $$
DECLARE
    base_data jsonb;
    mod_data jsonb;
    result jsonb;
BEGIN
    -- 1. Obtener datos base de la tabla employees
    SELECT jsonb_build_object(
        'sueldo_base', sueldo_base,
        'cargo', cargo,
        'tipo_contrato', tipo_contrato,
        'horas_semanales', horas_semanales,
        'nombres', nombres || ' ' || apellido_paterno
    ) INTO base_data
    FROM public.employees
    WHERE id = p_employee_id;

    -- 2. Buscar la modificación más reciente que ya sea efectiva
    SELECT changes INTO mod_data
    FROM public.contract_modifications
    WHERE employee_id = p_employee_id
      AND effective_date <= p_target_date
    ORDER BY effective_date DESC, created_at DESC
    LIMIT 1;

    -- 3. Mezclar base_data con mod_data (mod_data sobrescribe base_data)
    IF mod_data IS NOT NULL THEN
        result := base_data || mod_data;
    ELSE
        result := base_data;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario Profesional
COMMENT ON TABLE public.contract_modifications IS 'Almacena el historial de cambios contractuales para auditoría y cálculos retroactivos inteligentes.';
