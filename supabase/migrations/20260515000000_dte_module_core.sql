-- 🚀 MIGRACIÓN DTE MODULE CORE (Contapymepuq V2 Optimized)
-- DATE: 2026-05-15
-- DESCRIPTION: Infraestructura DTE compatible con el esquema real de Contapymepuq.

-- 0. EXTENSIONES (Necesarias para hashes y UUIDs)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TIPOS (Para mantener consistencia con tus otros módulos)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dte_status') THEN
        CREATE TYPE public.dte_status AS ENUM ('draft', 'signed', 'sent', 'accepted', 'rejected', 'annulled');
    END IF;
END $$;

-- 2. TABLA: dte_companies (Configuración de emisor por organización)
CREATE TABLE IF NOT EXISTS public.dte_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    rut TEXT NOT NULL,
    razon_social TEXT NOT NULL,
    giro TEXT,
    direccion TEXT,
    comuna TEXT,
    ciudad TEXT,
    acteco TEXT, -- Código de actividad económica principal
    resolucion_numero INTEGER,
    resolucion_fecha DATE,
    cert_subject TEXT,
    cert_not_after TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT dte_companies_org_rut_unique UNIQUE(organization_id, rut)
);

-- 3. TABLA: dte_issued (Documentos Tributarios Electrónicos emitidos)
CREATE TABLE IF NOT EXISTS public.dte_issued (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.dte_companies(id),
    tipo_dte INTEGER NOT NULL, -- 33 (Factura), 39 (Boleta), etc.
    folio INTEGER NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    receptor_rut TEXT NOT NULL,
    receptor_razon_social TEXT NOT NULL,
    receptor_giro TEXT,
    receptor_direccion TEXT,
    receptor_comuna TEXT,
    receptor_ciudad TEXT,
    monto_neto BIGINT NOT NULL DEFAULT 0,
    monto_exento BIGINT NOT NULL DEFAULT 0,
    monto_iva BIGINT NOT NULL DEFAULT 0,
    monto_total BIGINT NOT NULL DEFAULT 0,
    tasa_iva NUMERIC(5,2) NOT NULL DEFAULT 19.00,
    status public.dte_status NOT NULL DEFAULT 'draft',
    track_id TEXT, -- ID de seguimiento SII
    sii_status TEXT,
    sii_message TEXT,
    xml_content TEXT, -- XML firmado
    pdf_url TEXT,
    integrity_hash TEXT, -- Estándar ClicLaboral
    previous_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT dte_issued_org_type_folio_unique UNIQUE(organization_id, tipo_dte, folio)
);

-- 4. TABLA: dte_items (Detalle de cada DTE)
CREATE TABLE IF NOT EXISTS public.dte_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    dte_id UUID NOT NULL REFERENCES public.dte_issued(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(15,4) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'unid',
    unit_price BIGINT NOT NULL,
    total_amount BIGINT NOT NULL,
    discount_amount BIGINT DEFAULT 0,
    is_exempt BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLA: dte_caf_folios (Gestión de Folios SII)
CREATE TABLE IF NOT EXISTS public.dte_caf_folios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.dte_companies(id),
    tipo_dte INTEGER NOT NULL,
    range_start INTEGER NOT NULL,
    range_end INTEGER NOT NULL,
    last_used_folio INTEGER NOT NULL,
    environment TEXT NOT NULL DEFAULT 'certification' CHECK (environment IN ('certification', 'production')),
    caf_xml TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    authorized_at DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT dte_caf_unique UNIQUE(organization_id, company_id, tipo_dte, range_start, environment)
);

-- 🛡️ SEGURIDAD Y POLÍTICAS (RLS)
ALTER TABLE public.dte_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dte_issued ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dte_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dte_caf_folios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dte_issued_isolation" ON public.dte_issued 
    USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

-- [Triggers de integridad y auditoría se omiten en este mensaje por brevedad, pero están incluidos en el archivo]

-- 🛡️ TRIGGER: CRYPTO HASH CHAIN (Estándar ClicLaboral)
CREATE OR REPLACE FUNCTION public.compute_dte_integrity()
RETURNS TRIGGER AS $$
DECLARE
    prev_hash TEXT;
BEGIN
    SELECT integrity_hash INTO prev_hash 
    FROM public.dte_issued 
    WHERE company_id = NEW.company_id AND tipo_dte = NEW.tipo_dte
    ORDER BY folio DESC LIMIT 1;
    
    NEW.previous_hash := COALESCE(prev_hash, 'ORIGIN');
    NEW.integrity_hash := encode(digest(
        NEW.organization_id::TEXT || '|' ||
        NEW.company_id::TEXT || '|' ||
        NEW.tipo_dte::TEXT || '|' ||
        NEW.folio::TEXT || '|' ||
        NEW.monto_total::TEXT || '|' ||
        NEW.receptor_rut || '|' ||
        NEW.previous_hash,
        'sha256'
    ), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dte_integrity
    BEFORE INSERT ON public.dte_issued
    FOR EACH ROW EXECUTE FUNCTION public.compute_dte_integrity();

-- 🛡️ TRIGGER: AUDIT LOG (Standard Contapymepuq)
CREATE OR REPLACE FUNCTION public.log_dte_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (organization_id, user_id, action, entity_type, entity_id, details)
    VALUES (NEW.organization_id, auth.uid(), TG_OP, 'dte', NEW.id::TEXT, 
        jsonb_build_object('tipo_dte', NEW.tipo_dte, 'folio', NEW.folio, 'status', NEW.status));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dte_audit
    AFTER INSERT OR UPDATE ON public.dte_issued
    FOR EACH ROW EXECUTE FUNCTION public.log_dte_action();
