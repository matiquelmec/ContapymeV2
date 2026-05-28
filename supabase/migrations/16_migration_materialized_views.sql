-- ============================================================
-- 🏛️ MIGRACIÓN 16: Vistas Materializadas para Balances
-- Objetivo: Acelerar reportes contables mediante pre-cálculo
-- ============================================================

-- 1. Crear Vista Materializada de saldos acumulados por cuenta
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_account_balances AS
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

-- 2. Crear índice único para permitir REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_account_balances_org_acc
  ON public.mv_account_balances(organization_id, account_id);

-- 3. Crear RPC para refrescar la vista materializada
CREATE OR REPLACE FUNCTION public.refresh_accounting_balances()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_account_balances;
END;
$$;

-- Otorgar permisos de ejecución de la RPC a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.refresh_accounting_balances() TO authenticated;

-- Notificar recarga de esquemas
NOTIFY pgrst, 'reload schema';
