-- ============================================================
-- MIGRACIÓN: Hardening Total DB (Seguridad + Multitenencia)
-- Fecha: 2026-03-22
-- Propósito: 
--   1. Crear UNIQUE Constraints para evitar duplicidad
--   2. Aislar Multitenencia (Forzar NOT NULL en organization_id)
--   3. Arreglar Bug de Finiquitos (Permitir recontratación)
-- ============================================================

-- ============================================
-- 1. BLOQUEAR DUPLICIDAD LÓGICA (UNIQUE)
-- ============================================

-- A. Empleados: Un RUT solo puede existir 1 vez por empresa
ALTER TABLE public.employees 
  ADD CONSTRAINT uq_employees_org_rut UNIQUE (organization_id, rut);

-- B. Liquidaciones: Un trabajador no puede ganar sueldo 2 veces el mismo mes
ALTER TABLE public.liquidations 
  ADD CONSTRAINT uq_liquidations_emp_periodo UNIQUE (employee_id, periodo);

-- C. F29: Una empresa solo declara un formulario por mes contable
ALTER TABLE public.f29_forms 
  ADD CONSTRAINT uq_f29_org_periodo UNIQUE (organization_id, periodo);

-- D. RCV: Una empresa solo puede subir 1 archivo RCV "Compras" y 1 "Ventas" al mes
ALTER TABLE public.rcv_imports 
  ADD CONSTRAINT uq_rcv_org_periodo_tipo UNIQUE (organization_id, periodo, tipo);

-- E. Config Cuentas Centralizadas: 1 configuración única de módulo y transacción por empresa
ALTER TABLE public.centralized_account_config 
  ADD CONSTRAINT uq_centralized_org_modulo_trx UNIQUE (organization_id, module_name, transaction_type);


-- ============================================
-- 2. PARCHEAR FILTRADO MULTI-TENANT (RLS)
-- ============================================
-- Antes de forzar el NOT NULL, debemos borrar registros huérfanos sin empresa (seguridad cero)
DELETE FROM public.journal_entry_lines WHERE organization_id IS NULL;
DELETE FROM public.bank_statement_lines WHERE organization_id IS NULL;
DELETE FROM public.bank_reconciliations WHERE organization_id IS NULL;
DELETE FROM public.account_mapping_rules WHERE organization_id IS NULL;
DELETE FROM public.f29_box_details WHERE organization_id IS NULL;

-- Ahora forzamos a nivel motor que TODO registro pertenezca a una Empresa
ALTER TABLE public.journal_entry_lines ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.bank_statement_lines ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.bank_reconciliations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.account_mapping_rules ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.f29_box_details ALTER COLUMN organization_id SET NOT NULL;


-- ============================================
-- 3. ARREGLAR BUG LÓGICO HISTÓRICO
-- ============================================
-- Quitar el UNIQUE constraint de `employee_terminations.employee_id`
-- Esto permite que un empleado de temporada (ej. Agrícola) 
-- sea finiquitado múltiples veces a lo largo de los años.
ALTER TABLE public.employee_terminations 
  DROP CONSTRAINT IF EXISTS employee_terminations_employee_id_key;

