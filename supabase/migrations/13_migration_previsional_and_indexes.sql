-- ============================================================
-- 🏛️ MIGRACIÓN 13: Normalización Previsional y Ajuste de Índices
-- Objetivo: Asegurar restricciones en afp_configs / health_configs e índices críticos
-- ============================================================

-- 1. Restricciones de integridad para asegurar estructuras JSONB válidas
ALTER TABLE public.organization_payroll_settings 
  ADD CONSTRAINT chk_afp_configs_jsonb_array 
  CHECK (jsonb_typeof(afp_configs) = 'array');

ALTER TABLE public.organization_payroll_settings 
  ADD CONSTRAINT chk_health_configs_jsonb_array 
  CHECK (jsonb_typeof(health_configs) = 'array');

-- 2. Índices de rendimiento para mitigar joins de RLS basados en membresía
CREATE INDEX IF NOT EXISTS idx_jel_entry_id 
  ON public.journal_entry_lines(entry_id);

CREATE INDEX IF NOT EXISTS idx_payroll_book_details_book 
  ON public.payroll_book_details(payroll_book_id);

-- Notificar recarga de esquemas
NOTIFY pgrst, 'reload schema';
