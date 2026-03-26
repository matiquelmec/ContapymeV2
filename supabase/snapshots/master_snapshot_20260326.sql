-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Snapshot Date: 2026-03-26
-- Contapyme V2 Master Snapshot

CREATE TABLE public.account_mapping_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  context text NOT NULL,
  account_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT account_mapping_rules_pkey PRIMARY KEY (id),
  CONSTRAINT account_mapping_rules_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT account_mapping_rules_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_type text DEFAULT 'corriente'::text,
  currency text DEFAULT 'CLP'::text,
  chart_account_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bank_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT bank_accounts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT bank_accounts_chart_account_id_fkey FOREIGN KEY (chart_account_id) REFERENCES public.chart_of_accounts(id)
);
CREATE TABLE public.bank_mapping_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  search_pattern text NOT NULL,
  target_account_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bank_mapping_rules_pkey PRIMARY KEY (id),
  CONSTRAINT bank_mapping_rules_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT bank_mapping_rules_target_account_id_fkey FOREIGN KEY (target_account_id) REFERENCES public.chart_of_accounts(id)
);
CREATE TABLE public.bank_reconciliations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bank_line_id uuid UNIQUE,
  journal_entry_line_id uuid NOT NULL UNIQUE,
  match_type text DEFAULT 'manual'::text CHECK (match_type = ANY (ARRAY['manual'::text, 'automatic'::text, 'ai_suggested'::text])),
  confidence_score double precision DEFAULT 1.0,
  reconciled_at timestamp with time zone DEFAULT now(),
  reconciled_by uuid,
  status text DEFAULT 'reconciled'::text,
  notes text,
  organization_id uuid NOT NULL,
  CONSTRAINT bank_reconciliations_pkey PRIMARY KEY (id),
  CONSTRAINT bank_reconciliations_bank_line_id_fkey FOREIGN KEY (bank_line_id) REFERENCES public.bank_statement_lines(id),
  CONSTRAINT bank_reconciliations_reconciled_by_fkey FOREIGN KEY (reconciled_by) REFERENCES auth.users(id),
  CONSTRAINT bank_reconciliations_journal_entry_line_id_fkey FOREIGN KEY (journal_entry_line_id) REFERENCES public.journal_entry_lines(id),
  CONSTRAINT bank_reconciliations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.bank_statement_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  statement_id uuid,
  bank_account_id uuid NOT NULL,
  fecha date NOT NULL,
  descripcion text NOT NULL,
  monto bigint NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['cargo'::text, 'abono'::text])),
  referencia_bancaria text,
  rut_tercero text,
  is_reconciled boolean DEFAULT false,
  external_id text,
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT bank_statement_lines_pkey PRIMARY KEY (id),
  CONSTRAINT bank_statement_lines_statement_id_fkey FOREIGN KEY (statement_id) REFERENCES public.bank_statements(id),
  CONSTRAINT bank_statement_lines_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id),
  CONSTRAINT bank_statement_lines_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.bank_statements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bank_account_id uuid NOT NULL,
  period date NOT NULL,
  file_name text,
  original_balance bigint DEFAULT 0,
  final_balance bigint DEFAULT 0,
  status text DEFAULT 'processed'::text CHECK (status = ANY (ARRAY['pending'::text, 'processed'::text, 'archived'::text])),
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT bank_statements_pkey PRIMARY KEY (id),
  CONSTRAINT bank_statements_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id),
  CONSTRAINT bank_statements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.centralized_account_config (
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
CREATE TABLE public.chart_of_accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  codigo character varying NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  nivel integer NOT NULL CHECK (nivel >= 1 AND nivel <= 5),
  parent_codigo character varying,
  tipo text NOT NULL,
  naturaleza text NOT NULL DEFAULT 'deudora'::text,
  acepta_movimiento boolean DEFAULT true,
  activo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT chart_of_accounts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.contract_modifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  effective_date date NOT NULL,
  modification_type text NOT NULL CHECK (modification_type = ANY (ARRAY['salary_change'::text, 'hours_change'::text, 'position_change'::text, 'contract_type_change'::text, 'other'::text])),
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  old_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  document_reference_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contract_modifications_pkey PRIMARY KEY (id),
  CONSTRAINT contract_modifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT contract_modifications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT contract_modifications_document_fkey FOREIGN KEY (document_reference_id) REFERENCES public.employment_contracts(id)
);
CREATE TABLE public.economic_indicators (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  codigo character varying NOT NULL,
  nombre text NOT NULL,
  valor numeric NOT NULL,
  fecha date NOT NULL,
  fuente text DEFAULT 'mindicador.cl'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT economic_indicators_pkey PRIMARY KEY (id)
);
CREATE TABLE public.employee_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  tipo USER-DEFINED NOT NULL,
  titulo text NOT NULL,
  file_url text NOT NULL,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT employee_documents_pkey PRIMARY KEY (id),
  CONSTRAINT employee_documents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT employee_documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);
