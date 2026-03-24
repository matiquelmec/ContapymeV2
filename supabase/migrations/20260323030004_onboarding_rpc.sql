-- ============================================================
-- CONTAPYME V2 — RPC para Onboarding atómico (CORREGIDO)
-- Fecha: 2026-03-23
-- ============================================================

-- Función 'security definer' para bypasear RLS y asegurar atomicidad
CREATE OR REPLACE FUNCTION public.create_new_company(
  p_rut text,
  p_nombre text,
  p_giro text,
  p_direccion text,
  p_comuna text,
  p_regimen text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- 1. Crear organización (ignora RLS porque es SECURITY DEFINER)
  INSERT INTO public.organizations (rut_empresa, nombre, giro, direccion, comuna, regimen_tributario)
  VALUES (p_rut, p_nombre, p_giro, p_direccion, p_comuna, p_regimen)
  RETURNING id INTO v_org_id;

  -- 2. Asignar el usuario actual como dueño
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'owner');

  -- NOTA: NO guardamos active_organization_id en la DB, ¡el frontend lo maneja por Cookies!
  
  RETURN v_org_id;
END;
$$;

-- Refrescar esquemas por precaución
NOTIFY pgrst, 'reload schema';
