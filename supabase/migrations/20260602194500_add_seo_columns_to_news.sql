-- ============================================================
-- CONTAPYME V2 — MIGRACIÓN: AGREGAR COLUMNAS SEO A REGIONAL_NEWS
-- Fecha: 2026-06-02
-- Descripción: Agrega seo_description y seo_keywords a la tabla regional_news para soporte SEO en el diario regional.
-- ============================================================

ALTER TABLE public.regional_news 
ADD COLUMN IF NOT EXISTS seo_description text,
ADD COLUMN IF NOT EXISTS seo_keywords text;
