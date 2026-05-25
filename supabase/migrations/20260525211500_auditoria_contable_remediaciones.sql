-- ============================================================
-- 🏛️ MIGRACIÓN DE REMEDIACIÓN CONTABLE: AUDIT & GRC HARDENING
-- Versión: 1.0 (Omega Compliance)
-- Fecha: 25 de Mayo, 2026
-- ============================================================

-- ─── 1. SEGURIDAD DE PARTIDA DOBLE (TRIGGER DE BALANCE DIFERIDO) ───
-- Asegura que no se puedan confirmar transacciones con asientos descuadrados (Debe <> Haber)
-- Se define como un CONSTRAINT TRIGGER DEFERRABLE para que se evalúe al final de la transacción (commit),
-- permitiendo la inserción secuencial de las líneas del asiento.

CREATE OR REPLACE FUNCTION public.check_journal_entry_balance()
RETURNS trigger AS $$
DECLARE
  v_debe bigint;
  v_haber bigint;
  v_entry_id uuid;
BEGIN
  -- Obtener el ID del asiento a validar
  IF TG_OP = 'DELETE' THEN
    v_entry_id := OLD.entry_id;
  ELSE
    v_entry_id := NEW.entry_id;
  END IF;
  
  -- Calcular sumas de Debe y Haber para el asiento correspondiente
  SELECT 
    COALESCE(SUM(CASE WHEN tipo = 'debe' THEN monto ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END), 0)
  INTO v_debe, v_haber
  FROM public.journal_entry_lines
  WHERE entry_id = v_entry_id;
  
  -- Si el asiento no tiene líneas (ej. fue borrado por completo), es válido
  IF v_debe = 0 AND v_haber = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Si el asiento está descuadrado, lanzar excepción bloqueante
  IF v_debe <> v_haber THEN
    RAISE EXCEPTION 'Incumplimiento de Partida Doble (IFRS/SII): El asiento contable % está descuadrado por un desfase de % CLP (Total Debe: % CLP, Total Haber: % CLP). Verifique los asientos contables.', 
      v_entry_id, (v_debe - v_haber), v_debe, v_haber;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear el Constraint Trigger Diferible
DROP TRIGGER IF EXISTS trg_check_journal_entry_balance ON public.journal_entry_lines;
CREATE CONSTRAINT TRIGGER trg_check_journal_entry_balance
AFTER INSERT OR UPDATE OR DELETE
ON public.journal_entry_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.check_journal_entry_balance();


-- ─── 2. CONCILIACIÓN BANCARIA FLEXIBLE (ELIMINACIÓN DE RESTRICCIONES UNIQUE 1-A-1) ───
-- Permite conciliaciones complejas de N-a-M o 1-a-N eliminando las llaves únicas implícitas de las columnas
-- bank_line_id y journal_entry_line_id. La tabla ahora actúa como una relación intermedia flexible.

ALTER TABLE public.bank_reconciliations 
  DROP CONSTRAINT IF EXISTS bank_reconciliations_bank_line_id_key,
  DROP CONSTRAINT IF EXISTS bank_reconciliations_journal_entry_line_id_key;


-- ─── 3. RESGUARDO DE INTEGRIDAD DEL PLAN DE CUENTAS (TIPO DE CUENTA CHECK) ───
-- Restringe los valores de la columna tipo a clasificaciones estándar contables oficiales.

ALTER TABLE public.chart_of_accounts 
  DROP CONSTRAINT IF EXISTS check_chart_of_accounts_tipo;

ALTER TABLE public.chart_of_accounts 
  ADD CONSTRAINT check_chart_of_accounts_tipo 
  CHECK (tipo = ANY (ARRAY['activo'::text, 'pasivo'::text, 'patrimonio'::text, 'ingreso'::text, 'egreso'::text, 'gasto'::text]));
