-- ============================================================
-- MIGRACIÓN: 20260322000000 — Corrección de Finiquitos (RLS y Enums)
-- Propósito: Reparar el fallo en la firma/confirmación de finiquitos.
-- ============================================================

-- 1. Asegurar que el estado 'firmado' existe en el ENUM (si es que se usa uno)
-- Si status es text, esto no hace nada dañino.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'liquidation_status') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'liquidation_status' AND e.enumlabel = 'firmado') THEN
            ALTER TYPE liquidation_status ADD VALUE 'firmado';
        END IF;
    END IF;
END $$;

-- 2. Asegurar que existe la función get_my_org_ids() para RLS
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS TABLE (org_id uuid) AS $$
BEGIN
    RETURN QUERY
    SELECT m.organization_id
    FROM public.organization_members m
    WHERE m.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Habilitar políticas de RLS para employee_terminations
-- (Aseguramos que el usuario pueda Ver, Crear y Modificar sus propios registros de empresa)
ALTER TABLE public.employee_terminations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total finiquitos de mi empresa" ON public.employee_terminations;
CREATE POLICY "Acceso total finiquitos de mi empresa" 
ON public.employee_terminations 
FOR ALL 
USING (organization_id IN (SELECT get_my_org_ids()))
WITH CHECK (organization_id IN (SELECT get_my_org_ids()));

-- 4. Habilitar RLS para employees si no lo está y dar permisos de edición
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total empleados de mi empresa" ON public.employees;
CREATE POLICY "Acceso total empleados de mi empresa" 
ON public.employees 
FOR ALL 
USING (organization_id IN (SELECT get_my_org_ids()))
WITH CHECK (organization_id IN (SELECT get_my_org_ids()));
