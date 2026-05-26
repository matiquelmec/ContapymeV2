-- ============================================================
-- MIGRACIÓN: Robustecimiento de Accesos y Seguridad RBAC
-- Fecha: 2026-05-26
-- Propósito: 
--   1. Crear un trigger automático en base de datos para la 
--      inicialización segura de perfiles en el registro de usuarios.
--   2. Robustecer las políticas de RLS de la tabla 'profiles' para 
--      impedir de forma absoluta que un usuario se auto-ascienda 
--      de rol o plan desde el cliente (escalada de privilegios).
-- ============================================================

-- 1. Crear la función del trigger para inicialización de perfiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, plan, onboarding_completed)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Registrado'),
    'user',        -- Rol por defecto, estrictamente limitado
    'personal',    -- Plan básico por defecto
    false          -- Obligado a realizar el onboarding inicial
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asegurar que el trigger exista y esté vinculado a la creación de usuarios de auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Limpiar políticas de actualización antiguas
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

-- 4. Crear nueva política de actualización robustecida:
--    Permite editar campos de perfil del usuario (nombre, avatar, etc.),
--    pero prohíbe de forma absoluta modificar el campo 'role' o 'plan' desde el cliente.
--    Se compara el nuevo valor propuesto con el valor almacenado actualmente en la base de datos.
CREATE POLICY "update_own_profile" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- El nuevo rol propuesto debe ser exactamente igual al rol actual
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    -- El nuevo plan propuesto debe ser exactamente igual al plan actual
    AND plan = (SELECT plan FROM public.profiles WHERE id = auth.uid())
  )
);

-- Recargar esquema de PostgREST para aplicar cambios inmediatamente
NOTIFY pgrst, 'reload schema';
