-- ============================================================
-- CONTAPYME V2 — MIGRACIÓN: AGREGAR COLUMNAS PARA COMUNICADOS, MEDIOS Y PROTECCIÓN DE NOTICIAS
-- Fecha: 2026-10-23
-- Descripción: Agrega is_protected, author_name, content_type y media a regional_news
-- ============================================================

ALTER TABLE public.regional_news
  ADD COLUMN IF NOT EXISTS is_protected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'noticia',
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Evitar valores no permitidos en content_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'regional_news_content_type_check'
  ) THEN
    ALTER TABLE public.regional_news
      ADD CONSTRAINT regional_news_content_type_check
      CHECK (content_type IN ('noticia', 'comunicado'));
  END IF;
END $$;

-- Índice para consultar rápidamente noticias protegidas
CREATE INDEX IF NOT EXISTS idx_regional_news_protected
  ON public.regional_news (is_protected) WHERE is_protected = true;
