-- ============================================================
-- 🏛️ MIGRACIÓN 10: Trazabilidad Bidireccional, RLS e Índices Estratégicos
-- Objetivo: Completar el ciclo de auditoría de reversiones, blindar RLS y acelerar el Ledger
-- ============================================================

-- 1. CLAVE AUTORREFERENCIAL EN ACCOUNTING_EVENTS
ALTER TABLE public.accounting_events 
  ADD COLUMN IF NOT EXISTS reversed_by_event_id uuid REFERENCES public.accounting_events(id) ON DELETE SET NULL;

-- 2. SEGURIDAD DE AISLAMIENTO MULTI-TENANT (RLS)
ALTER TABLE public.accounting_events ENABLE ROW LEVEL SECURITY;

-- Evitar duplicados de políticas si se re-ejecuta
DROP POLICY IF EXISTS org_isolation ON public.accounting_events;
CREATE POLICY "org_isolation" ON public.accounting_events 
  FOR ALL USING (public.check_org_access(organization_id));

-- 3. ÍNDICES DE RENDIMIENTO ESTRATÉGICOS (Ledger & Trial Balance Accelerator)
-- Acelera búsquedas y filtros por fecha en el libro diario/mayor por inquilino
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_fecha 
  ON public.journal_entries(organization_id, fecha DESC);

-- Acelera los reportes financieros por cuenta contable
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_org_account 
  ON public.journal_entry_lines(organization_id, account_id);

-- Acelera los JOINs críticos entre asientos y sus líneas de detalle
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry_id 
  ON public.journal_entry_lines(entry_id);

-- Acelera la búsqueda de asientos contables asociados a un evento de negocio
CREATE INDEX IF NOT EXISTS idx_journal_entries_event_id 
  ON public.journal_entries(event_id);

-- Acelera las comprobaciones de idempotencia de eventos activos/revertidos
CREATE INDEX IF NOT EXISTS idx_accounting_events_lookup 
  ON public.accounting_events(organization_id, event_type, status);

-- Notificar recarga de esquemas
NOTIFY pgrst, 'reload schema';
