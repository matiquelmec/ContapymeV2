-- ============================================================
-- 🏛️ MIGRACIÓN 11: Homogeneidad Contable e Índices de Rendimiento Críticos
-- Objetivo: Migrar activos fijos a accounting_events, eliminar fixed_asset_id y desplegar 7 índices
-- ============================================================

-- A. MIGRACIÓN DE DATOS HISTÓRICOS (ACTIVOS FIJOS A ACCOUNTING_EVENTS)
DO $$
DECLARE
  r RECORD;
  v_event_id uuid;
BEGIN
  FOR r IN 
    SELECT id, organization_id, fixed_asset_id, fecha, glosa 
    FROM public.journal_entries 
    WHERE fixed_asset_id IS NOT NULL
  LOOP
    -- Insertar evento correspondiente si no existe
    INSERT INTO public.accounting_events (organization_id, event_type, source_id, status, notes, created_at)
    VALUES (
      r.organization_id, 
      'asset_depreciation', 
      r.fixed_asset_id || '_' || substring(r.fecha::text from 1 for 7), 
      'active',
      'Migrado: ' || r.glosa,
      now()
    )
    ON CONFLICT (organization_id, event_type, source_id) WHERE status = 'active'
    DO UPDATE SET notes = EXCLUDED.notes
    RETURNING id INTO v_event_id;

    -- Si no retornó ID por conflicto, buscar el existente
    IF v_event_id IS NULL THEN
      SELECT id INTO v_event_id 
      FROM public.accounting_events 
      WHERE organization_id = r.organization_id 
      AND event_type = 'asset_depreciation' 
      AND source_id = r.fixed_asset_id || '_' || substring(r.fecha::text from 1 for 7)
      AND status = 'active';
    END IF;

    -- Sincronizar el asiento al nuevo evento
    UPDATE public.journal_entries 
    SET event_id = v_event_id 
    WHERE id = r.id;
  END LOOP;
END $$;

-- B. LIMPIEZA DE COLUMNAS Y ÍNDICES OBSOLETOS
-- Eliminar índice viejo de fixed_asset
DROP INDEX IF EXISTS public.idx_journal_entries_fixed_asset;

-- Eliminar FK y columna
ALTER TABLE public.journal_entries DROP COLUMN IF EXISTS fixed_asset_id;

-- Limpiar índices antiguos de la fase anterior para reemplazarlos por los de alto rendimiento
DROP INDEX IF EXISTS public.idx_journal_entries_org_fecha;
DROP INDEX IF EXISTS public.idx_journal_entry_lines_org_account;

-- C. DESPLIEGUE DE ÍNDICES DE RENDIMIENTO DE ALTO IMPACTO
-- 1. Balance general y libro mayor (query más frecuente)
CREATE INDEX IF NOT EXISTS idx_jel_account_org
  ON public.journal_entry_lines(organization_id, account_id)
  INCLUDE (monto, tipo);

-- 2. Asientos por período (segundo más frecuente)
CREATE INDEX IF NOT EXISTS idx_je_org_fecha
  ON public.journal_entries(organization_id, fecha DESC);

-- 3. Líneas bancarias sin conciliar (conciliación bancaria)
CREATE INDEX IF NOT EXISTS idx_bsl_pendientes
  ON public.bank_statement_lines(bank_account_id, is_reconciled)
  WHERE is_reconciled = false;

-- 4. DTE por receptor y fecha (estado de cuenta clientes)
CREATE INDEX IF NOT EXISTS idx_dte_receptor
  ON public.dte_issued(organization_id, receptor_rut, fecha_emision DESC);

-- 5. Liquidaciones por período y estado
CREATE INDEX IF NOT EXISTS idx_liq_periodo
  ON public.liquidations(organization_id, periodo, status);

-- 6. Eventos contables sin revertir (integridad contable)
CREATE INDEX IF NOT EXISTS idx_events_activos
  ON public.accounting_events(organization_id, event_type)
  WHERE status = 'active';

-- 7. Plan de cuentas activas por org (se consulta en cada asiento)
CREATE INDEX IF NOT EXISTS idx_coa_org_activo
  ON public.chart_of_accounts(organization_id, codigo)
  WHERE activo = true;

-- Notificar recarga de esquemas
NOTIFY pgrst, 'reload schema';
