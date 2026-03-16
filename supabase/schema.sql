-- ============================================================
-- CONTAPYME V2 — ESQUEMA MAESTRO ÚNICO (Source of Truth)
-- ============================================================
-- Versión:        2.3 (Sincronización Real Supabase)
-- Última sync:    2026-03-16
-- Ambiente:       Supabase PostgreSQL con RLS
-- ============================================================

-- 1. Tablas de RRHH y Configuración
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  rut_empresa character varying NOT NULL UNIQUE,
  nombre text NOT NULL,
  giro text,
  direccion text,
  comuna text,
  region text,
  email text,
  telefono character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rut character varying NOT NULL,
  nombres text NOT NULL,
  apellido_paterno text NOT NULL,
  apellido_materno text,
  fecha_nacimiento date,
  fecha_ingreso date NOT NULL,
  fecha_termino date,
  cargo text,
  departamento text,
  tipo_contrato text NOT NULL DEFAULT 'indefinido',
  sueldo_base bigint NOT NULL,
  gratificacion_legal boolean NOT NULL DEFAULT true,
  afp text,
  prevision_salud text,
  monto_isapre bigint DEFAULT 0,
  cargas_familiares integer DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (organization_id, rut)
);

CREATE TABLE IF NOT EXISTS public.organization_payroll_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  afp_configs jsonb NOT NULL DEFAULT '[]'::jsonb,
  health_configs jsonb NOT NULL DEFAULT '[]'::jsonb,
  uf_tope_afp numeric DEFAULT 87.8,
  uf_tope_salud numeric DEFAULT 83.3,
  sueldo_minimo bigint DEFAULT 529000,
  limite_asignacion_familiar bigint DEFAULT 1000000,
  asignacion_tramo_a bigint DEFAULT 13596,
  asignacion_tramo_b bigint DEFAULT 8397,
  asignacion_tramo_c bigint DEFAULT 2798,
  afc_indefinido_trabajador_pct numeric DEFAULT 0.6,
  afc_indefinido_empresa_pct numeric DEFAULT 2.4,
  afc_fijo_empresa_pct numeric DEFAULT 3.0,
  mutual_code character varying DEFAULT 'ACHS'::character varying,
  caja_compensacion_code character varying DEFAULT ''::character varying,
  rep_legal_nombre text DEFAULT ''::text,
  rep_legal_rut character varying DEFAULT ''::character varying,
  rep_legal_cargo text DEFAULT 'GERENTE GENERAL'::text,
  last_previred_sync timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Contabilidad (RCV y Asientos)
CREATE TABLE IF NOT EXISTS public.purchase_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  periodo date NOT NULL,
  tipo_documento text NOT NULL, -- Cambiado de ENUM a text para flexibilidad regional si aplica
  folio bigint NOT NULL,
  rut_emisor character varying NOT NULL,
  razon_social_emisor text,
  fecha_docto date NOT NULL,
  monto_neto bigint DEFAULT 0,
  monto_exento bigint DEFAULT 0,
  monto_iva bigint DEFAULT 0,
  monto_total bigint NOT NULL,
  monto_calculado bigint DEFAULT 0,
  es_suma boolean DEFAULT true,
  journal_entry_id uuid,
  import_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT purchase_records_unique_doc UNIQUE (organization_id, folio, rut_emisor, periodo)
);

CREATE TABLE IF NOT EXISTS public.sales_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  periodo date NOT NULL,
  tipo_documento text NOT NULL,
  folio bigint NOT NULL,
  rut_receptor character varying NOT NULL,
  razon_social_receptor text,
  fecha_docto date NOT NULL,
  monto_neto bigint DEFAULT 0,
  monto_exento bigint DEFAULT 0,
  monto_iva bigint DEFAULT 0,
  monto_total bigint NOT NULL,
  monto_calculado bigint DEFAULT 0,
  es_suma boolean DEFAULT true,
  journal_entry_id uuid,
  import_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sales_records_unique_doc UNIQUE (organization_id, folio, rut_receptor, periodo)
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  glosa text NOT NULL,
  numero_asiento integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  cuenta_codigo character varying NOT NULL,
  cuenta_nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('debe', 'haber')),
  monto bigint NOT NULL CHECK (monto > 0),
  account_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
