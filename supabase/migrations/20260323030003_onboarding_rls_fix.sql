-- ============================================================
-- CONTAPYME V2 — Onboarding: RLS para crear empresas
-- Fecha: 2026-03-23 (Patch)
-- ============================================================

-- Permitir a cualquier usuario autenticado crear una organización
CREATE POLICY "Permitir a usuarios crear empresas"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir a cualquier usuario autenticado insertar en organization_members
-- (Para que el creador de la empresa pueda asignarse como owner)
CREATE POLICY "Permitir a usuarios unirse a empresas nuevas"
  ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
