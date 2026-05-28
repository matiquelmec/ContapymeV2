-- ============================================================
-- 🏛️ MIGRACIÓN 14: Historial de Indicadores Económicos
-- Objetivo: Permitir el almacenamiento histórico de indicadores cambiando la unicidad a (codigo, fecha)
-- ============================================================

-- 1. Eliminar la restricción de unicidad antigua sobre la columna "codigo"
ALTER TABLE public.economic_indicators 
  DROP CONSTRAINT IF EXISTS idx_unique_indicator_code;

-- 2. Asegurarse de que no haya duplicados temporales antes de crear la nueva restricción
-- Si hay registros con el mismo (codigo, fecha), nos quedamos con el más actualizado (id mayor)
DELETE FROM public.economic_indicators a
USING public.economic_indicators b
WHERE a.id < b.id 
  AND a.codigo = b.codigo 
  AND a.fecha = b.fecha;

-- 3. Crear la nueva restricción única compuesta por (codigo, fecha) para permitir historial diario
ALTER TABLE public.economic_indicators 
  ADD CONSTRAINT idx_unique_indicator_code_fecha UNIQUE (codigo, fecha);

-- Notificar recarga de esquemas
NOTIFY pgrst, 'reload schema';
