-- =============================================================================
-- RCV: Clave de unicidad canonica (organization_id, tipo_documento, folio, rut)
-- Fecha: 2026-06-01
--
-- CAUSA RAIZ:
--   El upsert de COMPRAS apuntaba a la constraint vieja
--     purchase_records_unique_doc (organization_id, folio, rut_emisor, periodo)
--   que NO incluye tipo_documento. Dos documentos legitimos del mismo emisor con
--   el mismo folio pero distinto tipo (ej: factura 100 + nota de credito 100), o
--   varias filas de resumen con folio 0, colapsan a la misma clave dentro de un
--   mismo lote => ERROR 21000:
--     'ON CONFLICT DO UPDATE command cannot affect row a second time'.
--
-- SOLUCION:
--   1) Garantizar la constraint canonica *_org_tipo_folio_unique (fase4) que SI
--      distingue por tipo_documento.
--   2) Eliminar la constraint vieja *_unique_doc, incompatible con la realidad
--      del SII (un mismo folio puede repetirse entre tipos de documento).
--
-- Idempotente y no destructiva: si la constraint canonica no existe y hay
-- duplicados historicos, FALLA explicitamente en vez de borrar datos.
-- =============================================================================

SET search_path = public;

-- 1) Garantizar constraint canonica en purchase_records / sales_records
DO $$
DECLARE
  v_exists boolean;
  v_dupes bigint;
BEGIN
  -- purchase_records
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname='public' AND t.relname='purchase_records'
      AND c.conname='purchase_records_org_tipo_folio_unique'
  ) INTO v_exists;

  IF NOT v_exists THEN
    SELECT COUNT(*) INTO v_dupes FROM (
      SELECT 1 FROM public.purchase_records
      GROUP BY organization_id, tipo_documento, folio, rut_emisor
      HAVING COUNT(*) > 1
    ) d;
    IF v_dupes > 0 THEN
      RAISE EXCEPTION 'No se puede crear purchase_records_org_tipo_folio_unique: existen % grupos duplicados. Depure antes de migrar.', v_dupes;
    END IF;
    ALTER TABLE public.purchase_records
      ADD CONSTRAINT purchase_records_org_tipo_folio_unique
      UNIQUE (organization_id, tipo_documento, folio, rut_emisor);
  END IF;

  -- sales_records
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname='public' AND t.relname='sales_records'
      AND c.conname='sales_records_org_tipo_folio_unique'
  ) INTO v_exists;

  IF NOT v_exists THEN
    SELECT COUNT(*) INTO v_dupes FROM (
      SELECT 1 FROM public.sales_records
      GROUP BY organization_id, tipo_documento, folio, rut_receptor
      HAVING COUNT(*) > 1
    ) d;
    IF v_dupes > 0 THEN
      RAISE EXCEPTION 'No se puede crear sales_records_org_tipo_folio_unique: existen % grupos duplicados. Depure antes de migrar.', v_dupes;
    END IF;
    ALTER TABLE public.sales_records
      ADD CONSTRAINT sales_records_org_tipo_folio_unique
      UNIQUE (organization_id, tipo_documento, folio, rut_receptor);
  END IF;
END
$$;

-- 2) Eliminar la constraint vieja (incompatible: mezcla tipos de documento por folio)
ALTER TABLE public.purchase_records DROP CONSTRAINT IF EXISTS purchase_records_unique_doc;
ALTER TABLE public.sales_records    DROP CONSTRAINT IF EXISTS sales_records_unique_doc;

NOTIFY pgrst, 'reload schema';
