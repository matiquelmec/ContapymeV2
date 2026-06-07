-- ============================================================
-- MIGRACION: Robustecimiento de Base de Datos y Localización Chilena
-- Objetivo: Validación algorítmica de RUT, prevención de duplicados,
--           estructuración de previsión de salud e índices de performance.
-- ============================================================

-- 1. Función de validación de RUT Chileno (Módulo 11)
CREATE OR REPLACE FUNCTION public.validar_rut_chileno(p_rut text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_rut text;
  v_cuerpo text;
  v_dv text;
  v_suma integer := 0;
  v_multiplo integer := 2;
  v_i integer;
  v_resto integer;
  v_dv_esperado text;
BEGIN
  IF p_rut IS NULL OR trim(p_rut) = '' THEN
    RETURN true; -- Permitir nulos si no es requerido por la columna
  END IF;

  -- Limpiar y normalizar el RUT (quitar puntos, guiones y espacios)
  v_rut := regexp_replace(upper(trim(p_rut)), '[^0-9K]', '', 'g');
  
  -- RUTs muy cortos no son válidos
  IF length(v_rut) < 2 THEN
    RETURN false;
  END IF;
  
  v_cuerpo := left(v_rut, length(v_rut) - 1);
  v_dv := right(v_rut, 1);
  
  -- Calcular módulo 11
  FOR v_i IN REVERSE length(v_cuerpo)..1 LOOP
    v_suma := v_suma + (substring(v_cuerpo, v_i, 1)::integer * v_multiplo);
    v_multiplo := v_multiplo + 1;
    IF v_multiplo > 7 THEN
      v_multiplo := 2;
    END IF;
  END LOOP;
  
  v_resto := 11 - (v_suma % 11);
  IF v_resto = 11 THEN
    v_dv_esperado := '0';
  ELSIF v_resto = 10 THEN
    v_dv_esperado := 'K';
  ELSE
    v_dv_esperado := v_resto::text;
  END IF;
  
  RETURN v_dv = v_dv_esperado;
END;
$$;

-- 2. Aplicar validación de RUT como check "NOT VALID" para no romper registros históricos existentes
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_rut_check,
  ADD CONSTRAINT organizations_rut_check 
  CHECK (public.validar_rut_chileno(rut_empresa)) NOT VALID;

ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_rut_check,
  ADD CONSTRAINT employees_rut_check 
  CHECK (public.validar_rut_chileno(rut)) NOT VALID;

ALTER TABLE public.dte_companies
  DROP CONSTRAINT IF EXISTS dte_companies_rut_check,
  ADD CONSTRAINT dte_companies_rut_check 
  CHECK (public.validar_rut_chileno(rut)) NOT VALID;

-- 3. Restricción única de Indicadores Económicos para prevenir duplicados
ALTER TABLE public.economic_indicators 
  DROP CONSTRAINT IF EXISTS economic_indicators_codigo_fecha_key,
  ADD CONSTRAINT economic_indicators_codigo_fecha_key UNIQUE (codigo, fecha);

-- 4. Creación de índices para Llaves Foráneas Críticas (Optimización de Balances y Remuneraciones)
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_fk_acc_id 
  ON public.journal_entry_lines(account_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_fk_entry_id 
  ON public.journal_entry_lines(entry_id);

CREATE INDEX IF NOT EXISTS idx_payroll_book_details_fk_book_id 
  ON public.payroll_book_details(payroll_book_id);

CREATE INDEX IF NOT EXISTS idx_treasury_payment_documents_fk_pay_id 
  ON public.treasury_payment_documents(payment_id);
