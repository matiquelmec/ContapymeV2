-- ============================================================
-- CONTAPYME V2 — Onboarding: Campos adicionales en perfiles
-- Fecha: 2026-03-23 (Patch)
-- ============================================================

-- Agregar campos para el número de teléfono y rol profesional al perfil del usuario
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS role text;

-- Asegurar que la cache del esquema se limpie después de DDL (opcional pero buena práctica)
NOTIFY pgrst, 'reload schema';
