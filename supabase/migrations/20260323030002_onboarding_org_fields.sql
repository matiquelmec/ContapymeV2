-- ============================================================
-- CONTAPYME V2 — Onboarding: Campo régimen tributario
-- Fecha: 2026-03-23 (Patch)
-- ============================================================

-- Agregar el régimen tributario a las organizaciones
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS regimen_tributario text DEFAULT 'pro_pyme';

-- Refrescar la caché interna de Supabase
NOTIFY pgrst, 'reload schema';
