-- ============================================================
-- MIGRACIÓN: 20260315000001 — Motor Payroll Real (Fase 7)
-- Aplicada: 2026-03-15 | Ambiente: Supabase
-- ============================================================
-- PROPÓSITO: Añadir columnas de desglose completo de descuentos
-- y metadata de cálculo al Motor Real de Remuneraciones
-- (chilean_payroll.py). Todas nullable para retrocompatibilidad.
-- Este archivo es solo un REGISTRO HISTÓRICO. El esquema final
-- completo está en engine/db/schema.sql.
-- ============================================================

-- Desglose de haberes
ALTER TABLE public.liquidations
  ADD COLUMN IF NOT EXISTS gratificacion           bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS asignacion_colacion     bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS asignacion_movilizacion bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_extra_monto       bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bono_extra              bigint DEFAULT 0;

-- Bases imponibles
ALTER TABLE public.liquidations
  ADD COLUMN IF NOT EXISTS base_imponible_afp      bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_imponible_salud    bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_imponible_impuesto bigint DEFAULT 0;

-- Desglose AFP y cargos empresa
ALTER TABLE public.liquidations
  ADD COLUMN IF NOT EXISTS afp_comision            bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sis_empresa             bigint DEFAULT 0;

-- Metadata del cálculo
ALTER TABLE public.liquidations
  ADD COLUMN IF NOT EXISTS afp_code                varchar DEFAULT '',
  ADD COLUMN IF NOT EXISTS salud_code              varchar DEFAULT '',
  ADD COLUMN IF NOT EXISTS tipo_contrato           varchar DEFAULT 'indefinido',
  ADD COLUMN IF NOT EXISTS uf_valor_usado          numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dias_trabajados         integer DEFAULT 30;
