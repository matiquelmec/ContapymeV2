-- ============================================================
-- 🏛️ MIGRACIÓN DE OPTIMIZACIÓN Y ENDURECIMIENTO DE RELACIONES (GRC)
-- Versión: 3.0 (Relational & Performance Hardening)
-- Fecha: 25 de Mayo, 2026
-- ============================================================

-- ─── 1. OPTIMIZACIÓN DE RENDIMIENTO EN LIBRO MAYOR (HALLAZGO H2) ───
-- Crea un índice compuesto sobre journal_entry_lines para acelerar las búsquedas masivas 
-- de la conciliación bancaria y la generación del Balance General / F29.
CREATE INDEX IF NOT EXISTS idx_journal_lines_reconciliation_perf 
  ON public.journal_entry_lines(organization_id, cuenta_codigo, is_reconciled);


-- ─── 2. MEJORA EN ELIMINACIÓN EN CASCADA DE ÍTEMS DTE (HALLAZGO H4) ───
-- Reconfigura la llave foránea de dte_items para permitir ON DELETE CASCADE. 
-- Esto evita errores al eliminar borradores (drafts) de facturas en el sistema.
ALTER TABLE public.dte_items 
  DROP CONSTRAINT IF EXISTS dte_items_dte_id_fkey;

ALTER TABLE public.dte_items 
  ADD CONSTRAINT dte_items_dte_id_fkey 
  FOREIGN KEY (dte_id) 
  REFERENCES public.dte_issued(id) 
  ON DELETE CASCADE;


-- ─── 3. CONTROL JERÁRQUICO COMPUESTO EN PLAN DE CUENTAS (HALLAZGO H1 - NIIF/IFRS) ───
-- Vincula parent_codigo a nivel base de datos utilizando el constraint único de organización preexistente.
-- Se añade como "NOT VALID" para que no bloquee registros históricos inconsistentes si los hubiere, 
-- pero garantiza que a partir de ahora toda subcuenta deba pertenecer a un nodo padre legítimo.
ALTER TABLE public.chart_of_accounts 
  DROP CONSTRAINT IF EXISTS fk_coa_parent_hierarchy;

ALTER TABLE public.chart_of_accounts 
  ADD CONSTRAINT fk_coa_parent_hierarchy 
  FOREIGN KEY (organization_id, parent_codigo) 
  REFERENCES public.chart_of_accounts(organization_id, codigo) 
  ON DELETE RESTRICT
  NOT VALID;
