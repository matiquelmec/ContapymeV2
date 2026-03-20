-- ============================================================
-- CONTAPYME V2 — MIGRACIÓN: DIARIO REGIONAL (Actualizada)
-- Fecha: 2026-03-18
-- Descripción: Crea la tabla regional_news con soporte para Slugs y SEO.
-- ============================================================

-- 1. Crear tabla de noticias
CREATE TABLE IF NOT EXISTS public.regional_news (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  category text NOT NULL DEFAULT 'REGIONAL',
  content text NOT NULL,
  summary text,
  image_url text,
  source_url text,
  source_name text,
  normalized_title text,
  is_featured boolean DEFAULT false,
  published_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT regional_news_pkey PRIMARY KEY (id),
  CONSTRAINT regional_news_unique_title UNIQUE (title),
  CONSTRAINT regional_news_unique_slug UNIQUE (slug),
  CONSTRAINT regional_news_unique_source_url UNIQUE (source_url)
);

-- 2. Habilitar RLS
ALTER TABLE public.regional_news ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso (Lectura Pública)
DROP POLICY IF EXISTS "Permitir lectura pública de noticias" ON public.regional_news;
CREATE POLICY "Permitir lectura pública de noticias" 
  ON public.regional_news 
  FOR SELECT 
  USING (true);

-- 4. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_news_published ON public.regional_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_featured ON public.regional_news(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_news_slug ON public.regional_news(slug);
