-- ============================================================
-- MIGRACIÓN: 20260316000000 — Blindaje de Integridad RCV
-- Propósito: Garantizar que el periodo siempre coincida con la 
-- fecha real del documento, eliminando errores de usuario.
-- ============================================================

-- 1. Función de validación y auto-corrección de periodo
CREATE OR REPLACE FUNCTION fn_secure_rcv_period()
RETURNS TRIGGER AS $$
BEGIN
    -- Forzar que el campo 'periodo' sea siempre el primer día del mes de 'fecha_docto'
    -- Esto hace que el sistema sea 'Data-Driven': la verdad está en el documento.
    NEW.periodo := DATE_TRUNC('month', NEW.fecha_docto)::DATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para COMPRAS
DROP TRIGGER IF EXISTS tr_secure_purchase_period ON public.purchase_records;
CREATE TRIGGER tr_secure_purchase_period
BEFORE INSERT OR UPDATE OF fecha_docto, periodo ON public.purchase_records
FOR EACH ROW EXECUTE FUNCTION fn_secure_rcv_period();

-- 3. Trigger para VENTAS
DROP TRIGGER IF EXISTS tr_secure_sales_period ON public.sales_records;
CREATE TRIGGER tr_secure_sales_period
BEFORE INSERT OR UPDATE OF fecha_docto, periodo ON public.sales_records
FOR EACH ROW EXECUTE FUNCTION fn_secure_rcv_period();

-- 4. Limpieza final de datos huérfanos en rcv_imports (Sobres vacíos)
-- Borra lotes que digan 2025 pero no tengan documentos reales asociados.
DELETE FROM public.rcv_imports
WHERE periodo >= '2025-01-01'
AND NOT EXISTS (
    SELECT 1 FROM public.purchase_records p WHERE p.import_id = public.rcv_imports.id
)
AND NOT EXISTS (
    SELECT 1 FROM public.sales_records s WHERE s.import_id = public.rcv_imports.id
);

COMMENT ON FUNCTION fn_secure_rcv_period IS 'Garantiza integridad absoluta: el periodo contable se extrae de la fecha real del documento SII.';
