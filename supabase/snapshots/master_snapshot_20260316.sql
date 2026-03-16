-- ============================================================
-- CONTAPYME V2 — SCHEMA MAESTRO (Sincronizado)
-- Versión: 2.2 | Fecha: 2026-03-16
-- Propósito: Única fuente de verdad de la estructura de DB.
-- Sincronización final: Refleja 100% la estructura de producción.
-- ============================================================

-- 1. EXTENSIONES Y TIPOS (Si existen en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLAS DE INFRAESTRUCTURA (Alineado con DB Real)

CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  rut_empresa character varying NOT NULL UNIQUE,
  nombre text NOT NULL,
  giro text,
  direccion text,
  comuna text,
  region text,
  email text,
  telefono character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.organization_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer', -- Referenciado como USER-DEFINED member_role
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  permissions jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT organization_members_pkey PRIMARY KEY (id),
  CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- 3. MÓDULO CONTABILIDAD E INDICADORES

CREATE TABLE public.chart_of_accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
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
  CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT chart_of_accounts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.economic_indicators (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  codigo character varying NOT NULL UNIQUE,
  nombre text NOT NULL,
  valor numeric NOT NULL,
  fecha date NOT NULL,
  fuente text DEFAULT 'mindicador.cl'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT economic_indicators_pkey PRIMARY KEY (id)
);

CREATE TABLE public.journal_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  fecha date NOT NULL,
  glosa text NOT NULL,
  numero_asiento integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entries_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.journal_entry_lines (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  entry_id uuid NOT NULL,
  cuenta_codigo character varying NOT NULL,
  cuenta_nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['debe'::text, 'haber'::text])),
  monto bigint NOT NULL CHECK (monto > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  account_id uuid,
  CONSTRAINT journal_entry_lines_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entry_lines_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT journal_entry_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id)
);

-- 4. MÓDULO RCV (REGISTRO COMPRA VENTAS) - CON BLINDAJE

CREATE TABLE public.rcv_imports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  periodo date NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['purchases'::text, 'sales'::text])),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  total_docs integer DEFAULT 0,
  failed_docs integer DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rcv_imports_pkey PRIMARY KEY (id),
  CONSTRAINT rcv_imports_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.purchase_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  periodo date NOT NULL,
  tipo_documento text NOT NULL, -- Referenciado como USER-DEFINED
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
  monto_calculado bigint DEFAULT 0,
  es_suma boolean DEFAULT true,
  import_id uuid,
  CONSTRAINT purchase_records_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_records_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT purchase_records_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT purchase_records_unique_doc UNIQUE (organization_id, folio, rut_emisor, periodo)
);

CREATE TABLE public.sales_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  periodo date NOT NULL,
  tipo_documento text NOT NULL, -- Referenciado como USER-DEFINED
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
  monto_calculado bigint DEFAULT 0,
  es_suma boolean DEFAULT true,
  import_id uuid,
  CONSTRAINT sales_records_pkey PRIMARY KEY (id),
  CONSTRAINT sales_records_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT sales_records_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT sales_records_unique_doc UNIQUE (organization_id, folio, rut_receptor, periodo)
);

-- 5. MÓDULO RECURSOS HUMANOS (RRHH)

CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
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
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.liquidations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  employee_id uuid NOT NULL,
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
  status text NOT NULL DEFAULT 'borrador',
  pdf_url text,
  generated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  calculation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  account_id_neto uuid,
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
  dias_trabajados integer DEFAULT 30,
  CONSTRAINT liquidations_pkey PRIMARY KEY (id),
  CONSTRAINT liquidations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT liquidations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT liquidations_account_id_neto_fkey FOREIGN KEY (account_id_neto) REFERENCES public.chart_of_accounts(id)
);

CREATE TABLE public.employment_contracts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  employee_id uuid NOT NULL,
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
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  version integer DEFAULT 1,
  parent_contract_id uuid,
  CONSTRAINT employment_contracts_pkey PRIMARY KEY (id),
  CONSTRAINT employment_contracts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT employment_contracts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- 6. MÓDULO ACTIVOS FIJOS Y F29

CREATE TABLE public.fixed_assets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  numero_serie text,
  fecha_adquisicion date NOT NULL,
  valor_adquisicion bigint NOT NULL,
  vida_util_meses integer NOT NULL,
  valor_residual bigint DEFAULT 0,
  metodo_depreciacion text NOT NULL DEFAULT 'lineal',
  condicion text NOT NULL DEFAULT 'activo',
  depreciacion_mensual bigint DEFAULT 0,
  depreciacion_acumulada bigint DEFAULT 0,
  valor_libro_actual bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ultimo_periodo_depreciado date,
  CONSTRAINT fixed_assets_pkey PRIMARY KEY (id),
  CONSTRAINT fixed_assets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.f29_forms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
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
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ventas_netas bigint DEFAULT 0,
  prestamo_solidario bigint DEFAULT 0,
  CONSTRAINT f29_forms_pkey PRIMARY KEY (id),
  CONSTRAINT f29_forms_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- 7. BLINDAJE DE INTEGRIDAD RCV (TRIGGERS)

CREATE OR REPLACE FUNCTION public.fn_secure_rcv_period()
RETURNS TRIGGER AS $$
BEGIN
    NEW.periodo := DATE_TRUNC('month', NEW.fecha_docto)::DATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_secure_purchase_period
BEFORE INSERT OR UPDATE OF fecha_docto, periodo ON public.purchase_records
FOR EACH ROW EXECUTE FUNCTION public.fn_secure_rcv_period();

CREATE TRIGGER tr_secure_sales_period
BEFORE INSERT OR UPDATE OF fecha_docto, periodo ON public.sales_records
FOR EACH ROW EXECUTE FUNCTION public.fn_secure_rcv_period();

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_purchase_records_org_periodo ON public.purchase_records(organization_id, periodo);
CREATE INDEX IF NOT EXISTS idx_sales_records_org_periodo    ON public.sales_records(organization_id, periodo);
