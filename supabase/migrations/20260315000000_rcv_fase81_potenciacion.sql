-- ============================================================
-- MIGRACIÓN: 20260315000000 — RCV Fase 8.1 Potenciación
-- Aplicada: 2026-03-15 | Ambiente: Supabase
-- ============================================================
-- PROPÓSITO: Añadir columnas de análisis J+K, índices de
-- rendimiento y constraints UNIQUE correctos para el módulo RCV.
-- Este archivo es solo un REGISTRO HISTÓRICO. El esquema final
-- completo está en engine/db/schema.sql.
-- ============================================================

-- 1. Nuevas columnas en purchase_records
ALTER TABLE public.purchase_records
  ADD COLUMN IF NOT EXISTS monto_calculado BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS es_suma BOOLEAN DEFAULT true;

-- 2. Nuevas columnas en sales_records
ALTER TABLE public.sales_records
  ADD COLUMN IF NOT EXISTS monto_calculado BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS es_suma BOOLEAN DEFAULT true;

-- 3. Índices de rendimiento para consultas de análisis
CREATE INDEX IF NOT EXISTS idx_purchase_records_org_periodo ON public.purchase_records(organization_id, periodo);
CREATE INDEX IF NOT EXISTS idx_purchase_records_org_rut     ON public.purchase_records(organization_id, rut_emisor);
CREATE INDEX IF NOT EXISTS idx_sales_records_org_periodo    ON public.sales_records(organization_id, periodo);
CREATE INDEX IF NOT EXISTS idx_sales_records_org_rut        ON public.sales_records(organization_id, rut_receptor);

-- 4. Unique constraints para evitar duplicados en upsert
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_records_unique_doc') THEN
    ALTER TABLE public.purchase_records
      ADD CONSTRAINT purchase_records_unique_doc UNIQUE (organization_id, folio, rut_emisor, periodo);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_records_unique_doc') THEN
    ALTER TABLE public.sales_records
      ADD CONSTRAINT sales_records_unique_doc UNIQUE (organization_id, folio, rut_receptor, periodo);
  END IF;
END $$;
