from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.database import get_supabase

router = APIRouter()

# ─── Defaults Previred 2025/2026 (Verificados con Previred.com) ───────────────
# NOTA: El SIS (Seguro de Invalidez y Sobrevivencia) es una tasa ÚNICA licitada
# por periodo. Desde julio 2024 la tasa vigente es 1.49% para todas las AFP.
# Las comisiones son variables por AFP y se actualizan mensualmente.
DEFAULT_AFP_CONFIGS = [
    {"name": "AFP Capital",   "code": "CAPITAL",   "commission_pct": 1.44, "sis_pct": 1.49, "active": True},
    {"name": "AFP Cuprum",    "code": "CUPRUM",    "commission_pct": 1.44, "sis_pct": 1.49, "active": True},
    {"name": "AFP Hábitat",   "code": "HABITAT",   "commission_pct": 1.27, "sis_pct": 1.49, "active": True},
    {"name": "AFP PlanVital", "code": "PLANVITAL", "commission_pct": 1.16, "sis_pct": 1.49, "active": True},
    {"name": "AFP ProVida",   "code": "PROVIDA",   "commission_pct": 1.45, "sis_pct": 1.49, "active": True},
    {"name": "AFP Modelo",    "code": "MODELO",    "commission_pct": 0.58, "sis_pct": 1.49, "active": True},
    {"name": "AFP Uno",       "code": "UNO",       "commission_pct": 0.69, "sis_pct": 1.49, "active": True},
]

# NOTA: En Chile, la cotización LEGAL de salud es siempre 7%.
# Las Isapres cobran un plan en UF ADICIONAL al 7%, pero para efectos
# del motor de cálculo, el descuento mínimo obligatorio es 7%.
# El plan pactado (en UF) se maneja a nivel de ficha del empleado.
DEFAULT_HEALTH_CONFIGS = [
    {"name": "FONASA",         "code": "FONASA",        "plan_pct": 7.0,  "active": True},
    {"name": "Banmédica",      "code": "BANMEDICA",     "plan_pct": 7.0,  "active": True},
    {"name": "Consalud",       "code": "CONSALUD",      "plan_pct": 7.0,  "active": True},
    {"name": "Cruz Blanca",    "code": "CRUZBLANCA",    "plan_pct": 7.0,  "active": True},
    {"name": "Vida Tres",      "code": "VIDATRES",      "plan_pct": 7.0,  "active": True},
    {"name": "Colmena",        "code": "COLMENA",       "plan_pct": 7.0,  "active": True},
    {"name": "Nueva Masvida",  "code": "NUEVA_MASVIDA", "plan_pct": 7.0,  "active": True},
]

DEFAULT_SETTINGS = {
    "afp_configs": DEFAULT_AFP_CONFIGS,
    "health_configs": DEFAULT_HEALTH_CONFIGS,
    # Topes Imponibles (Fuente: Superintendencia de Pensiones, vigente 2025)
    "uf_tope_afp": 84.3,              # UF — Tope imponible AFP y Salud
    "uf_tope_salud": 84.3,            # UF — Mismo tope para salud (DL 3500)
    "uf_tope_afc": 126.6,             # UF — Tope Seguro de Cesantía (Ley 19.728)
    # Sueldo Mínimo (Ley vigente)
    "sueldo_minimo": 529000,
    # Asignación Familiar (Montos por carga, vigentes 2025)
    "limite_asignacion_familiar": 1335433,
    "asignacion_tramo_a": 21243,
    "asignacion_tramo_b": 14516,
    "asignacion_tramo_c": 4590,
    # AFC — Seguro de Cesantía (Ley 19.728)
    "afc_indefinido_trabajador_pct": 0.6,
    "afc_indefinido_empresa_pct": 2.4,
    "afc_fijo_empresa_pct": 3.0,
    # Entidad
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
