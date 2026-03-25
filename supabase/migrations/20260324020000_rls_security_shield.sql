-- ========================================================
-- MIGRACIÓN: Hardening RLS (Zero Data Leakage)
-- Fecha: 2026-03-24
-- Propósito: 
--   1. Crear función centralizada de validación de membresía
--   2. Corregir políticas RLS inseguras (ej. employment_contracts)
--   3. Blindar acceso multi-tenant
-- ========================================================

-- 1. Función Centralizada de Seguridad
-- Permite chequear si un usuario tiene acceso a una organización de forma rápida y segura
CREATE OR REPLACE FUNCTION public.check_user_in_org(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corrección de Políticas Inseguras (Employment Contracts)
-- Anteriormente permitía acceso a cualquiera con USING (true)

-- A. Limpiar políticas previas
DROP POLICY IF EXISTS "Select contracts by organization" ON public.employment_contracts;
DROP POLICY IF EXISTS "Management of contracts" ON public.employment_contracts;

-- B. Política de Lectura (Solo miembros)
CREATE POLICY "Strict select contracts by organization" 
ON public.employment_contracts 
FOR SELECT 
TO authenticated
USING ( public.check_user_in_org(organization_id) );

-- C. Política de Gestión (Solo Owners y Admins)
CREATE POLICY "Strict management of contracts"
ON public.employment_contracts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = public.employment_contracts.organization_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = public.employment_contracts.organization_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- 3. Blindaje de Tablas Transaccionales Críticas (Auditoría de Higiene)

-- A. Journal Entries (Integridad IFRS)
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Journal entries isolation" ON public.journal_entries;
CREATE POLICY "Journal entries isolation" 
ON public.journal_entries FOR ALL TO authenticated
USING ( public.check_user_in_org(organization_id) )
WITH CHECK ( public.check_user_in_org(organization_id) );

-- B. Sales Records
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sales records isolation" ON public.sales_records;
CREATE POLICY "Sales records isolation" 
ON public.sales_records FOR ALL TO authenticated
USING ( public.check_user_in_org(organization_id) )
WITH CHECK ( public.check_user_in_org(organization_id) );

-- C. Purchase Records
ALTER TABLE public.purchase_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Purchase records isolation" ON public.purchase_records;
CREATE POLICY "Purchase records isolation" 
ON public.purchase_records FOR ALL TO authenticated
USING ( public.check_user_in_org(organization_id) )
WITH CHECK ( public.check_user_in_org(organization_id) );

-- D. Employees (Privacidad LRE)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees isolation" ON public.employees;
CREATE POLICY "Employees isolation" 
ON public.employees FOR ALL TO authenticated
USING ( public.check_user_in_org(organization_id) )
WITH CHECK ( public.check_user_in_org(organization_id) );
