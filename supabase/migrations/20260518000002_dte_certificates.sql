-- 🚀 MIGRACIÓN: Bóveda de Certificados DTE
-- Añade soporte seguro para almacenamiento de certificados .pfx y claves.

-- 1. Crear el bucket privado para los certificados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dte_certificates',
  'dte_certificates',
  false, -- Privado
  5242880, -- 5MB límite
  ARRAY['application/x-pkcs12', 'application/pkcs12', 'application/octet-stream']
) ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Seguridad (RLS) para el Bucket
CREATE POLICY "Acceso de lectura y escritura a miembros de organizacion"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'dte_certificates'
  AND (
    auth.uid() IN (
      SELECT user_id FROM public.organization_members
    )
  )
);

-- 3. Añadir columnas a dte_companies para la clave y referencia del archivo
ALTER TABLE public.dte_companies 
ADD COLUMN IF NOT EXISTS cert_path TEXT,
ADD COLUMN IF NOT EXISTS cert_password_encrypted TEXT,
ADD COLUMN IF NOT EXISTS cert_uploaded_at TIMESTAMPTZ;

-- 4. Función de ayuda para cifrar contraseñas (usando pgcrypto)
CREATE OR REPLACE FUNCTION public.encrypt_cert_password(password TEXT, org_id UUID) 
RETURNS TEXT AS $$
BEGIN
    -- Se usa el ID de la organización como parte de la "sal" para cifrar simétricamente
    RETURN pgp_sym_encrypt(password, org_id::TEXT || '_secure_salt_dte');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_cert_password(encrypted_password TEXT, org_id UUID) 
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_password::bytea, org_id::TEXT || '_secure_salt_dte');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
