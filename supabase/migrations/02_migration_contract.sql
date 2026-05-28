-- FASE 4: CONTRACT MIGRATION SQL
-- Limpieza final de estructuras obsoletas tras validación del código refactorizado

-- 1. Eliminar trigger y función de sincronización temporales
DROP TRIGGER IF EXISTS trg_sync_legacy_config ON public.centralized_account_config;
DROP FUNCTION IF EXISTS public.sync_legacy_config();

-- 2. Eliminar la tabla ancha legacy de configuración
DROP TABLE IF EXISTS public.centralized_account_config CASCADE;

-- 3. Eliminar la columna parent_codigo obsoleta de chart_of_accounts
ALTER TABLE public.chart_of_accounts DROP COLUMN IF EXISTS parent_codigo;
