-- Corrige el Ingreso Minimo Mensual vigente desde enero 2026.
-- Fuente: Direccion del Trabajo, IMM trabajadores 18-65: $539.000 desde 2026-01-01.

INSERT INTO public.national_payroll_params (
    periodo,
    sueldo_minimo,
    tope_afp_uf,
    tope_salud_uf,
    tope_afc_uf,
    sis_pct,
    afc_indefinido_trabajador_pct,
    afc_indefinido_empresa_pct,
    afc_fijo_empresa_pct
) VALUES (
    '2026-01-01',
    539000,
    84.3,
    84.3,
    126.6,
    1.49,
    0.6,
    2.4,
    3.0
)
ON CONFLICT (periodo) DO UPDATE SET
    sueldo_minimo = EXCLUDED.sueldo_minimo,
    tope_afp_uf = EXCLUDED.tope_afp_uf,
    tope_salud_uf = EXCLUDED.tope_salud_uf,
    tope_afc_uf = EXCLUDED.tope_afc_uf,
    sis_pct = EXCLUDED.sis_pct,
    afc_indefinido_trabajador_pct = EXCLUDED.afc_indefinido_trabajador_pct,
    afc_indefinido_empresa_pct = EXCLUDED.afc_indefinido_empresa_pct,
    afc_fijo_empresa_pct = EXCLUDED.afc_fijo_empresa_pct;