CREATE TABLE public.employee_terminations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_termino date NOT NULL,
  causal_despido text NOT NULL,
  vacaciones_pendientes_dias numeric DEFAULT 0,
  monto_vacaciones bigint DEFAULT 0,
  monto_indemnizacion_anos bigint DEFAULT 0,
  monto_mes_aviso bigint DEFAULT 0,
  total_finiquito bigint NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'borrador'::liquidation_status,
  pdf_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
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
  signature_base64 text,
  CONSTRAINT employee_terminations_pkey PRIMARY KEY (id),
  CONSTRAINT employee_terminations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT employee_terminations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  rut character varying NOT NULL,
  nombres text NOT NULL,
  apellido_paterno text NOT NULL,
  apellido_materno text,
  fecha_ingreso date NOT NULL,
  fecha_termino date,
  cargo text,
  departamento text,
  tipo_contrato USER-DEFINED NOT NULL DEFAULT 'indefinido'::contract_type,
  sueldo_base bigint NOT NULL,
  gratificacion_legal boolean NOT NULL DEFAULT true,
  afp text,
  prevision_salud text,
  monto_isapre bigint DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  descripcion_cargo text,
  birth_date date,
  address text,
  city character varying,
  region character varying,
  family_allowances integer DEFAULT 0,
  afc_active boolean DEFAULT true,
  email character varying,
  phone character varying,
  sexo character varying,
  estado_civil character varying,
  nacionalidad character varying DEFAULT 'Chilena'::character varying,
  horas_semanales integer DEFAULT 42,
  horario_detalle text,
  asignacion_colacion bigint DEFAULT 0,
  asignacion_movilizacion bigint DEFAULT 0,
  bono_fijo bigint DEFAULT 0,
  plan_salud_uf numeric DEFAULT 0,
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
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
  jornada_horas integer DEFAULT 42,
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
  CONSTRAINT employment_contracts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT employment_contracts_parent_contract_id_fkey FOREIGN KEY (parent_contract_id) REFERENCES public.employment_contracts(id)
);
CREATE TABLE public.f29_box_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  f29_id uuid,
  box_code integer NOT NULL,
  description text,
  value numeric NOT NULL,
  box_type text DEFAULT 'determinativo'::text,
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT f29_box_details_pkey PRIMARY KEY (id),
  CONSTRAINT f29_box_details_f29_id_fkey FOREIGN KEY (f29_id) REFERENCES public.f29_forms(id),
  CONSTRAINT f29_box_details_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
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
  metodo_depreciacion USER-DEFINED NOT NULL DEFAULT 'lineal'::depreciation_method,
  condicion USER-DEFINED NOT NULL DEFAULT 'activo'::asset_condition,
  depreciacion_mensual bigint DEFAULT 0,
  depreciacion_acumulada bigint DEFAULT 0,
  valor_libro_actual bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ultimo_periodo_depreciado date,
  categoria character varying,
  marca character varying,
  modelo character varying,
  ubicacion character varying,
  responsable character varying,
  CONSTRAINT fixed_assets_pkey PRIMARY KEY (id),
  CONSTRAINT fixed_assets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.journal_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  fecha date NOT NULL,
  glosa text NOT NULL,
  numero_asiento integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  fixed_asset_id uuid,
  tipo_comprobante character varying DEFAULT 'T'::character varying CHECK (tipo_comprobante::text = ANY (ARRAY['I'::character varying, 'E'::character varying, 'T'::character varying]::text[])),
  source_type character varying,
  source_id character varying,
  CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entries_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT journal_entries_fixed_asset_id_fkey FOREIGN KEY (fixed_asset_id) REFERENCES public.fixed_assets(id)
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
  organization_id uuid NOT NULL,
  CONSTRAINT journal_entry_lines_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entry_lines_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT journal_entry_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id),
  CONSTRAINT journal_entry_lines_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.journal_entry_sequences (
  organization_id uuid NOT NULL,
  accounting_year integer NOT NULL,
  tipo character varying NOT NULL CHECK (tipo::text = ANY (ARRAY['I'::character varying, 'E'::character varying, 'T'::character varying]::text[])),
  last_value integer NOT NULL DEFAULT 0,
  CONSTRAINT journal_entry_sequences_pkey PRIMARY KEY (organization_id, accounting_year, tipo),
  CONSTRAINT journal_entry_sequences_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
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
  status USER-DEFINED NOT NULL DEFAULT 'borrador'::liquidation_status,
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
  afp_code character varying DEFAULT ''::character varying,
  salud_code character varying DEFAULT ''::character varying,
  uf_valor_usado numeric DEFAULT 0,
  dias_trabajados integer DEFAULT 30,
  asignacion_familiar bigint DEFAULT 0,
  bono_extra bigint DEFAULT 0,
  folio_number text NOT NULL,
  salud_voluntaria bigint DEFAULT 0,
  salud_total bigint DEFAULT 0,
  signature_base64 text,
  CONSTRAINT liquidations_pkey PRIMARY KEY (id),
  CONSTRAINT liquidations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT liquidations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT liquidations_account_id_neto_fkey FOREIGN KEY (account_id_neto) REFERENCES public.chart_of_accounts(id)
);
CREATE TABLE public.organization_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'viewer'::member_role,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  permissions jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT organization_members_pkey PRIMARY KEY (id),
  CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.organization_payroll_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL UNIQUE,
  afp_configs jsonb NOT NULL DEFAULT '[]'::jsonb,
  health_configs jsonb NOT NULL DEFAULT '[]'::jsonb,
  mutual_code character varying DEFAULT 'ACHS'::character varying,
  caja_compensacion_code character varying DEFAULT ''::character varying,
  rep_legal_nombre text DEFAULT ''::text,
  rep_legal_rut character varying DEFAULT ''::character varying,
  rep_legal_cargo text DEFAULT 'GERENTE GENERAL'::text,
  last_previred_sync timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organization_payroll_settings_pkey PRIMARY KEY (id),
  CONSTRAINT organization_payroll_settings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
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
  regimen_tributario text DEFAULT 'pro_pyme'::text,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payroll_book_details (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  payroll_book_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  employee_rut text NOT NULL,
  apellido_paterno text,
  apellido_materno text,
  nombres text,
  cargo text,
  area text,
  centro_costo text,
  dias_trabajados integer DEFAULT 30,
  horas_semanales integer DEFAULT 45,
  horas_no_trabajadas integer DEFAULT 0,
  sueldo_base bigint DEFAULT 0,
  gratificacion_legal bigint DEFAULT 0,
  promedio_variable_vacaciones bigint DEFAULT 0,
  colacion bigint DEFAULT 0,
  movilizacion bigint DEFAULT 0,
  asignacion_familiar bigint DEFAULT 0,
  total_haberes_imponibles bigint DEFAULT 0,
  total_haberes_brutos bigint DEFAULT 0,
  descuento_afp bigint DEFAULT 0,
  descuento_salud bigint DEFAULT 0,
  descuento_afc bigint DEFAULT 0,
  impuesto_unico bigint DEFAULT 0,
  otros_descuentos bigint DEFAULT 0,
  total_descuentos bigint DEFAULT 0,
  sueldo_liquido bigint DEFAULT 0,
  afp_nom character varying,
  salud_nom character varying,
  asig_familiar bigint DEFAULT 0,
  afc_trab bigint DEFAULT 0,
  afc_emp bigint DEFAULT 0,
  sis_emp bigint DEFAULT 0,
  descuento_afp_total bigint DEFAULT 0,
  fecha_inicio date,
  fecha_termino date,
  causal_termino character varying,
  region_prestacion character varying,
  comuna_prestacion character varying,
  sobresueldo bigint DEFAULT 0,
  salud_voluntaria bigint DEFAULT 0,
  bono_extra bigint DEFAULT 0,
  family_allowances integer DEFAULT 0,
  afc_active boolean DEFAULT true,
  tipo_contrato text DEFAULT 'indefinido'::text,
  CONSTRAINT payroll_book_details_pkey PRIMARY KEY (id),
  CONSTRAINT payroll_book_details_payroll_book_id_fkey FOREIGN KEY (payroll_book_id) REFERENCES public.payroll_books(id),
  CONSTRAINT payroll_book_details_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);
