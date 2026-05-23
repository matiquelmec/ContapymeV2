-- ============================================================
-- 📊 TABLA DE HISTORIAL DE PARÁMETROS NACIONALES DE NÓMINA
-- Fecha: 2026-05-23
-- Objetivo: Almacenar los topes, sueldos mínimos y porcentajes de
--          leyes sociales de Chile por mes calendario para
--          permitir recálculos históricos precisos.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.national_payroll_params (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    periodo date NOT NULL UNIQUE, -- Almacena 'YYYY-MM-01'
    sueldo_minimo bigint NOT NULL DEFAULT 500000,
    tope_afp_uf numeric(10,4) NOT NULL DEFAULT 84.3000,
    tope_salud_uf numeric(10,4) NOT NULL DEFAULT 84.3000,
    tope_afc_uf numeric(10,4) NOT NULL DEFAULT 126.6000,
    sis_pct numeric(5,2) NOT NULL DEFAULT 1.49, -- SIS actual Chile
    afc_indefinido_trabajador_pct numeric(5,2) NOT NULL DEFAULT 0.60,
    afc_indefinido_empresa_pct numeric(5,2) NOT NULL DEFAULT 2.40,
    afc_fijo_empresa_pct numeric(5,2) NOT NULL DEFAULT 3.00,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT national_payroll_params_pkey PRIMARY KEY (id)
);

-- Seed de Parámetros de Emergencia de Referencia (Valores vigentes Chile 2026)
INSERT INTO public.national_payroll_params (
    periodo, sueldo_minimo, tope_afp_uf, tope_salud_uf, tope_afc_uf, 
    sis_pct, afc_indefinido_trabajador_pct, afc_indefinido_empresa_pct, afc_fijo_empresa_pct
) VALUES (
    '2026-01-01', 500000, 84.3, 84.3, 126.6, 1.49, 0.6, 2.4, 3.0
) ON CONFLICT (periodo) DO NOTHING;
