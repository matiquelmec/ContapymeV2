-- Migración SQL: Actualización de Parámetros Previsionales 2026
-- Timestamp: 20260601000000

-- Actualizar o insertar los parámetros previsionales e históricos del año 2026
INSERT INTO public.national_payroll_params (
    periodo, sueldo_minimo, tope_afp_uf, tope_salud_uf, tope_afc_uf, sis_pct,
    afc_indefinido_trabajador_pct, afc_indefinido_empresa_pct, afc_fijo_empresa_pct
) VALUES 
-- Enero 2026
('2026-01-01', 539000, 89.9000, 89.9000, 135.1000, 1.53, 0.60, 2.40, 3.00),
-- Febrero 2026
('2026-02-01', 539000, 90.0000, 90.0000, 135.2000, 1.54, 0.60, 2.40, 3.00),
-- Marzo 2026
('2026-03-01', 539000, 90.0000, 90.0000, 135.2000, 1.54, 0.60, 2.40, 3.00),
-- Abril 2026
('2026-04-01', 539000, 90.0000, 90.0000, 135.2000, 1.62, 0.60, 2.40, 3.00),
-- Mayo 2026
('2026-05-01', 539000, 90.0000, 90.0000, 135.2000, 1.62, 0.60, 2.40, 3.00)
ON CONFLICT (periodo) DO UPDATE SET
    sueldo_minimo = EXCLUDED.sueldo_minimo,
    tope_afp_uf = EXCLUDED.tope_afp_uf,
    tope_salud_uf = EXCLUDED.tope_salud_uf,
    tope_afc_uf = EXCLUDED.tope_afc_uf,
    sis_pct = EXCLUDED.sis_pct,
    afc_indefinido_trabajador_pct = EXCLUDED.afc_indefinido_trabajador_pct,
    afc_indefinido_empresa_pct = EXCLUDED.afc_indefinido_empresa_pct,
    afc_fijo_empresa_pct = EXCLUDED.afc_fijo_empresa_pct;
