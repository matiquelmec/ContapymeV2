-- Migration 04: Strongly Typed Domains

-- 1. Alterar tabla employees
ALTER TABLE public.employees
ALTER COLUMN sueldo_base TYPE clp_amount,
ALTER COLUMN plan_salud_uf TYPE uf_amount,
ALTER COLUMN asignacion_colacion TYPE clp_amount,
ALTER COLUMN asignacion_movilizacion TYPE clp_amount,
ALTER COLUMN bono_fijo TYPE clp_amount;

-- 2. Alterar tabla liquidations
ALTER TABLE public.liquidations
ALTER COLUMN sueldo_base TYPE clp_amount,
ALTER COLUMN total_haberes_brutos TYPE clp_amount,
ALTER COLUMN total_descuentos TYPE clp_amount,
ALTER COLUMN sueldo_liquido TYPE clp_amount,
ALTER COLUMN gratificacion TYPE clp_amount,
ALTER COLUMN asignacion_colacion TYPE clp_amount,
ALTER COLUMN asignacion_movilizacion TYPE clp_amount,
ALTER COLUMN horas_extra_monto TYPE clp_amount,
ALTER COLUMN base_imponible_afp TYPE clp_amount,
ALTER COLUMN base_imponible_salud TYPE clp_amount,
ALTER COLUMN base_imponible_impuesto TYPE clp_amount,
ALTER COLUMN afp_comision TYPE clp_amount,
ALTER COLUMN sis_empresa TYPE clp_amount,
ALTER COLUMN asignacion_familiar TYPE clp_amount,
ALTER COLUMN bono_extra TYPE clp_amount,
ALTER COLUMN salud_voluntaria TYPE clp_amount,
ALTER COLUMN salud_total TYPE clp_amount;

-- 3. Alterar tabla employee_terminations
ALTER TABLE public.employee_terminations
ALTER COLUMN monto_vacaciones TYPE clp_amount,
ALTER COLUMN monto_indemnizacion_anos TYPE clp_amount,
ALTER COLUMN monto_mes_aviso TYPE clp_amount,
ALTER COLUMN total_finiquito TYPE clp_amount,
ALTER COLUMN proportional_vacation_amount TYPE clp_amount,
ALTER COLUMN proportional_vacation_days TYPE numeric(10,4), -- Días de vacaciones pueden ser decimales
ALTER COLUMN notice_indemnification_amount TYPE clp_amount,
ALTER COLUMN christmas_bonus_amount TYPE clp_amount,
ALTER COLUMN other_bonuses_amount TYPE clp_amount,
ALTER COLUMN pending_overtime_amount TYPE clp_amount;
