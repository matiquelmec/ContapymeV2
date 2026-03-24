-- Habilitar RLS para la tabla de contratos
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;

-- Política de lectura para miembros de la organización
DROP POLICY IF EXISTS "Select contracts by organization" ON public.employment_contracts;
CREATE POLICY "Select contracts by organization" ON public.employment_contracts 
FOR SELECT 
USING (
  organization_id IN (
    SELECT id FROM public.organizations
  )
);

-- Política de inserción/actualización para el motor (el motor usa service_role, así que no necesita estas políticas estrictamente, 
-- pero por si acaso el frontend las llama)
DROP POLICY IF EXISTS "Management of contracts" ON public.employment_contracts;
CREATE POLICY "Management of contracts" ON public.employment_contracts
FOR ALL
USING (true)
WITH CHECK (true);
