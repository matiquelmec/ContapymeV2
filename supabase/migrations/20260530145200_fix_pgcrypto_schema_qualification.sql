-- 🚀 MIGRACIÓN DE REPARACIÓN: Calificación de Esquema para pgcrypto
-- Schema-qualify pgp_sym_encrypt y pgp_sym_decrypt con 'extensions'
-- para evitar errores cuando el search_path de la conexión no incluye el esquema de extensiones.

CREATE OR REPLACE FUNCTION public.decrypt_cert_password(encrypted_password TEXT, org_id UUID) 
RETURNS TEXT AS $$
DECLARE
    calling_user_id UUID;
    user_role TEXT;
BEGIN
    calling_user_id := auth.uid();
    
    -- Si es ejecutado por el rol de sistema/servicio (service_role), omitimos la verificación
    IF auth.role() = 'service_role' THEN
        RETURN extensions.pgp_sym_decrypt(encrypted_password::bytea, org_id::TEXT || '_secure_salt_dte');
    END IF;

    -- Si no hay usuario autenticado, lanzar error
    IF calling_user_id IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado: Usuario no autenticado.';
    END IF;

    -- Validar que el usuario pertenece a la organización y tiene un rol administrativo
    SELECT role::TEXT INTO user_role
    FROM public.organization_members
    WHERE user_id = calling_user_id AND organization_id = org_id;

    IF user_role IS NULL OR NOT (user_role IN ('owner', 'admin', 'accountant')) THEN
        RAISE EXCEPTION 'Acceso denegado: El usuario no tiene permisos suficientes en esta organización.';
    END IF;

    RETURN extensions.pgp_sym_decrypt(encrypted_password::bytea, org_id::TEXT || '_secure_salt_dte');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.encrypt_cert_password(password TEXT, org_id UUID) 
RETURNS TEXT AS $$
DECLARE
    calling_user_id UUID;
    user_role TEXT;
BEGIN
    calling_user_id := auth.uid();
    
    -- Si es ejecutado por el rol de sistema/servicio (service_role), omitimos la verificación
    IF auth.role() = 'service_role' THEN
        RETURN extensions.pgp_sym_encrypt(password, org_id::TEXT || '_secure_salt_dte');
    END IF;

    -- Si no hay usuario autenticado, lanzar error
    IF calling_user_id IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado: Usuario no autenticado.';
    END IF;

    -- Validar que el usuario pertenece a la organización y tiene un rol administrativo
    SELECT role::TEXT INTO user_role
    FROM public.organization_members
    WHERE user_id = calling_user_id AND organization_id = org_id;

    IF user_role IS NULL OR NOT (user_role IN ('owner', 'admin', 'accountant')) THEN
        RAISE EXCEPTION 'Acceso denegado: El usuario no tiene permisos suficientes en esta organización.';
    END IF;

    RETURN extensions.pgp_sym_encrypt(password, org_id::TEXT || '_secure_salt_dte');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
