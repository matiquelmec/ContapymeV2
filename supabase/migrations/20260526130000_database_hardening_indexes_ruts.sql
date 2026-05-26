-- ============================================================
-- 🏛️ MIGRACIÓN: Normalización de RUTs y Optimización de Índices (Multi-Tenant)
-- Fecha: 26 de Mayo, 2026
-- ============================================================

-- ─── 1. FUNCIÓN DE NORMALIZACIÓN DE RUTS ───
-- Limpia puntos, guiones y espacios, y deja en formato '12345678-K' (sin puntos, con guion, DV en mayúscula)
CREATE OR REPLACE FUNCTION public.normalize_rut_db(p_rut text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_clean text;
BEGIN
  IF p_rut IS NULL OR p_rut = '' THEN
    RETURN p_rut;
  END IF;
  
  -- Eliminar todo excepto números y letras K/k
  v_clean := regexp_replace(UPPER(p_rut), '[^0-9K]', '', 'g');
  
  -- Si es un RUT válido con dígito verificador, formatear a XXXXXXXX-X
  IF length(v_clean) >= 2 THEN
    RETURN substring(v_clean from 1 for length(v_clean)-1) || '-' || right(v_clean, 1);
  ELSE
    RETURN v_clean;
  END IF;
END;
$$;


-- ─── 2. ACTUALIZACIÓN MASIVA DE RUTS EXISTENTES ───
-- Asegura que todos los registros históricos utilicen el mismo formato normalizado

-- Organizations
UPDATE public.organizations 
SET rut_empresa = public.normalize_rut_db(rut_empresa) 
WHERE rut_empresa IS NOT NULL AND rut_empresa != '';

-- Employees
UPDATE public.employees 
SET rut = public.normalize_rut_db(rut) 
WHERE rut IS NOT NULL AND rut != '';

-- DTE Companies
UPDATE public.dte_companies 
SET rut = public.normalize_rut_db(rut) 
WHERE rut IS NOT NULL AND rut != '';

-- DTE Issued
UPDATE public.dte_issued 
SET receptor_rut = public.normalize_rut_db(receptor_rut) 
WHERE receptor_rut IS NOT NULL AND receptor_rut != '';

-- Purchase Records
UPDATE public.purchase_records 
SET rut_emisor = public.normalize_rut_db(rut_emisor) 
WHERE rut_emisor IS NOT NULL AND rut_emisor != '';

-- Sales Records
UPDATE public.sales_records 
SET rut_receptor = public.normalize_rut_db(rut_receptor) 
WHERE rut_receptor IS NOT NULL AND rut_receptor != '';

-- Organization Payroll Settings
UPDATE public.organization_payroll_settings 
SET rep_legal_rut = public.normalize_rut_db(rep_legal_rut) 
WHERE rep_legal_rut IS NOT NULL AND rep_legal_rut != '';

-- Payroll Book Details
UPDATE public.payroll_book_details 
SET employee_rut = public.normalize_rut_db(employee_rut) 
WHERE employee_rut IS NOT NULL AND employee_rut != '';

-- Payroll Books
UPDATE public.payroll_books 
SET company_rut = public.normalize_rut_db(company_rut) 
WHERE company_rut IS NOT NULL AND company_rut != '';


-- ─── 3. ÍNDICES DE RENDIMIENTO MULTI-TENANT (OPTIMIZACIÓN ACCELERATOR) ───
-- Índices compuestos para búsquedas por RUT y filtrado veloz por organización

-- Búsqueda de organizaciones por RUT único
CREATE INDEX IF NOT EXISTS idx_organizations_rut_empresa 
  ON public.organizations(rut_empresa);

-- Búsquedas y filtrado de empleados por RUT en la organización
CREATE INDEX IF NOT EXISTS idx_employees_org_rut 
  ON public.employees(organization_id, rut);

-- Configuración de empresas DTE
CREATE INDEX IF NOT EXISTS idx_dte_companies_org_rut 
  ON public.dte_companies(organization_id, rut);

-- Documentos tributarios emitidos a un receptor
CREATE INDEX IF NOT EXISTS idx_dte_issued_org_receptor_rut 
  ON public.dte_issued(organization_id, receptor_rut);

-- Registros de compras por emisor
CREATE INDEX IF NOT EXISTS idx_purchase_records_org_emisor 
  ON public.purchase_records(organization_id, rut_emisor);

-- Registros de ventas por receptor
CREATE INDEX IF NOT EXISTS idx_sales_records_org_receptor 
  ON public.sales_records(organization_id, rut_receptor);

-- Liquidaciones de remuneración históricas
CREATE INDEX IF NOT EXISTS idx_liquidations_org_employee_period 
  ON public.liquidations(organization_id, employee_id, periodo);

-- Cartolas y conciliación bancaria
CREATE INDEX IF NOT EXISTS idx_bank_statement_lines_reconcile_perf 
  ON public.bank_statement_lines(organization_id, bank_account_id, fecha, is_reconciled);

-- Notificar recarga de esquemas
NOTIFY pgrst, 'reload schema';
