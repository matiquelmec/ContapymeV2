-- ============================================================
-- CONTAPYME V2 — MIGRACIÓN: CENTRALIZACIÓN CONTABLE
-- Fecha: 2026-03-18
-- Descripción: Tablas para mapeo automático de cuentas, configuración de módulos y detalles del F29.
-- ============================================================

-- 1. Reglas de Mapeo de Cuentas
CREATE TABLE IF NOT EXISTS public.account_mapping_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  context text NOT NULL,
  account_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT account_mapping_rules_pkey PRIMARY KEY (id),
  CONSTRAINT account_mapping_rules_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT account_mapping_rules_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id)
);

-- 2. Configuración Centralizada por Módulo
CREATE TABLE IF NOT EXISTS public.centralized_account_config (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  module_name character varying NOT NULL,
  transaction_type character varying NOT NULL,
  display_name character varying NOT NULL,
  tax_account_code character varying NOT NULL,
  tax_account_name character varying NOT NULL,
  revenue_account_code character varying NOT NULL,
  revenue_account_name character varying NOT NULL,
  asset_account_code character varying NOT NULL,
  asset_account_name character varying NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT centralized_account_config_pkey PRIMARY KEY (id),
  CONSTRAINT centralized_account_config_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- 3. Detalle de Casillas F29
CREATE TABLE IF NOT EXISTS public.f29_box_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  f29_id uuid,
  box_code integer NOT NULL,
  description text,
  value numeric NOT NULL,
  box_type text DEFAULT 'determinativo'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT f29_box_details_pkey PRIMARY KEY (id),
  CONSTRAINT f29_box_details_f29_id_fkey FOREIGN KEY (f29_id) REFERENCES public.f29_forms(id)
);

-- Habilitar RLS
ALTER TABLE public.account_mapping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centralized_account_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.f29_box_details ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS idx_f29_id ON public.f29_box_details(f29_id);
CREATE INDEX IF NOT EXISTS idx_account_mapping_org ON public.account_mapping_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_centralized_config_org ON public.centralized_account_config(organization_id);
