-- ============================================================
-- 🏛️ MIGRACIÓN 18: Triggers de Guardia, Restricciones y Vistas
-- Objetivo: Garantizar la consistencia exigida en v9/v10
-- ============================================================

-- 1. Trigger de Guardia en journal_entries para bloquear periodos cerrados
CREATE OR REPLACE FUNCTION public.check_period_open()
RETURNS TRIGGER AS $$
DECLARE
  v_period_status TEXT;
  v_org_id UUID;
  v_fecha DATE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.organization_id;
    v_fecha := OLD.fecha;
  ELSE
    v_org_id := NEW.organization_id;
    v_fecha := NEW.fecha;
  END IF;

  SELECT status INTO v_period_status
  FROM public.accounting_periods
  WHERE organization_id = v_org_id
    AND ano  = EXTRACT(YEAR  FROM v_fecha)::integer
    AND mes  = EXTRACT(MONTH FROM v_fecha)::integer;

  IF v_period_status IN ('closed', 'locked') THEN
    RAISE EXCEPTION 'Período %/% está % — no se permiten movimientos.',
      EXTRACT(YEAR FROM v_fecha),
      EXTRACT(MONTH FROM v_fecha),
      v_period_status;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_period_check ON public.journal_entries;
CREATE TRIGGER trg_journal_period_check
  BEFORE INSERT OR UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.check_period_open();

-- 2. Restricción CHECK en vacation_ledger.dias
ALTER TABLE public.vacation_ledger DROP CONSTRAINT IF EXISTS vacation_ledger_dias_check;
ALTER TABLE public.vacation_ledger
  ADD CONSTRAINT vacation_ledger_dias_check CHECK (
    (tipo = 'accrual'    AND dias > 0) OR
    (tipo = 'usage'      AND dias < 0) OR
    (tipo = 'adjustment' AND dias != 0)
  );

-- 3. Crear Vista Materializada de saldos acumulados por cuenta
DROP MATERIALIZED VIEW IF EXISTS public.mv_account_balances;
CREATE MATERIALIZED VIEW public.mv_account_balances AS
SELECT
  je.organization_id,
  jel.account_id,
  COALESCE(SUM(CASE WHEN jel.tipo = 'debe' THEN jel.monto ELSE 0 END), 0)::bigint AS total_debe,
  COALESCE(SUM(CASE WHEN jel.tipo = 'haber' THEN jel.monto ELSE 0 END), 0)::bigint AS total_haber,
  (
    COALESCE(SUM(CASE WHEN jel.tipo = 'debe' THEN jel.monto ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN jel.tipo = 'haber' THEN jel.monto ELSE 0 END), 0)
  )::bigint AS saldo
FROM public.journal_entry_lines jel
JOIN public.journal_entries je ON jel.entry_id = je.id
GROUP BY je.organization_id, jel.account_id;

-- Índice único para refresco concurrente
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_account_balances_org_acc
  ON public.mv_account_balances(organization_id, account_id);

-- 4. Recrear RPC de refresco para asegurar permisos correctos
CREATE OR REPLACE FUNCTION public.refresh_accounting_balances()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_account_balances;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_accounting_balances() TO authenticated;

-- Notificar recarga de esquemas
NOTIFY pgrst, 'reload schema';
