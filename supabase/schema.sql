-- ============================================================
-- CONTAPYME V2 — ESQUEMA MAESTRO CENTRALIZADO (Master Schema)
-- ============================================================
-- Versión:        3.1 (Alineación Total con DB Real)
-- Última sync:    2026-03-16
-- Ambiente:       Supabase PostgreSQL
-- ============================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TIPOS PERSONALIZADOS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_type') THEN
        CREATE TYPE contract_type AS ENUM ('indefinido', 'plazo_fijo', 'por_obra');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'liquidation_status') THEN
        CREATE TYPE liquidation_status AS ENUM ('borrador', 'aprobado', 'pagado', 'anulado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'depreciation_method') THEN
        CREATE TYPE depreciation_method AS ENUM ('lineal', 'acelerada');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_condition') THEN
        CREATE TYPE asset_condition AS ENUM ('activo', 'retirado', 'vendido', 'mantenimiento');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE member_role AS ENUM ('owner', 'accountant', 'viewer');
    END IF;
END $$;

-- 1. ORGANIZACIONES
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

-- 2. PERFILES Y MIEMBROS
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'viewer'::member_role,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. CONTABILIDAD
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  codigo character varying NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  nivel integer NOT NULL CHECK (nivel >= 1 AND nivel <= 4),
  parent_codigo character varying,
  tipo text NOT NULL,
  naturaleza text NOT NULL DEFAULT 'deudora',
  acepta_movimiento boolean DEFAULT true,
  activo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chart_of_accounts_unique_code UNIQUE (organization_id, codigo)
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
  account_id uuid REFERENCES public.chart_of_accounts(id),
  cuenta_codigo character varying NOT NULL,
  cuenta_nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('debe', 'haber')),
  monto bigint NOT NULL CHECK (monto > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. RCV
CREATE TABLE IF NOT EXISTS public.purchase_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  periodo date NOT NULL,
  tipo_documento text NOT NULL,
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
  journal_entry_id uuid REFERENCES public.journal_entries(id),
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
  journal_entry_id uuid REFERENCES public.journal_entries(id),
  import_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sales_records_unique_doc UNIQUE (organization_id, folio, rut_receptor, periodo)
);

