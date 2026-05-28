-- ============================================================
-- 🏛️ MIGRACIÓN 12: Hardening RLS - Aislamiento Multi-tenant Definitivo
-- Objetivo: Dotar de políticas de acceso seguras a las 9 tablas huerfanas de políticas
-- ============================================================

-- A. TABLAS TRANSACCIONALES CON organization_id (Aislamiento por check_org_access)

-- 1. account_config_entries
ALTER TABLE public.account_config_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON public.account_config_entries;
CREATE POLICY org_isolation ON public.account_config_entries 
  FOR ALL TO authenticated USING (public.check_org_access(organization_id));

-- 2. bank_mapping_rules
ALTER TABLE public.bank_mapping_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON public.bank_mapping_rules;
CREATE POLICY org_isolation ON public.bank_mapping_rules 
  FOR ALL TO authenticated USING (public.check_org_access(organization_id));

-- 3. bank_statements
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON public.bank_statements;
CREATE POLICY org_isolation ON public.bank_statements 
  FOR ALL TO authenticated USING (public.check_org_access(organization_id));

-- 4. dte_items
ALTER TABLE public.dte_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON public.dte_items;
CREATE POLICY org_isolation ON public.dte_items 
  FOR ALL TO authenticated USING (public.check_org_access(organization_id));

-- 5. employee_documents
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON public.employee_documents;
CREATE POLICY org_isolation ON public.employee_documents 
  FOR ALL TO authenticated USING (public.check_org_access(organization_id));

-- 6. f29_box_details
ALTER TABLE public.f29_box_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON public.f29_box_details;
CREATE POLICY org_isolation ON public.f29_box_details 
  FOR ALL TO authenticated USING (public.check_org_access(organization_id));

-- 7. journal_entry_sequences
ALTER TABLE public.journal_entry_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_isolation ON public.journal_entry_sequences;
CREATE POLICY org_isolation ON public.journal_entry_sequences 
  FOR ALL TO authenticated USING (public.check_org_access(organization_id));


-- B. TABLAS PARÁMETRO GLOBALES (Lectura pública / Escritura restringida al rol de servicio)

-- 1. national_payroll_params
ALTER TABLE public.national_payroll_params ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read" ON public.national_payroll_params;
CREATE POLICY "Allow public read" ON public.national_payroll_params
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow service role write" ON public.national_payroll_params;
CREATE POLICY "Allow service role write" ON public.national_payroll_params
  FOR ALL TO service_role USING (true);

-- 2. termination_causes
ALTER TABLE public.termination_causes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read" ON public.termination_causes;
CREATE POLICY "Allow public read" ON public.termination_causes
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow service role write" ON public.termination_causes;
CREATE POLICY "Allow service role write" ON public.termination_causes
  FOR ALL TO service_role USING (true);


-- C. NOTIFICAR RECARGA DE ESQUEMAS
NOTIFY pgrst, 'reload schema';
