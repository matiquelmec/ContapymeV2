-- 2026-03-23: Auditoría y Trazabilidad (Audit Logs)
-- Proposito: Registro de acciones críticas para cumplimiento IFRS y auditoría.

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    user_id uuid, -- Puede ser NULL si es el sistema
    action text NOT NULL, -- 'import_rcv', 'generate_accounting', 'close_month', etc.
    entity_type text, -- 'rcv_import', 'journal_entry', 'payroll'
    entity_id text, -- ID de registro afectado
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
    CONSTRAINT audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    -- user_id no tiene FK a auth.users para evitar problemas de borrado, pero se guarda el UUID
);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs visible by organization members" ON public.audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

-- Nota: El motor Python escribe en esta tabla usando service_role_key, por lo que no necesita política de INSERT.

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