CREATE TABLE IF NOT EXISTS public.rcv_imports (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  periodo date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('purchases', 'sales')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  total_docs integer DEFAULT 0,
  failed_docs integer DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. RECURSOS HUMANOS
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
  tipo_contrato contract_type NOT NULL DEFAULT 'indefinido'::contract_type,
  sueldo_base bigint NOT NULL,
  gratificacion_legal boolean NOT NULL DEFAULT true,
  afp text,
  prevision_salud text,
  monto_isapre bigint DEFAULT 0,
  cargas_familiares integer DEFAULT 0,
  asignacion_colacion bigint DEFAULT 0,
  asignacion_movilizacion bigint DEFAULT 0,
  horas_extra_pendientes integer DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS public.liquidations (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  periodo date NOT NULL,
  sueldo_base bigint NOT NULL,
  horas_extra bigint DEFAULT 0,
  bono_colacion bigint DEFAULT 0,
  bono_movilizacion bigint DEFAULT 0,
  otros_haberes bigint DEFAULT 0,
  total_haberes_brutos bigint NOT NULL,
  afp bigint DEFAULT 0,
  sis bigint DEFAULT 0,
  salud bigint DEFAULT 0,
  afc_trabajador bigint DEFAULT 0,
  impuesto_unico bigint DEFAULT 0,
  otros_descuentos bigint DEFAULT 0,
  total_descuentos bigint NOT NULL,
  sueldo_liquido bigint NOT NULL,
  afc_empresa bigint DEFAULT 0,
  seguro_invalidez bigint DEFAULT 0,
  status liquidation_status NOT NULL DEFAULT 'borrador'::liquidation_status,
  pdf_url text,
  generated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  calculation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  account_id_neto uuid REFERENCES public.chart_of_accounts(id),
  -- Campos granulares añadidos para alineación total
  gratificacion bigint DEFAULT 0,
  asignacion_colacion bigint DEFAULT 0,
  asignacion_movilizacion bigint DEFAULT 0,
  horas_extra_monto bigint DEFAULT 0,
  base_imponible_afp bigint DEFAULT 0,
  base_imponible_salud bigint DEFAULT 0,
  base_imponible_impuesto bigint DEFAULT 0,
  afp_comision bigint DEFAULT 0,
  sis_empresa bigint DEFAULT 0,
  afp_code character varying DEFAULT '',
  salud_code character varying DEFAULT '',
  uf_valor_usado numeric DEFAULT 0,
  dias_trabajados integer DEFAULT 30
);

-- 6. INDICADORES
CREATE TABLE IF NOT EXISTS public.economic_indicators (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo character varying NOT NULL UNIQUE,
  nombre text NOT NULL,
  valor numeric NOT NULL,
  fecha date NOT NULL,
  fuente text DEFAULT 'mindicador.cl',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. CONFIGURACIÓN CENTRALIZADA
CREATE TABLE IF NOT EXISTS public.centralized_account_config (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_name character varying NOT NULL,
  transaction_type character varying NOT NULL,
  display_name character varying NOT NULL,
  tax_account_code character varying NOT NULL,
  tax_account_name character varying DEFAULT '',
  revenue_account_code character varying NOT NULL,
  revenue_account_name character varying DEFAULT '',
  asset_account_code character varying NOT NULL,
  asset_account_name character varying DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 8. DOCUMENTOS Y FINIQUITOS
CREATE TABLE IF NOT EXISTS public.employment_contracts (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL DEFAULT 'contrato',
  tipo_contrato text NOT NULL DEFAULT 'indefinido',
  fecha_inicio date NOT NULL,
  fecha_termino_fijo date,
  sueldo_base bigint NOT NULL,
  cargo text NOT NULL,
  jornada_horas integer DEFAULT 45,
  gratificacion_tipo text DEFAULT 'legal',
  lugar_trabajo text,
  descripcion_cargo text,
  status text NOT NULL DEFAULT 'borrador',
  pdf_url text,
  firma_empleado_url text,
  version integer DEFAULT 1,
  parent_contract_id uuid REFERENCES public.employment_contracts(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_terminations (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  fecha_inicio date NOT NULL,
  fecha_termino date NOT NULL,
  causal_despido text NOT NULL,
  vacaciones_pendientes_dias numeric DEFAULT 0,
  monto_vacaciones bigint DEFAULT 0,
  monto_indemnizacion_anos bigint DEFAULT 0,
  monto_mes_aviso bigint DEFAULT 0,
  total_finiquito bigint NOT NULL,
  status liquidation_status NOT NULL DEFAULT 'borrador'::liquidation_status,
  pdf_url text,
  worked_days_last_month integer DEFAULT 0,
  pending_salary_amount bigint DEFAULT 0,
  total_vacation_days_earned numeric DEFAULT 0,
  vacation_days_taken numeric DEFAULT 0,
  vacation_daily_rate bigint DEFAULT 0,
  proportional_vacation_days numeric DEFAULT 0,
  proportional_vacation_amount bigint DEFAULT 0,
  severance_years_service numeric DEFAULT 0,
  severance_monthly_salary bigint DEFAULT 0,
  notice_indemnification_amount bigint DEFAULT 0,
  christmas_bonus_amount bigint DEFAULT 0,
  other_bonuses_amount bigint DEFAULT 0,
  pending_overtime_amount bigint DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.termination_causes (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_code character varying NOT NULL UNIQUE,
  article_name character varying NOT NULL,
  description text NOT NULL,
  requires_notice boolean NOT NULL DEFAULT false,
  notice_days integer DEFAULT 0,
  requires_severance boolean NOT NULL DEFAULT false,
  severance_calculation_type character varying,
  is_with_just_cause boolean NOT NULL DEFAULT false,
  category character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
