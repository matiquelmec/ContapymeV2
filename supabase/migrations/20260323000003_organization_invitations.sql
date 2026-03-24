-- ========================================================
-- Contapyme V2 — Sistema de Invitaciones B2B
-- Permite invitar a nuevos miembros vía email con roles predefinidos
-- ========================================================

-- Tabla de invitaciones
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  email text NOT NULL,
  role member_role NOT NULL DEFAULT 'viewer'::member_role,
  invited_by uuid NOT NULL,
  invited_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  status text NOT NULL DEFAULT 'pending' check (status in ('pending', 'accepted', 'expired')),
  
  CONSTRAINT organization_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT organization_invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT organization_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.organization_invitations(email);

-- RLS (Row Level Security)
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Admins/Owners can manage invitations" 
ON public.organization_invitations 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = public.organization_invitations.organization_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);
