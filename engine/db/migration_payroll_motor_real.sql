-- ============================================================
-- MIGRACIÓN: Columnas nuevas del Motor de Remuneraciones Real
-- Fecha: 2026-03-15
-- Motivo: chilean_payroll.py escribe desglose completo de descuentos
--         que el esquema original no tenía. Se agregan las columnas
--         necesarias como nullable para retrocompatibilidad.
-- ============================================================

-- Desglose de haberes
ALTER TABLE public.liquidations
  ADD COLUMN IF NOT EXISTS gratificacion          bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS asignacion_colacion    bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS asignacion_movilizacion bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_extra_monto      bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bono_extra             bigint DEFAULT 0;

-- Bases imponibles
ALTER TABLE public.liquidations
  ADD COLUMN IF NOT EXISTS base_imponible_afp     bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_imponible_salud   bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_imponible_impuesto bigint DEFAULT 0;

-- Desglose AFP (cotización + comisión separados)
ALTER TABLE public.liquidations
  ADD COLUMN IF NOT EXISTS afp_comision           bigint DEFAULT 0;

-- Cargos empresa
ALTER TABLE public.liquidations
  ADD COLUMN IF NOT EXISTS sis_empresa            bigint DEFAULT 0;

-- Metadata del cálculo
ALTER TABLE public.liquidations
  ADD COLUMN IF NOT EXISTS afp_code               varchar DEFAULT '',
  ADD COLUMN IF NOT EXISTS salud_code             varchar DEFAULT '',
  ADD COLUMN IF NOT EXISTS tipo_contrato          varchar DEFAULT 'indefinido',
  ADD COLUMN IF NOT EXISTS uf_valor_usado         numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dias_trabajados        integer DEFAULT 30;

-- Verificar resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'liquidations' 
ORDER BY ordinal_position;
