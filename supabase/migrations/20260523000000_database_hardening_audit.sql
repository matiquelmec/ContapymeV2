-- ============================================================
-- 🛡️ HARDENING Y OPTIMIZACIÓN DE BASE DE DATOS: AUDITORÍA v1
-- Fecha: 2026-05-23
-- Objetivo: Resolver los hallazgos críticos de la auditoría:
--          1. Restricción única en f29_forms.
--          2. Creación de índices optimizados para contabilidad y GRC.
-- ============================================================

-- 1. Restricción de Unicidad Compuesta en f29_forms para evitar duplicados mensuales
ALTER TABLE public.f29_forms 
ADD CONSTRAINT uq_f29_organization_period UNIQUE (organization_id, periodo);

-- 2. Índices de Rendimiento para Balance de Comprobación y Libro Mayor
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_org_code_tipo_monto 
ON public.journal_entry_lines (organization_id, cuenta_codigo, tipo, monto);

CREATE INDEX IF NOT EXISTS idx_journal_entries_org_fecha 
ON public.journal_entries (organization_id, fecha);

-- 3. Índices de Rendimiento para Bitácora de Auditoría GRC (Evita escaneos secuenciales en logs)
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_user_action 
ON public.audit_logs (organization_id, user_id, action);
