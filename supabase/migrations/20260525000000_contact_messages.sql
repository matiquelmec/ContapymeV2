-- =======================================================
-- MIGRACIÓN: CREACIÓN DE TABLA PARA MENSAJES DE CONTACTO
-- =======================================================

-- 1. Crear tabla de mensajes de contacto
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending'::text NOT NULL
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 3. Permitir que cualquier visitante del sitio web envíe mensajes (Insert)
CREATE POLICY "Permitir inserción pública de mensajes" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- 4. Permitir que solo los usuarios autenticados puedan leerlos (Select)
CREATE POLICY "Permitir lectura solo a usuarios autenticados" 
ON public.contact_messages 
FOR SELECT 
TO authenticated 
USING (true);
