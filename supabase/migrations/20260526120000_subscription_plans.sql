-- MIGRACIÓN: Sistema de suscripciones y límites comerciales
-- Añade la columna 'plan' a la tabla 'profiles' para controlar acceso a características y límites de empresas.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'personal' 
CONSTRAINT check_profile_plan CHECK (plan = ANY (ARRAY['personal'::text, 'estudio'::text, 'consorcio'::text]));

-- Actualizar registros existentes que puedan tener plan nulo
UPDATE public.profiles 
SET plan = 'personal' 
WHERE plan IS NULL;

-- Asignar plan 'consorcio' al usuario actual si existe para propósitos de prueba
-- (Se ejecuta de forma segura y silenciosa)
DO $$
BEGIN
  -- Actualizar el perfil del usuario administrador del sistema si corresponde
  UPDATE public.profiles 
  SET plan = 'consorcio' 
  WHERE role = 'admin' OR id IN (
    -- Subconsulta segura para encontrar cuentas de administradores
    SELECT user_id FROM public.organization_members WHERE role = 'owner' LIMIT 1
  );
END $$;
