-- ============================================================
-- MIGRACIÓN: Configuración de Centralización Contable para Nómina (Remuneraciones)
-- Fecha: 2026-03-23
-- Descripción: Define las cuentas por defecto para la inyección automática de asientos de sueldo.
-- ============================================================

-- Insertar configuración para el módulo de Payroll (Nómina)
-- Estas cuentas coinciden con las creadas en '20260322000003_robust_payroll_coa.sql'
INSERT INTO public.centralized_account_config 
(organization_id, module_name, transaction_type, display_name, asset_account_code, asset_account_name, revenue_account_code, revenue_account_name, tax_account_code, tax_account_name)
SELECT 
    id as organization_id,
    'payroll' as module_name,
    'centralization' as transaction_type,
    'Centralización de Remuneraciones' as display_name,
    '5.1.02.001' as asset_account_code,   -- Sueldos y Salarios (Gasto)
    'Sueldos y Salarios',
    '2.1.04.001' as revenue_account_code, -- Sueldos por Pagar (Pasivo)
    'Sueldos por Pagar',
    '2.1.04.004' as tax_account_code,     -- AFP por Pagar (Pasivo - Referencia)
    'AFP por Pagar'
FROM public.organizations
ON CONFLICT (organization_id, module_name, transaction_type) DO NOTHING;
