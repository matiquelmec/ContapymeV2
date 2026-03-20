-- ============================================================
-- CONTAPYME V2 — MIGRACIÓN: RRHH (Finiquitos y Contratos Avanzados)
-- Fecha: 2026-03-18
-- Descripción: Potenciación de finiquitos, contratos versionados y causas de término.
-- ============================================================

-- 1. Causas de Término Legales (Referencia)
CREATE TABLE IF NOT EXISTS public.termination_causes (
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

-- 2. Documentos de Empleado
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  tipo text NOT NULL, -- Referenciado como USER-DEFINED en el esquema maestro
  titulo text NOT NULL,
  file_url text NOT NULL,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT employee_documents_pkey PRIMARY KEY (id),
  CONSTRAINT employee_documents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT employee_documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- 3. Potenciación de Employee Terminations (Finiquitos)
-- Solo añadir columnas nuevas si no existen
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_terminations') THEN
        CREATE TABLE public.employee_terminations (
            id uuid NOT NULL DEFAULT uuid_generate_v4(),
            organization_id uuid NOT NULL,
            employee_id uuid NOT NULL UNIQUE,
            fecha_inicio date NOT NULL,
            fecha_termino date NOT NULL,
            causal_despido text NOT NULL,
            vacaciones_pendientes_dias numeric DEFAULT 0,
            monto_vacaciones bigint DEFAULT 0,
            monto_indemnizacion_anos bigint DEFAULT 0,
            monto_mes_aviso bigint DEFAULT 0,
            total_finiquito bigint NOT NULL,
            status text NOT NULL DEFAULT 'borrador',
            pdf_url text,
            created_at timestamp with time zone NOT NULL DEFAULT now(),
            updated_at timestamp with time zone NOT NULL DEFAULT now(),
            CONSTRAINT employee_terminations_pkey PRIMARY KEY (id),
            CONSTRAINT employee_terminations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
            CONSTRAINT employee_terminations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
        );
    END IF;
END $$;

ALTER TABLE public.employee_terminations 
  ADD COLUMN IF NOT EXISTS worked_days_last_month integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_salary_amount bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_vacation_days_earned numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vacation_days_taken numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vacation_daily_rate bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proportional_vacation_days numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proportional_vacation_amount bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS severance_years_service numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS severance_monthly_salary bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notice_indemnification_amount bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS christmas_bonus_amount bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_bonuses_amount bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_overtime_amount bigint DEFAULT 0;

-- 4. Versionamiento de Contratos
ALTER TABLE public.employment_contracts
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_contract_id uuid REFERENCES public.employment_contracts(id);

-- RLS y Seguridad
ALTER TABLE public.termination_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_terminations ENABLE ROW LEVEL SECURITY;

-- Lectura para causas (pública para UI)
DROP POLICY IF EXISTS "Lectura pública de causas" ON public.termination_causes;
CREATE POLICY "Lectura pública de causas" ON public.termination_causes FOR SELECT USING (true);
