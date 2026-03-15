from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.database import get_supabase

router = APIRouter()

# ─── Defaults Previred Agosto 2025 ────────────────────────────────────────────
DEFAULT_AFP_CONFIGS = [
    {"name": "AFP Capital",   "code": "CAPITAL",  "commission_pct": 1.44, "sis_pct": 1.88, "active": True},
    {"name": "AFP Cuprum",    "code": "CUPRUM",   "commission_pct": 1.44, "sis_pct": 1.88, "active": True},
    {"name": "AFP Hábitat",   "code": "HABITAT",  "commission_pct": 1.27, "sis_pct": 1.88, "active": True},
    {"name": "AFP PlanVital", "code": "PLANVITAL","commission_pct": 1.16, "sis_pct": 1.88, "active": True},
    {"name": "AFP ProVida",   "code": "PROVIDA",  "commission_pct": 1.45, "sis_pct": 1.88, "active": True},
    {"name": "AFP Modelo",    "code": "MODELO",   "commission_pct": 0.58, "sis_pct": 1.88, "active": True},
    {"name": "AFP Uno",       "code": "UNO",      "commission_pct": 0.49, "sis_pct": 1.88, "active": True},
]

DEFAULT_HEALTH_CONFIGS = [
    {"name": "FONASA",               "code": "FONASA",    "plan_pct": 7.0,  "active": True},
    {"name": "Banmédica",            "code": "BANMEDICA", "plan_pct": 8.5,  "active": True},
    {"name": "Consalud",             "code": "CONSALUD",  "plan_pct": 8.2,  "active": True},
    {"name": "Cruz Blanca",          "code": "CRUZBLANCA","plan_pct": 8.8,  "active": True},
    {"name": "Vida Tres",            "code": "VIDATRES",  "plan_pct": 8.3,  "active": True},
    {"name": "Colmena Golden Cross", "code": "COLMENA",   "plan_pct": 8.6,  "active": True},
]

DEFAULT_SETTINGS = {
    "afp_configs": DEFAULT_AFP_CONFIGS,
    "health_configs": DEFAULT_HEALTH_CONFIGS,
    "uf_tope_afp": 87.8,
    "uf_tope_salud": 83.3,
    "sueldo_minimo": 529000,
    "limite_asignacion_familiar": 1000000,
    "asignacion_tramo_a": 13596,
    "asignacion_tramo_b": 8397,
    "asignacion_tramo_c": 2798,
    "afc_indefinido_trabajador_pct": 0.6,
    "afc_indefinido_empresa_pct": 2.4,
    "afc_fijo_empresa_pct": 3.0,
    "mutual_code": "ACHS",
    "caja_compensacion_code": "",
    "rep_legal_nombre": "",
    "rep_legal_rut": "",
    "rep_legal_cargo": "GERENTE GENERAL",
}


class PayrollSettingsUpdate(BaseModel):
    organization_id: str
    afp_configs: Optional[list] = None
    health_configs: Optional[list] = None
    uf_tope_afp: Optional[float] = None
    uf_tope_salud: Optional[float] = None
    sueldo_minimo: Optional[int] = None
    limite_asignacion_familiar: Optional[int] = None
    asignacion_tramo_a: Optional[int] = None
    asignacion_tramo_b: Optional[int] = None
    asignacion_tramo_c: Optional[int] = None
    afc_indefinido_trabajador_pct: Optional[float] = None
    afc_indefinido_empresa_pct: Optional[float] = None
    afc_fijo_empresa_pct: Optional[float] = None
    mutual_code: Optional[str] = None
    caja_compensacion_code: Optional[str] = None
    rep_legal_nombre: Optional[str] = None
    rep_legal_rut: Optional[str] = None
    rep_legal_cargo: Optional[str] = None


@router.get("/settings/{organization_id}")
async def get_payroll_settings(organization_id: str):
    """
    Obtiene la configuración previsional de una organización.
    Si no existe, la crea con los valores oficiales de Previred.
    """
    db = get_supabase()
    try:
        res = db.table("organization_payroll_settings") \
                .select("*") \
                .eq("organization_id", organization_id) \
                .maybe_single() \
                .execute()

        if res.data:
            return {"success": True, "data": res.data}

        # No existe: insertar con defaults Previred
        insert_res = db.table("organization_payroll_settings") \
                       .insert({**DEFAULT_SETTINGS, "organization_id": organization_id}) \
                       .execute()

        return {"success": True, "data": insert_res.data[0], "created": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener configuración: {str(e)}")


@router.put("/settings")
async def update_payroll_settings(req: PayrollSettingsUpdate):
    """
    Actualiza la configuración previsional. Solo actualiza los campos enviados (patch parcial).
    """
    db = get_supabase()
    try:
        # Construir solo los campos enviados
        update_data = {k: v for k, v in req.model_dump().items()
                       if v is not None and k != "organization_id"}

        if not update_data:
            raise HTTPException(status_code=400, detail="No se enviaron campos a actualizar")

        res = db.table("organization_payroll_settings") \
                .update(update_data) \
                .eq("organization_id", req.organization_id) \
                .execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Configuración no encontrada")

        return {"success": True, "data": res.data[0], "message": "Configuración guardada correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar configuración: {str(e)}")


@router.post("/settings/sync-previred/{organization_id}")
async def sync_from_previred(organization_id: str):
    """
    Restablece los valores oficiales de Previred (útil cuando cambian tasas mensuales).
    En producción, esta función haría scraping de previred.com.
    """
    db = get_supabase()
    try:
        # Upsert: si existe actualiza, si no existe crea
        res = db.table("organization_payroll_settings") \
                .upsert(
                    {**DEFAULT_SETTINGS, "organization_id": organization_id},
                    on_conflict="organization_id"
                ).execute()

        return {
            "success": True,
            "data": res.data[0],
            "message": "✅ Tasas Previred 2025 aplicadas correctamente. AFP base: 10% + comisión variable."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al sincronizar con Previred: {str(e)}")
