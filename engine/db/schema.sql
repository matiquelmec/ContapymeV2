-- ============================================================
-- CONTAPYME V2 — ESQUEMA MAESTRO FINAL (Sincronizado Nivel Mundial)
-- Estado: Producción / Sincronizado
-- Fecha: 2026-03-15
-- ============================================================

-- 0. CONFIGURACIÓN INICIAL Y FUNCIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION get_my_org_ids()
RETURNS TABLE (org_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- 1. TIPOS PERSONALIZADOS (ENUMS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'accountant', 'viewer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_type') THEN
        CREATE TYPE public.contract_type AS ENUM ('indefinido', 'plazo_fijo', 'obra_faena', 'honorarios');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_condition') THEN
        CREATE TYPE public.asset_condition AS ENUM ('activo', 'vendido', 'dado_de_baja', 'en_reparacion');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'depreciation_method') THEN
        CREATE TYPE public.depreciation_method AS ENUM ('lineal', 'acelerada');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'liquidation_status') THEN
        CREATE TYPE public.liquidation_status AS ENUM ('borrador', 'aprobada', 'pagada', 'anulada');
    END IF;
END $$;

-- 2. TABLAS NÚCLEO Y PERFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'viewer',
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. TABLAS CONTABLES Y MAPEO
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  codigo character varying NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  nivel integer NOT NULL CHECK (nivel >= 1 AND nivel <= 4),
  parent_codigo character varying,
  tipo text NOT NULL,
  naturaleza text NOT NULL DEFAULT 'deudora'::text,
  acepta_movimiento boolean DEFAULT true,
  activo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, codigo)
);

CREATE TABLE IF NOT EXISTS public.account_mapping_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  context text NOT NULL,
  account_id uuid REFERENCES public.chart_of_accounts(id),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.centralized_account_config (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
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
  UNIQUE(organization_id, module_name, transaction_type)
);

-- 4. TABLAS DE RRHH (REMUNERACIONES)
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
  tipo_contrato public.contract_type NOT NULL DEFAULT 'indefinido'::contract_type,
  sueldo_base bigint NOT NULL,
  gratificacion_legal boolean NOT NULL DEFAULT true,
  afp text,
  prevision_salud text,
  monto_isapre bigint DEFAULT 0,
  cargas_familiares integer DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, rut)
);

