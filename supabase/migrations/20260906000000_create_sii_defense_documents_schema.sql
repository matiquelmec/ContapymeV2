-- ==============================================================================
-- MIGRATION: 20260906000000_create_sii_defense_documents_schema.sql
-- Módulo: Asistente Legal Tributario & Escritos de Descargo SII (ContaPymePUQ v22.0)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sii_defense_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('boletas_vs_facturas', 'citacion_art_63', 'rectificatoria_f29', 'condonacion_multas')),
    titulo TEXT NOT NULL,
    target_entity TEXT NOT NULL DEFAULT 'Dirección Regional SII XII Región Magallanes y Antártica Chilena',
    periodos_involucrados TEXT[] NOT NULL DEFAULT '{}',
    representante_legal_nombre TEXT,
    representante_legal_rut TEXT,
    domicilio TEXT,
    resumen_argumentos TEXT,
    iva_declarado_total NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'generado' CHECK (status IN ('borrador', 'generado', 'presentado_sii', 'aceptado', 'rechazado')),
    file_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_sii_defense_org ON public.sii_defense_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_sii_defense_created ON public.sii_defense_documents(organization_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.sii_defense_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sii_defense_documents' AND policyname = 'sii_defense_member_select'
    ) THEN
        CREATE POLICY "sii_defense_member_select"
            ON public.sii_defense_documents
            FOR SELECT
            TO authenticated
            USING (private.is_org_member(organization_id));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sii_defense_documents' AND policyname = 'sii_defense_member_modify'
    ) THEN
        CREATE POLICY "sii_defense_member_modify"
            ON public.sii_defense_documents
            FOR ALL
            TO authenticated
            USING (private.has_org_role(organization_id, ARRAY['owner', 'admin', 'accountant']))
            WITH CHECK (private.has_org_role(organization_id, ARRAY['owner', 'admin', 'accountant']));
    END IF;
END $$;
