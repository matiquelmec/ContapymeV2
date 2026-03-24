-- ============================================================
-- CONTAPYME V2 — Onboarding: campo de control en profiles
-- Fecha: 2026-03-23
-- ============================================================

-- Agregar flag de onboarding completado al perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Marcar usuarios existentes como onboarding completado
UPDATE public.profiles SET onboarding_completed = true WHERE id IN (
  SELECT DISTINCT user_id FROM public.organization_members
);
