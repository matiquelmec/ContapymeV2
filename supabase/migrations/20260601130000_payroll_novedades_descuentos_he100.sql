-- ============================================================
-- 💸 MIGRACIÓN: Novedades — otros descuentos y horas extra 100%
-- Objetivo: permitir ingresar por período el anticipo de sueldo,
-- préstamos, retención judicial (alimentos) y las horas extra al 100%
-- (domingos/festivos), que el motor descuenta/calcula en la liquidación.
-- ============================================================

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS horas_extra_100_pendientes INTEGER NOT NULL DEFAULT 0
    CHECK (horas_extra_100_pendientes >= 0),
  ADD COLUMN IF NOT EXISTS descuento_anticipo BIGINT NOT NULL DEFAULT 0
    CHECK (descuento_anticipo >= 0),
  ADD COLUMN IF NOT EXISTS descuento_prestamo BIGINT NOT NULL DEFAULT 0
    CHECK (descuento_prestamo >= 0),
  ADD COLUMN IF NOT EXISTS descuento_judicial BIGINT NOT NULL DEFAULT 0
    CHECK (descuento_judicial >= 0);

COMMENT ON COLUMN public.employees.horas_extra_100_pendientes IS
  'Horas extra al 100% (domingos/festivos) del período en curso.';
COMMENT ON COLUMN public.employees.descuento_anticipo IS
  'Anticipo de sueldo a descontar en la liquidación del período.';
COMMENT ON COLUMN public.employees.descuento_prestamo IS
  'Préstamo o cuota a descontar en la liquidación del período.';
COMMENT ON COLUMN public.employees.descuento_judicial IS
  'Retención judicial / pensión de alimentos del período.';
