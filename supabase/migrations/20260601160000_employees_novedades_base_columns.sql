-- ============================================================
-- 🩹 MIGRACIÓN: Columnas base de novedades en employees
-- Objetivo: corregir un bug latente. La planilla de novedades escribe
-- dias_trabajados, horas_extra_pendientes y bono_extra en employees, pero
-- esas columnas solo existían en liquidations. Sin ellas, guardar novedades
-- falla con "Could not find the 'bono_extra' column of 'employees'".
-- ============================================================

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS dias_trabajados INTEGER NOT NULL DEFAULT 30
    CHECK (dias_trabajados >= 0 AND dias_trabajados <= 31),
  ADD COLUMN IF NOT EXISTS horas_extra_pendientes INTEGER NOT NULL DEFAULT 0
    CHECK (horas_extra_pendientes >= 0),
  ADD COLUMN IF NOT EXISTS bono_extra BIGINT NOT NULL DEFAULT 0
    CHECK (bono_extra >= 0);

COMMENT ON COLUMN public.employees.dias_trabajados IS
  'Días trabajados del período en curso (novedad mensual).';
COMMENT ON COLUMN public.employees.horas_extra_pendientes IS
  'Horas extra al 50% del período en curso (novedad mensual).';
COMMENT ON COLUMN public.employees.bono_extra IS
  'Bono/remuneración variable del período en curso (novedad mensual).';

-- Refrescar el cache de esquema de PostgREST para que la API reconozca las columnas.
NOTIFY pgrst, 'reload schema';
