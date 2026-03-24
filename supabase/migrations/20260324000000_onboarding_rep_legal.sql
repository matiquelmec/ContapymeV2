-- ============================================================
-- CONTAPYME V2 — Onboarding: Parámetros de Representante Legal
-- Fecha: 2026-03-24
-- ============================================================

-- Actualizar la función para aceptar datos del representante legal
CREATE OR REPLACE FUNCTION public.seed_payroll_settings(
  p_org_id uuid,
  p_rep_nombre text DEFAULT '',
  p_rep_rut text DEFAULT '',
  p_rep_cargo text DEFAULT 'GERENTE GENERAL'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Eliminar si ya existe algo para evitar duplicados en la re-ejecución
  DELETE FROM organization_payroll_settings WHERE organization_id = p_org_id;

  INSERT INTO organization_payroll_settings (
    organization_id,
    afp_configs,
    health_configs,
    mutual_code,
    caja_compensacion_code,
    rep_legal_nombre,
    rep_legal_rut,
    rep_legal_cargo
  ) VALUES (
    p_org_id,
    -- AFPs vigentes Chile 2025
    '[
      {"name": "AFP CAPITAL",    "code": "CAPITAL",    "commission_pct": 1.44, "sis_pct": 1.49, "active": true},
      {"name": "AFP CUPRUM",     "code": "CUPRUM",     "commission_pct": 1.44, "sis_pct": 1.49, "active": true},
      {"name": "AFP HABITAT",    "code": "HABITAT",    "commission_pct": 1.27, "sis_pct": 1.49, "active": true},
      {"name": "AFP MODELO",     "code": "MODELO",     "commission_pct": 0.58, "sis_pct": 1.49, "active": true},
      {"name": "AFP PLANVITAL",  "code": "PLANVITAL",  "commission_pct": 1.16, "sis_pct": 1.49, "active": true},
      {"name": "AFP PROVIDA",    "code": "PROVIDA",    "commission_pct": 1.45, "sis_pct": 1.49, "active": true},
      {"name": "AFP UNO",        "code": "UNO",        "commission_pct": 0.49, "sis_pct": 1.49, "active": true}
    ]'::jsonb,
    -- Instituciones de Salud vigentes Chile 2025
    '[
      {"name": "FONASA",         "code": "FONASA",     "plan_pct": 7.0, "active": true},
      {"name": "BANMÉDICA",      "code": "BANMEDICA",  "plan_pct": 7.0, "active": true},
      {"name": "CONSALUD",       "code": "CONSALUD",   "plan_pct": 7.0, "active": true},
      {"name": "COLMENA",        "code": "COLMENA",    "plan_pct": 7.0, "active": true},
      {"name": "CRUZ BLANCA",    "code": "CRUZBLANCA", "plan_pct": 7.0, "active": true},
      {"name": "NUEVA MASVIDA",  "code": "MASVIDA",    "plan_pct": 7.0, "active": true},
      {"name": "VIDA TRES",      "code": "VIDATRES",   "plan_pct": 7.0, "active": true}
    ]'::jsonb,
    'ACHS',
    '',
    p_rep_nombre,
    p_rep_rut,
    p_rep_cargo
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
