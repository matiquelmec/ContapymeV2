-- Crear el bucket tax_documents si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('tax_documents', 'tax_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de RLS para Storage (El Engine usando service_role ignora esto, pero el cliente necesita poder subir)
-- Usuarios autenticados pueden subir archivos al bucket tax_documents
CREATE POLICY "Auth users can upload tax documents" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tax_documents');

-- Usuarios solo pueden leer/actualizar/borrar sus propios archivos subidos
-- O miembros de la organización a la que está atado el F29 (complejo con solo Storage RLS).
-- Para la V1, limitamos que solo pueden leer objetos que ellos mismos subieron usando auth.uid()
CREATE POLICY "Users can read own tax documents" ON storage.objects
    FOR SELECT TO authenticated USING (bucket_id = 'tax_documents' AND auth.uid() = owner);
