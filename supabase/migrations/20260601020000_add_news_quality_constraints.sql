-- ============================================================
-- MIGRACIÓN: 20260601020000 — Agregar restricciones de calidad a regional_news
-- Propósito: Garantizar físicamente que no se inserten noticias truncadas, cortas o con HTML.
-- ============================================================

-- 1. Agregar restricciones CHECK a la tabla regional_news
ALTER TABLE public.regional_news
  DROP CONSTRAINT IF EXISTS content_not_truncated,
  DROP CONSTRAINT IF EXISTS summary_not_truncated,
  DROP CONSTRAINT IF EXISTS content_no_html;

ALTER TABLE public.regional_news
  ADD CONSTRAINT content_not_truncated CHECK (
    content NOT LIKE '%...' AND 
    content NOT LIKE '%…' AND 
    length(content) >= 200
  ),
  ADD CONSTRAINT summary_not_truncated CHECK (
    summary IS NULL OR (
      summary NOT LIKE '%...' AND 
      summary NOT LIKE '%…'
    )
  ),
  ADD CONSTRAINT content_no_html CHECK (
    content NOT LIKE '%<a%' AND 
    content NOT LIKE '%href=%' AND 
    content NOT LIKE '%<div%'
  );
