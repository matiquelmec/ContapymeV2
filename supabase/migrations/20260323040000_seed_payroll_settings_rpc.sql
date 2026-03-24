-- ============================================================
-- RPC: Inicialización automática de Configuración Previsional
-- Crea un registro en organization_payroll_settings con las
-- AFPs e Instituciones de Salud oficiales de Chile (2025).
-- Se ejecuta al crear una nueva empresa (onboarding o modal).
-- ============================================================

CREATE OR REPLACE FUNCTION public.seed_payroll_settings(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo insertar si no existe ya (idempotente)
  IF EXISTS (
    SELECT 1 FROM organization_payroll_settings
    WHERE organization_id = p_org_id
  ) THEN
    RETURN;
  END IF;

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
    -- AFPs vigentes Chile 2025 (cotización obligatoria 10% + comisión variable)
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
    '',
    '',
    'GERENTE GENERAL'
  );
END;
$$;

-- Otorgar permisos al rol autenticado
GRANT EXECUTE ON FUNCTION public.seed_payroll_settings(uuid) TO authenticated;
