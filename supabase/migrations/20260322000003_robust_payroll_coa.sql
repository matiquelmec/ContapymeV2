-- ============================================================
-- MIGRACIÓN: Sistema robusto de Plan de Cuentas para Nómina
-- Fecha: 2026-03-22
-- Propósito: 
--   1. Agregar UNIQUE constraint para evitar duplicados
--   2. Expandir la RPC de inicialización con cuentas de RRHH
--   3. Crear helper para auto-crear jerarquía de cuentas
-- ============================================================

-- 1. UNIQUE CONSTRAINT: Esencial para que upsert funcione
-- Primero limpiamos posibles duplicados existentes
DELETE FROM public.chart_of_accounts a
USING public.chart_of_accounts b
WHERE a.id > b.id 
  AND a.organization_id = b.organization_id 
  AND a.codigo = b.codigo;

-- Ahora sí agregamos el constraint
ALTER TABLE public.chart_of_accounts 
  ADD CONSTRAINT uq_chart_of_accounts_org_codigo 
  UNIQUE (organization_id, codigo);

-- 2. Ajustar CHECK constraint de nivel para soportar hasta 5 (sub-cuentas detalladas)
ALTER TABLE public.chart_of_accounts 
  DROP CONSTRAINT IF EXISTS chart_of_accounts_nivel_check;
ALTER TABLE public.chart_of_accounts 
  ADD CONSTRAINT chart_of_accounts_nivel_check 
  CHECK (nivel >= 1 AND nivel <= 5);