CREATE TABLE public.payroll_books (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  periodo date NOT NULL,
  book_number integer NOT NULL,
  company_name text NOT NULL,
  company_rut text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  total_employees integer DEFAULT 0,
  total_haberes bigint DEFAULT 0,
  total_descuentos bigint DEFAULT 0,
  total_liquido bigint DEFAULT 0,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payroll_books_pkey PRIMARY KEY (id),
  CONSTRAINT payroll_books_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  onboarding_completed boolean DEFAULT false,
  phone text,
  role text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.purchase_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  periodo date NOT NULL,
  tipo_documento USER-DEFINED NOT NULL,
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
  CONSTRAINT purchase_records_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT purchase_records_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
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
CREATE TABLE public.regional_news (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  category text NOT NULL,
  content text NOT NULL,
  image_url text,
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  source_url text UNIQUE,
  source_name text,
  normalized_title text,
  summary text,
  slug text NOT NULL UNIQUE,
  CONSTRAINT regional_news_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sales_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  periodo date NOT NULL,
  tipo_documento USER-DEFINED NOT NULL,
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
  CONSTRAINT sales_records_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT sales_records_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.termination_causes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  article_code character varying NOT NULL UNIQUE,
  article_name character varying NOT NULL,
  description text NOT NULL,
  requires_notice boolean NOT NULL DEFAULT false,
  notice_days integer DEFAULT 0,
  requires_severance boolean NOT NULL DEFAULT false,
  severance_calculation_type character varying,
  is_with_just_cause boolean NOT NULL DEFAULT false,
  category character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT termination_causes_pkey PRIMARY KEY (id)
);

-- ==============================================================================
-- 🚀 FASE 3: SOVEREIGN ERP - POSTGRES RECURSIVE ACCOUNTING ENGINE
-- ==============================================================================
-- Objetivo: Mover la lógica pesada de los reportes del "Engine" en Python
-- al núcleo hiper-rápido de PostgreSQL. Esto permite que los cálculos de
-- saldos masivos carguen en < 50ms sin importar el volumen de datos.
-- ==============================================================================

-- 1. ⚡ OPTIMIZACIÓN KERNAL: ÍNDICES B-TREE
-- Estos índices previenen "Full Table Scans". Son vitales porque journal_entries 
-- es la tabla que más crecerá en el tiempo.
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_date ON public.journal_entries(organization_id, fecha);
CREATE INDEX IF NOT EXISTS idx_jel_entry_account ON public.journal_entry_lines(entry_id, account_id);
CREATE INDEX IF NOT EXISTS idx_coa_org_codigo ON public.chart_of_accounts(organization_id, codigo);


-- 2. ⚡ VISTA RÁPIDA: vw_leaf_account_balances
-- Vista de acceso ultrarrápido a los saldos totales acumulados a la fecha de resolución actual (útil para dashboards)
CREATE OR REPLACE VIEW public.vw_leaf_account_balances AS
SELECT 
    jel.organization_id,
    jel.account_id,
    coa.codigo,
    coa.nombre,
    coa.naturaleza,
    SUM(CASE WHEN jel.tipo = 'debe' THEN jel.monto ELSE 0 END) as total_debe,
    SUM(CASE WHEN jel.tipo = 'haber' THEN jel.monto ELSE 0 END) as total_haber,
    SUM(
        CASE 
            WHEN coa.naturaleza = 'deudora' AND jel.tipo = 'debe' THEN jel.monto
            WHEN coa.naturaleza = 'deudora' AND jel.tipo = 'haber' THEN -jel.monto
            WHEN coa.naturaleza = 'acreedora' AND jel.tipo = 'haber' THEN jel.monto
            WHEN coa.naturaleza = 'acreedora' AND jel.tipo = 'debe' THEN -jel.monto
            ELSE 0 
        END
    ) as saldo_actual
FROM public.journal_entry_lines jel
JOIN public.journal_entries je ON jel.entry_id = je.id
JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
GROUP BY jel.organization_id, jel.account_id, coa.codigo, coa.nombre, coa.naturaleza;


-- 3. 🛡️ FUNCION RPC: rpc_get_recursive_trial_balance
-- La joya matemática. En vez de procesar el árbol de cuentas en bucles for de Python o TypeScript,
-- esta función agrupa los montos "de abajo hacia arriba" (Rollup) usando patrones de prefijo.
CREATE OR REPLACE FUNCTION public.rpc_get_recursive_trial_balance(
    p_organization_id UUID,
    p_end_date DATE
) 
RETURNS TABLE (
    id UUID,
    codigo VARCHAR,
    nombre TEXT,
    nivel INTEGER,
    tipo TEXT,
    naturaleza TEXT,
    acepta_movimiento BOOLEAN,
    total_debe NUMERIC,
    total_haber NUMERIC,
    saldo NUMERIC
) 
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH account_tree AS (
        -- CASO BASE: Obtenemos todas las cuentas y sumamos SOLO los asientos correspondientes a hojas imputables 
        -- hasta la fecha de corte solicitada.
        SELECT 
            coa.id,
            coa.codigo,
            coa.nombre,
            coa.nivel,
            coa.parent_codigo,
            coa.tipo,
            coa.naturaleza,
            coa.acepta_movimiento,
            COALESCE(SUM(CASE WHEN jel.tipo = 'debe' THEN jel.monto ELSE 0 END), 0) as calc_debe,
            COALESCE(SUM(CASE WHEN jel.tipo = 'haber' THEN jel.monto ELSE 0 END), 0) as calc_haber
        FROM public.chart_of_accounts coa
        LEFT JOIN public.journal_entry_lines jel 
               ON coa.id = jel.account_id
        LEFT JOIN public.journal_entries je 
               ON jel.entry_id = je.id 
              AND je.fecha <= p_end_date 
              AND je.organization_id = p_organization_id
        WHERE coa.organization_id = p_organization_id
        GROUP BY coa.id, coa.codigo, coa.nombre, coa.nivel, coa.parent_codigo, coa.tipo, coa.naturaleza, coa.acepta_movimiento
    ),
    rollup_calc AS (
        -- RECURSIÓN POR PREFIJO: Propagamos eficientemente los montos al padre.
        -- Si esta cuenta es "1.1", sumará todas las hijas ("1.1.01", "1.1.01.01") que aceptan movimiento.
        SELECT 
            padre.id,
            padre.codigo,
            padre.nombre,
            padre.nivel,
            padre.tipo,
            padre.naturaleza,
            padre.acepta_movimiento,
            (SELECT SUM(calc_debe) FROM account_tree hijo WHERE hijo.codigo LIKE padre.codigo || '%' AND hijo.acepta_movimiento = TRUE) as sum_rollup_debe,
            (SELECT SUM(calc_haber) FROM account_tree hijo WHERE hijo.codigo LIKE padre.codigo || '%' AND hijo.acepta_movimiento = TRUE) as sum_rollup_haber
        FROM account_tree padre
    )
    SELECT 
        r.id,
        r.codigo,
        r.nombre,
        r.nivel,
        r.tipo,
        r.naturaleza,
        r.acepta_movimiento,
        COALESCE(r.sum_rollup_debe, 0) as total_debe,
        COALESCE(r.sum_rollup_haber, 0) as total_haber,
        CASE 
            WHEN r.naturaleza = 'deudora' THEN COALESCE(r.sum_rollup_debe, 0) - COALESCE(r.sum_rollup_haber, 0)
            ELSE COALESCE(r.sum_rollup_haber, 0) - COALESCE(r.sum_rollup_debe, 0) 
        END as saldo
    FROM rollup_calc r
    ORDER BY r.codigo ASC;
END;
$$;

-- ==========================================
-- FASE 5: MAGALLANES NEWS & IA PREDICTIVA
-- ==========================================
CREATE TABLE public.regional_news (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  category text NOT NULL,
  content text NOT NULL,
  image_url text,
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  source_url text UNIQUE,
  source_name text,
  normalized_title text,
  summary text,
  slug text NOT NULL UNIQUE,
  CONSTRAINT regional_news_pkey PRIMARY KEY (id)
);
