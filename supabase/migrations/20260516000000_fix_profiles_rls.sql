-- ============================================================
-- MIGRACIÓN: Corrección RLS Perfiles (Self-Service Profile)
-- Fecha: 2026-05-16
-- Propósito: Permitir a los usuarios actualizar su propio perfil
--           y ver los nombres de sus compañeros de equipo.
-- ============================================================

-- 1. Asegurar que RLS esté habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas para evitar colisiones
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

-- 3. Política de LECTURA: Ver mi perfil o el de mis compañeros de empresa
CREATE POLICY "view_profiles" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.organization_members m1
    WHERE m1.user_id = public.profiles.id
    AND m1.organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  )
);

-- 4. Política de INSERCIÓN: Permitir crear mi propio perfil (Necesario para upsert inicial)
CREATE POLICY "insert_own_profile" 
ON public.profiles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- 5. Política de ACTUALIZACIÓN: Solo puedo editar mi propia información
CREATE POLICY "update_own_profile" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Recargar esquema para PostgREST
NOTIFY pgrst, 'reload schema';
