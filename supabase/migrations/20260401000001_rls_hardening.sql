-- =========================================================================
-- CONTAPYME V2: SECURITY HARDENING (RLS MASTER MIGRATION)
-- Fecha: 01 de Abril 2026
-- Objetivo: Blindar el aislamiento multi-tenant mediante Row Level Security.
-- =========================================================================

-- 1. HABILITAR RLS EN TODAS LAS TABLAS TRANSACCIONALES
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.f29_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centralized_account_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mapping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- 2. CREA POLÍTICA MAESTRA DE AISLAMIENTO (ORG_ISOLATION)
-- Solo usuarios que pertenecen a la organización (verified by organization_members) pueden ver/editar.

CREATE OR REPLACE FUNCTION public.check_org_access(p_org_id uuid) 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = p_org_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- 3. APLICAR POLÍTICAS (REPETIBLE PARA TODAS LAS TABLAS)
CREATE POLICY "org_isolation" ON public.journal_entries FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.journal_entry_lines FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.f29_forms FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.liquidations FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.employees FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.sales_records FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.purchase_records FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.bank_accounts FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.bank_statement_lines FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.bank_reconciliations FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.audit_logs FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.fixed_assets FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.organization_payroll_settings FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.centralized_account_config FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.account_mapping_rules FOR ALL USING (public.check_org_access(organization_id));
CREATE POLICY "org_isolation" ON public.chart_of_accounts FOR ALL USING (public.check_org_access(organization_id));