CREATE TABLE IF NOT EXISTS public.employment_contracts (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL DEFAULT 'contrato'::text,
  tipo_contrato text NOT NULL DEFAULT 'indefinido'::text,
  fecha_inicio date NOT NULL,
  fecha_termino_fijo date,
  sueldo_base bigint NOT NULL,
  cargo text NOT NULL,
  jornada_horas integer DEFAULT 45,
  gratificacion_tipo text DEFAULT 'legal'::text,
  lugar_trabajo text,
  descripcion_cargo text,
  status text NOT NULL DEFAULT 'borrador'::text,
  pdf_url text,
  firma_empleado_url text,
  version integer DEFAULT 1,
  parent_contract_id uuid REFERENCES public.employment_contracts(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.liquidations (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id),
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
  status public.liquidation_status NOT NULL DEFAULT 'borrador'::liquidation_status,
  pdf_url text,
  generated_at timestamp with time zone,
  calculation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  account_id_neto uuid REFERENCES public.chart_of_accounts(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, employee_id, periodo)
);

CREATE TABLE IF NOT EXISTS public.termination_causes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_code VARCHAR(20) NOT NULL UNIQUE,
    article_name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requires_notice BOOLEAN NOT NULL DEFAULT false,
    notice_days INTEGER DEFAULT 0,
    requires_severance BOOLEAN NOT NULL DEFAULT false,
    severance_calculation_type VARCHAR(50),
    is_with_just_cause BOOLEAN NOT NULL DEFAULT false,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  status public.liquidation_status NOT NULL DEFAULT 'borrador'::liquidation_status,
  pdf_url text,
  worked_days_last_month INTEGER DEFAULT 0,
  pending_salary_amount BIGINT DEFAULT 0,
  total_vacation_days_earned DECIMAL(6,2) DEFAULT 0,
  vacation_days_taken DECIMAL(6,2) DEFAULT 0,
  vacation_daily_rate BIGINT DEFAULT 0,
  proportional_vacation_days DECIMAL(6,2) DEFAULT 0,
  proportional_vacation_amount BIGINT DEFAULT 0,
  severance_years_service DECIMAL(4,2) DEFAULT 0,
  severance_monthly_salary BIGINT DEFAULT 0,
  notice_indemnification_amount BIGINT DEFAULT 0,
  christmas_bonus_amount BIGINT DEFAULT 0,
  other_bonuses_amount BIGINT DEFAULT 0,
  pending_overtime_amount BIGINT DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. TABLAS TRIBUTARIAS (F29 Y RCV)
CREATE TABLE IF NOT EXISTS public.f29_forms (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  periodo date NOT NULL,
  debito_fiscal bigint DEFAULT 0,
  credito_fiscal bigint DEFAULT 0,
  iva_determinado bigint DEFAULT 0,
  iva_a_pagar bigint DEFAULT 0,
  ppm_neto bigint DEFAULT 0,
  ppm_tasa numeric DEFAULT 0,
  retencion_honorarios bigint DEFAULT 0,
  total_a_pagar bigint DEFAULT 0,
  total_a_favor bigint DEFAULT 0,
  storage_path text,
  extraction_method text DEFAULT 'pdfplumber'::text,
  extraction_confidence numeric,
  parsed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.f29_box_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  f29_id uuid REFERENCES public.f29_forms(id) ON DELETE CASCADE,
  box_code integer NOT NULL,
  description text,
  value numeric NOT NULL,
  box_type text DEFAULT 'determinativo'::text,
  created_at timestamp with time zone DEFAULT now()
);

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
  journal_entry_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, tipo_documento, folio, rut_emisor)
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
  journal_entry_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, tipo_documento, folio, rut_receptor)
);

-- 6. TABLAS DE ACTIVOS Y EXTRAS
CREATE TABLE IF NOT EXISTS public.fixed_assets (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  numero_serie text,
  fecha_adquisicion date NOT NULL,
  valor_adquisicion bigint NOT NULL,
  vida_util_meses integer NOT NULL,
  valor_residual bigint DEFAULT 0,
  metodo_depreciacion public.depreciation_method NOT NULL DEFAULT 'lineal'::depreciation_method,
  condicion public.asset_condition NOT NULL DEFAULT 'activo'::asset_condition,
  depreciacion_mensual bigint DEFAULT 0,
  depreciacion_acumulada bigint DEFAULT 0,
  valor_libro_actual bigint,
  ultimo_periodo_depreciado date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.economic_indicators (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo character varying NOT NULL UNIQUE,
  nombre text NOT NULL,
  valor numeric NOT NULL,
  fecha date NOT NULL,
  fuente text DEFAULT 'mindicador.cl'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. POLÍTICAS DE SEGURIDAD RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mapping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.f29_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_terminations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termination_causes ENABLE ROW LEVEL SECURITY;

-- Políticas Base
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users view organizations" ON public.organizations;
CREATE POLICY "Users view organizations" ON public.organizations FOR SELECT USING (id IN (SELECT get_my_org_ids()));

DROP POLICY IF EXISTS "Members access everything in their org" ON public.employees;
CREATE POLICY "Members access everything in their org" ON public.employees FOR ALL USING (organization_id IN (SELECT get_my_org_ids()));

-- Replicar política para el resto de tablas por organización
CREATE POLICY "Members access COA" ON public.chart_of_accounts FOR ALL USING (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "Members access Mapping" ON public.account_mapping_rules FOR ALL USING (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "Members access Liquidations" ON public.liquidations FOR ALL USING (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "Members access Contracts" ON public.employment_contracts FOR ALL USING (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "Members access Assets" ON public.fixed_assets FOR ALL USING (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "Members access Purchases" ON public.purchase_records FOR ALL USING (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "Members access Sales" ON public.sales_records FOR ALL USING (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "Members access Terminations" ON public.employee_terminations FOR ALL USING (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "Public read access for causes" ON public.termination_causes FOR SELECT USING (true);