-- 3. FUNCIÓN: Asegurar jerarquía de cuentas para un módulo
-- Esta función crea cuentas padre e hija necesarias si no existen
CREATE OR REPLACE FUNCTION public.ensure_payroll_accounts(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- === GASTOS DE PERSONAL ===
  INSERT INTO chart_of_accounts (organization_id, codigo, nombre, tipo, naturaleza, nivel, acepta_movimiento, activo)
  VALUES
    -- Nivel 2: Padre Gastos Operacionales
    (p_org_id, '5.1', 'Gastos Operacionales', 'gasto', 'deudora', 2, false, true),
    -- Nivel 3: Gastos de Personal
    (p_org_id, '5.1.02', 'Gastos de Personal', 'gasto', 'deudora', 3, false, true),
    -- Nivel 4: Cuentas imputables
    (p_org_id, '5.1.02.001', 'Sueldos y Salarios', 'gasto', 'deudora', 4, true, true),
    (p_org_id, '5.1.02.002', 'Leyes Sociales Empresa', 'gasto', 'deudora', 4, true, true),
    
    -- === PASIVOS PREVISIONALES ===
    -- Nivel 3: Impuestos por Pagar (padre)
    (p_org_id, '2.1.03', 'Impuestos por Pagar', 'pasivo', 'acreedora', 3, false, true),
    -- Nivel 4: Impuesto Único
    (p_org_id, '2.1.03.001', 'Impuesto Único Retenido por Pagar', 'pasivo', 'acreedora', 4, true, true),
    
    -- Nivel 3: Obligaciones Previsionales (padre)
    (p_org_id, '2.1.04', 'Obligaciones Previsionales', 'pasivo', 'acreedora', 3, false, true),
    -- Nivel 4: Cuentas imputables
    (p_org_id, '2.1.04.001', 'Sueldos por Pagar', 'pasivo', 'acreedora', 4, true, true),
    (p_org_id, '2.1.04.004', 'AFP por Pagar', 'pasivo', 'acreedora', 4, true, true),
    (p_org_id, '2.1.04.005', 'Salud por Pagar', 'pasivo', 'acreedora', 4, true, true),
    (p_org_id, '2.1.04.006', 'AFC por Pagar', 'pasivo', 'acreedora', 4, true, true)
  ON CONFLICT (organization_id, codigo) DO NOTHING;
END;
$$;

-- 4. ACTUALIZAR RPC create_default_chart_of_accounts para incluir nómina
CREATE OR REPLACE FUNCTION public.create_default_chart_of_accounts(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO chart_of_accounts (organization_id, codigo, nombre, tipo, naturaleza, nivel, acepta_movimiento, activo)
  VALUES
    -- ====== ACTIVOS ======
    (p_org_id, '1', 'ACTIVO', 'activo', 'deudora', 1, false, true),
    (p_org_id, '1.1', 'Activo Corriente', 'activo', 'deudora', 2, false, true),
    (p_org_id, '1.1.01', 'Caja y Bancos', 'activo', 'deudora', 3, false, true),
    (p_org_id, '1.1.01.001', 'Caja General', 'activo', 'deudora', 4, true, true),
    (p_org_id, '1.1.01.002', 'Banco Estado Cuenta Corriente', 'activo', 'deudora', 4, true, true),
    (p_org_id, '1.1.02.001', 'Clientes Nacionales', 'activo', 'deudora', 4, true, true),
    (p_org_id, '1.1.03', 'Impuestos por Recuperar', 'activo', 'deudora', 3, false, true),
    (p_org_id, '1.1.03.001', 'IVA Crédito Fiscal', 'activo', 'deudora', 4, true, true),
    (p_org_id, '1.2', 'Activo No Corriente', 'activo', 'deudora', 2, false, true),

    -- ====== PASIVOS ======
    (p_org_id, '2', 'PASIVO', 'pasivo', 'acreedora', 1, false, true),
    (p_org_id, '2.1', 'Pasivo Corriente', 'pasivo', 'acreedora', 2, false, true),
    (p_org_id, '2.1.01', 'Cuentas por Pagar Comerciales', 'pasivo', 'acreedora', 3, false, true),
    (p_org_id, '2.1.01.001', 'Proveedores Nacionales', 'pasivo', 'acreedora', 4, true, true),
    (p_org_id, '2.1.02', 'Retenciones por Pagar', 'pasivo', 'acreedora', 3, false, true),
    (p_org_id, '2.1.02.001', 'IVA Débito Fiscal', 'pasivo', 'acreedora', 4, true, true),
    -- Nómina: Impuestos y Previsión
    (p_org_id, '2.1.03', 'Impuestos por Pagar', 'pasivo', 'acreedora', 3, false, true),
    (p_org_id, '2.1.03.001', 'Impuesto Único Retenido por Pagar', 'pasivo', 'acreedora', 4, true, true),
    (p_org_id, '2.1.04', 'Obligaciones Previsionales', 'pasivo', 'acreedora', 3, false, true),
    (p_org_id, '2.1.04.001', 'Sueldos por Pagar', 'pasivo', 'acreedora', 4, true, true),
    (p_org_id, '2.1.04.004', 'AFP por Pagar', 'pasivo', 'acreedora', 4, true, true),
    (p_org_id, '2.1.04.005', 'Salud por Pagar', 'pasivo', 'acreedora', 4, true, true),
    (p_org_id, '2.1.04.006', 'AFC por Pagar', 'pasivo', 'acreedora', 4, true, true),

    -- ====== PATRIMONIO ======
    (p_org_id, '3', 'PATRIMONIO', 'patrimonio', 'acreedora', 1, false, true),

    -- ====== INGRESOS ======
    (p_org_id, '4', 'INGRESOS', 'ingreso', 'acreedora', 1, false, true),
    (p_org_id, '4.1.01.001', 'Ventas de Mercaderías', 'ingreso', 'acreedora', 4, true, true),

    -- ====== GASTOS ======
    (p_org_id, '5', 'GASTOS', 'gasto', 'deudora', 1, false, true),
    (p_org_id, '5.1', 'Gastos Operacionales', 'gasto', 'deudora', 2, false, true),
    (p_org_id, '5.1.01.001', 'Costo de Ventas', 'gasto', 'deudora', 4, true, true),
    -- Nómina: Gastos de Personal
    (p_org_id, '5.1.02', 'Gastos de Personal', 'gasto', 'deudora', 3, false, true),
    (p_org_id, '5.1.02.001', 'Sueldos y Salarios', 'gasto', 'deudora', 4, true, true),
    (p_org_id, '5.1.02.002', 'Leyes Sociales Empresa', 'gasto', 'deudora', 4, true, true)
  ON CONFLICT (organization_id, codigo) DO NOTHING;
END;
$$;
