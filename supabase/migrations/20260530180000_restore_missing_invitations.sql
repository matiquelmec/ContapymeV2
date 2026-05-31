-- ============================================================
-- CONTAPYME V2 — MIGRACIÓN: RESTAURACIÓN DE INVITACIONES
-- Fecha: 2026-05-30
-- Descripción: Registro de tabla de invitaciones, índices y políticas RLS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer'::text,
  invited_by uuid NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'::text),
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  CONSTRAINT organization_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT organization_invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT organization_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.organization_invitations(email);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad Multi-Tenant
DROP POLICY IF EXISTS organization_invitations_admin_select ON public.organization_invitations;
DROP POLICY IF EXISTS organization_invitations_admin_insert ON public.organization_invitations;
DROP POLICY IF EXISTS organization_invitations_admin_update ON public.organization_invitations;
DROP POLICY IF EXISTS organization_invitations_admin_delete ON public.organization_invitations;

CREATE POLICY organization_invitations_admin_select
  ON public.organization_invitations
  FOR SELECT
  TO authenticated
  USING (private.has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY organization_invitations_admin_insert
  ON public.organization_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    private.has_org_role(organization_id, ARRAY['owner', 'admin'])
    AND invited_by = auth.uid()
  );

CREATE POLICY organization_invitations_admin_update
  ON public.organization_invitations
  FOR UPDATE
  TO authenticated
  USING (private.has_org_role(organization_id, ARRAY['owner', 'admin']))
  WITH CHECK (private.has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY organization_invitations_admin_delete
  ON public.organization_invitations
  FOR DELETE
  TO authenticated
  USING (private.has_org_role(organization_id, ARRAY['owner', 'admin']));
