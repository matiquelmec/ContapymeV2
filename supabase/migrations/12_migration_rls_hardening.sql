-- ============================================================
-- 🏛️ MIGRACIÓN 12: Hardening RLS Definitivo - Membresía Multi-Org
-- Objetivo: Establecer políticas basadas en organization_members para soporte multi-org
-- ============================================================

-- 1. LIMPIAR LOGICA OBSOLETA DE JWT SI EXISTIERA
DROP FUNCTION IF EXISTS public.current_organization_id() CASCADE;

-- 2. ÍNDICE COMPUESTO ESTRATÉGICO PARA OPTIMIZAR RLS
CREATE INDEX IF NOT EXISTS idx_org_members_user_org 
  ON public.organization_members(user_id, organization_id);

-- 3. HABILITAR RLS EN LAS TABLAS CONTABLES, BANCOS, TRIBUTARIO, RRHH Y ACTIVOS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_config_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mapping_rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dte_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dte_issued ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dte_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dte_caf_folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.f29_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.f29_box_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rcv_imports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_terminations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_books ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certified_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_payroll_settings ENABLE ROW LEVEL SECURITY;

-- 4. MACRO PARA GENERACIÓN DE POLÍTICAS BÁSICAS (SELECT/INSERT/UPDATE/DELETE)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'journal_entries','journal_entry_lines','journal_entry_sequences',
    'accounting_events','chart_of_accounts','account_config_entries',
    'account_mapping_rules','bank_accounts','bank_statements',
    'bank_statement_lines','bank_reconciliations',
    'dte_companies','dte_issued','dte_items','dte_caf_folios',
    'f29_forms','f29_box_details','purchase_records','sales_records',
    'rcv_imports','employees','employee_documents','employee_terminations',
    'employment_contracts','contract_modifications','liquidations',
    'payroll_books','fixed_assets','certified_reports',
    'organization_payroll_settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Limpiar políticas anteriores (incluyendo las de JWT creadas anteriormente)
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);
    EXECUTE format('DROP POLICY IF EXISTS org_isolation ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "strict_org_isolation" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "strict_management_of_contracts" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Strict select contracts by organization" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Strict management of contracts" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Journal entries isolation" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Sales records isolation" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Purchase records isolation" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Employees isolation" ON public.%I', t);

    -- Inyectar nuevas políticas basadas en la tabla organization_members
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM public.organization_members om
           WHERE om.organization_id = %I.organization_id AND om.user_id = auth.uid()
         )
       )',
      t || '_select', t, t
    );
    
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (
         EXISTS (
           SELECT 1 FROM public.organization_members om
           WHERE om.organization_id = %I.organization_id AND om.user_id = auth.uid()
         )
       )',
      t || '_insert', t, t
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (
         EXISTS (
           SELECT 1 FROM public.organization_members om
           WHERE om.organization_id = %I.organization_id AND om.user_id = auth.uid()
         )
       ) WITH CHECK (
         EXISTS (
           SELECT 1 FROM public.organization_members om
           WHERE om.organization_id = %I.organization_id AND om.user_id = auth.uid()
         )
       )',
      t || '_update', t, t, t
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (
         EXISTS (
           SELECT 1 FROM public.organization_members om
           WHERE om.organization_id = %I.organization_id AND om.user_id = auth.uid()
         )
       )',
      t || '_delete', t, t
    );
  END LOOP;
END $$;

-- 5. payroll_book_details: AISLAMIENTO ANIDADO
ALTER TABLE public.payroll_book_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payroll_book_details_select ON public.payroll_book_details;
DROP POLICY IF EXISTS payroll_book_details_insert ON public.payroll_book_details;
DROP POLICY IF EXISTS payroll_book_details_update ON public.payroll_book_details;
DROP POLICY IF EXISTS payroll_book_details_delete ON public.payroll_book_details;
DROP POLICY IF EXISTS org_isolation ON public.payroll_book_details;

CREATE POLICY payroll_book_details_select ON public.payroll_book_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_books pb
      JOIN public.organization_members om ON om.organization_id = pb.organization_id
      WHERE pb.id = payroll_book_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY payroll_book_details_insert ON public.payroll_book_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payroll_books pb
      JOIN public.organization_members om ON om.organization_id = pb.organization_id
      WHERE pb.id = payroll_book_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY payroll_book_details_update ON public.payroll_book_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_books pb
      JOIN public.organization_members om ON om.organization_id = pb.organization_id
      WHERE pb.id = payroll_book_id
        AND om.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payroll_books pb
      JOIN public.organization_members om ON om.organization_id = pb.organization_id
      WHERE pb.id = payroll_book_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY payroll_book_details_delete ON public.payroll_book_details FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_books pb
      JOIN public.organization_members om ON om.organization_id = pb.organization_id
      WHERE pb.id = payroll_book_id
        AND om.user_id = auth.uid()
    )
  );

-- 6. organization_members: AISLAMIENTO INDIVIDUAL
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organization_members_select ON public.organization_members;
CREATE POLICY organization_members_select ON public.organization_members FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- 7. TABLAS PARAMÉTRICAS GLOBALES (Lectura pública)
ALTER TABLE public.national_payroll_params ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read" ON public.national_payroll_params;
DROP POLICY IF EXISTS "Allow service role write" ON public.national_payroll_params;
CREATE POLICY "Allow public read" ON public.national_payroll_params FOR SELECT TO public USING (true);
CREATE POLICY "Allow service role write" ON public.national_payroll_params FOR ALL TO service_role USING (true);

ALTER TABLE public.termination_causes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read" ON public.termination_causes;
DROP POLICY IF EXISTS "Allow service role write" ON public.termination_causes;
CREATE POLICY "Allow public read" ON public.termination_causes FOR SELECT TO public USING (true);
CREATE POLICY "Allow service role write" ON public.termination_causes FOR ALL TO service_role USING (true);

-- Notificar recarga de esquemas
NOTIFY pgrst, 'reload schema';
