-- Migration 03: Employees Bank Info
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS banco_transferencia text,
ADD COLUMN IF NOT EXISTS tipo_cuenta text,
ADD COLUMN IF NOT EXISTS cuenta_transferencia text;

-- Sincronizar datos históricos desde el finiquito más reciente de cada empleado
WITH latest_terminations AS (
    SELECT DISTINCT ON (employee_id) 
        employee_id, 
        banco_transferencia, 
        tipo_cuenta, 
        cuenta_transferencia
    FROM public.employee_terminations
    WHERE banco_transferencia IS NOT NULL AND banco_transferencia <> ''
    ORDER BY employee_id, created_at DESC
)
UPDATE public.employees emp
SET banco_transferencia = lt.banco_transferencia,
    tipo_cuenta = lt.tipo_cuenta,
    cuenta_transferencia = lt.cuenta_transferencia
FROM latest_terminations lt
WHERE emp.id = lt.employee_id;
