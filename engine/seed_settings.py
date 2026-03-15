import json
from core.database import get_supabase

def seed_settings():
    db = get_supabase()
    org_id = "ea722f9d-2a8e-4f77-90c5-6d3e9664b7f6"
    
    settings = {
        "organization_id": org_id,
        "afp_configs": [
            {"name": "AFP Habitat", "commission_pct": 1.27, "sis_pct": 1.88, "active": True},
            {"name": "AFP Provida", "commission_pct": 1.45, "sis_pct": 1.88, "active": True},
            {"name": "AFP Modelo", "commission_pct": 0.58, "sis_pct": 1.88, "active": True}
        ],
        "health_configs": [
            {"name": "FONASA", "plan_pct": 7.0, "active": True},
            {"name": "Isapre Consalud", "plan_pct": 7.0, "active": True},
            {"name": "Isapre Colmena", "plan_pct": 7.0, "active": True}
        ],
        "uf_tope_afp": 87.8,
        "uf_tope_salud": 126.6,
        "sueldo_minimo": 529000,
        "limite_asignacion_familiar": 1228614,
        "asignacion_tramo_a": 21243,
        "asignacion_tramo_b": 13036,
        "asignacion_tramo_c": 4119,
        "afc_indefinido_trabajador_pct": 0.6,
        "afc_indefinido_empresa_pct": 2.4,
        "afc_fijo_empresa_pct": 3.0,
        "mutual_code": "ACHS",
        "caja_compensacion_code": "LOS ANDES",
        "rep_legal_nombre": "JUAN PABLO RIQUELME",
        "rep_legal_rut": "15.432.876-K",
        "rep_legal_cargo": "GERENTE GENERAL"
    }

    try:
        # Usamos upsert basado en organization_id (que tiene restricción UNIQUE)
        res = db.table("organization_payroll_settings").upsert(settings).execute()
        print(f"✅ Configuración inyectada para Org: {org_id}")
        print(f"👤 Representante Legal: {settings['rep_legal_nombre']}")
    except Exception as e:
        print(f"❌ Error al inyectar: {str(e)}")

if __name__ == "__main__":
    seed_settings()
