-- 🚀 MIGRACIÓN: Soporte de Referencias en DTE
-- Añade una columna JSONB a la tabla dte_issued para poder guardar referencias a otros documentos tributarios
-- (ej: facturas de origen al emitir notas de crédito/débito).

ALTER TABLE public.dte_issued 
ADD COLUMN IF NOT EXISTS referencias JSONB DEFAULT '[]'::jsonb;
