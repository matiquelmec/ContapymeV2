-- ==============================================================================
-- MIGRATION: 20260905000000_create_whatsapp_assistant_schema.sql
-- Módulo: Portal de Autoatención Laboral vía WhatsApp (ContaPymePUQ v21.0)
-- Estado por defecto: INACTIVO (is_active = false)
-- ==============================================================================

-- 1. Tabla de Configuración por Organización
CREATE TABLE IF NOT EXISTS public.whatsapp_org_settings (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT false,
    provider_type TEXT NOT NULL DEFAULT 'meta_cloud' CHECK (provider_type IN ('meta_cloud', 'web_sidecar')),
    phone_number_id TEXT,
    waba_id TEXT,
    verify_token TEXT,
    welcome_message TEXT DEFAULT '¡Hola! Bienvenido al portal de autoatención laboral. ¿En qué te puedo ayudar hoy?',
    allow_liquidation_download BOOLEAN NOT NULL DEFAULT true,
    allow_vacation_query BOOLEAN NOT NULL DEFAULT true,
    allow_certificate_download BOOLEAN NOT NULL DEFAULT true,
    allow_ai_riohs BOOLEAN NOT NULL DEFAULT true,
    require_2fa BOOLEAN NOT NULL DEFAULT true,
    business_hours_start TIME DEFAULT '08:30:00',
    business_hours_end TIME DEFAULT '18:30:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla de Sesiones Activas de Colaboradores
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    is_authenticated BOOLEAN NOT NULL DEFAULT false,
    auth_stage TEXT NOT NULL DEFAULT 'awaiting_rut' CHECK (auth_stage IN ('awaiting_rut', 'awaiting_2fa', 'authenticated')),
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (phone_number, organization_id)
);

-- 3. Tabla de Registro y Auditoría de Mensajes
CREATE TABLE IF NOT EXISTS public.whatsapp_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    intent_detected TEXT DEFAULT 'unknown',
    message_content TEXT,
    media_url TEXT,
    response_status TEXT DEFAULT 'delivered',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON public.whatsapp_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_org ON public.whatsapp_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_org_created ON public.whatsapp_message_logs(organization_id, created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.whatsapp_org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_org_settings' AND policyname = 'whatsapp_settings_member_select'
    ) THEN
        CREATE POLICY "whatsapp_settings_member_select"
            ON public.whatsapp_org_settings
            FOR SELECT
            TO authenticated
            USING (private.is_org_member(organization_id));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_org_settings' AND policyname = 'whatsapp_settings_admin_modify'
    ) THEN
        CREATE POLICY "whatsapp_settings_admin_modify"
            ON public.whatsapp_org_settings
            FOR ALL
            TO authenticated
            USING (private.has_org_role(organization_id, ARRAY['owner', 'admin']))
            WITH CHECK (private.has_org_role(organization_id, ARRAY['owner', 'admin']));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_sessions' AND policyname = 'whatsapp_sessions_member_select'
    ) THEN
        CREATE POLICY "whatsapp_sessions_member_select"
            ON public.whatsapp_sessions
            FOR ALL
            TO authenticated
            USING (private.is_org_member(organization_id));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_message_logs' AND policyname = 'whatsapp_logs_member_select'
    ) THEN
        CREATE POLICY "whatsapp_logs_member_select"
            ON public.whatsapp_message_logs
            FOR ALL
            TO authenticated
            USING (private.is_org_member(organization_id));
    END IF;
END $$;
