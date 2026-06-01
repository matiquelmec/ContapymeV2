-- ============================================================
-- 🧳 MIGRACIÓN: Asignación de viático (haber no imponible)
-- Objetivo: registrar el viático del trabajador (Art. 41 CT), análogo a
-- colación y movilización, para incluirlo en la liquidación como haber no
-- imponible.
-- ============================================================

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS asignacion_viatico BIGINT NOT NULL DEFAULT 0
    CHECK (asignacion_viatico >= 0);

COMMENT ON COLUMN public.employees.asignacion_viatico IS
  'Asignación de viático mensual (no imponible, Art. 41 CT).';
