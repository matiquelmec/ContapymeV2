-- ============================================================
-- MIGRACIÓN: Blindaje y Hardening de Conciliación Bancaria
-- Fecha: 2026-03-23
-- Descripción: Añade organization_id a bank_statements y prepara la centralización de ajustes.
-- ============================================================

-- 1. Hardening Multi-Tenancy en Cabecera de Cartolas (Bank Statements)
ALTER TABLE public.bank_statements ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 2. Llenado inicial de organization_id desde la cuenta bancaria hija
UPDATE public.bank_statements st
SET organization_id = bacc.organization_id
FROM public.bank_accounts bacc
WHERE st.bank_account_id = bacc.id
AND st.organization_id IS NULL;

-- 3. Blindaje NOT NULL
ALTER TABLE public.bank_statements ALTER COLUMN organization_id SET NOT NULL;

-- 4. Índices de rendimiento para conciliación masiva
CREATE INDEX IF NOT EXISTS idx_bank_statement_lines_org ON public.bank_statement_lines(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_org ON public.bank_reconciliations(organization_id);

-- 5. Configuración Contable para AJUSTES BANCARIOS (Comisiones, Gastos, Impuestos)
INSERT INTO public.centralized_account_config 
(organization_id, module_name, transaction_type, display_name, tax_account_code, tax_account_name, revenue_account_code, revenue_account_name, asset_account_code, asset_account_name)
SELECT 
    id as organization_id,
    'banking' as module_name,
    'adjustment' as transaction_type,
    'Gasto Bancario / Comisión' as display_name,
    '5.1.05.001' as tax_account_code,      -- Cuenta de Gastos Bancarios
    'Gastos Bancarios',
    '1.1.01.002' as revenue_account_code,   -- Banco (Referencia para Abonos)
    'Banco (Abono)',
    '1.1.01.002' as asset_account_code,     -- Banco (Referencia para Cargos)
    'Banco (Cargo)'
FROM public.organizations
ON CONFLICT (organization_id, module_name, transaction_type) DO NOTHING;
