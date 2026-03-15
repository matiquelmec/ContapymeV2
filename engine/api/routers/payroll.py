"""
payroll.py — Router de Remuneraciones
=====================================
Orquesta el procesamiento de nómina usando el Motor Matemático real
de chilean_payroll.py. Este router es solo el intermediario HTTP:
NO contiene lógica de negocio.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.database import get_supabase
from calculators.chilean_payroll import (
    EmployeeInput,
    PayrollSettings,
    calcular_liquidacion,
    to_db_dict,
)

router = APIRouter()


class PayrollRequest(BaseModel):
    org_id: str
    periodo: str  # "YYYY-MM"


@router.post("/process")
async def process_payroll(req: PayrollRequest):
    """
    Endpoint del Motor Matemático para procesar liquidaciones en lote.
    
    Para cada empleado activo de la organización:
      1. Obtiene la configuración previsional de la organización
      2. Obtiene el valor UF y UTM actuales desde economic_indicators
      3. Invoca el motor puro de chilean_payroll.py
      4. Hace upsert en la tabla `liquidations`
    """
    db = get_supabase()

    try:
        # ── 1. Configuración previsional de la organización ──────────────────
        cfg_res = db.table("organization_payroll_settings") \
            .select("*") \
            .eq("organization_id", req.org_id) \
            .maybe_single() \
            .execute()

        cfg = cfg_res.data or {}

        # ── 2. Indicadores económicos (UF y UTM) ─────────────────────────────
        uf_valor = 38_000.0
        utm_valor = 67_294.0

        try:
            ind_res = db.table("economic_indicators") \
                .select("codigo, valor") \
                .in_("codigo", ["uf", "utm"]) \
                .execute()

            for ind in (ind_res.data or []):
                if ind["codigo"] == "uf":
                    uf_valor = float(ind["valor"])
                elif ind["codigo"] == "utm":
                    utm_valor = float(ind["valor"])
        except Exception:
            pass  # Usar defaults si no hay indicadores

        # ── 3. Construir PayrollSettings desde la configuración ───────────────
        settings = PayrollSettings(
            uf_valor=uf_valor,
            uf_tope_afp=float(cfg.get("uf_tope_afp", 87.8)),
            uf_tope_salud=float(cfg.get("uf_tope_salud", 83.3)),
            sueldo_minimo=int(cfg.get("sueldo_minimo", 529_000)),
            afc_indefinido_trabajador_pct=float(cfg.get("afc_indefinido_trabajador_pct", 0.6)),
            afc_indefinido_empresa_pct=float(cfg.get("afc_indefinido_empresa_pct", 2.4)),
            afc_fijo_empresa_pct=float(cfg.get("afc_fijo_empresa_pct", 3.0)),
            afp_sis_pct=float(cfg.get("afp_sis_pct", 1.49)),
        )

        # ── 4. Traer empleados activos ────────────────────────────────────────
        emp_res = db.table("employees") \
            .select("*") \
            .eq("organization_id", req.org_id) \
            .eq("activo", True) \
            .execute()

        employees = emp_res.data or []
        if not employees:
            return {
                "success": True,
                "processed_count": 0,
                "message": "No hay empleados activos para procesar.",
            }

        # ── 5. Calcular y guardar liquidaciones ───────────────────────────────
        processed_count = 0
        advertencias_totales = []

        for emp in employees:
            # Resolver comisión AFP del empleado
            afp_comision_pct = 1.27  # default Hábitat
            afp_code = emp.get("afp", "HABITAT")
            salud_code = emp.get("prevision_salud", "FONASA")
            salud_pct = 7.0

            if cfg.get("afp_configs"):
                for afp in cfg["afp_configs"]:
                    if afp.get("code") == afp_code:
                        afp_comision_pct = float(afp.get("commission_pct", 1.27))
                        break

            if cfg.get("health_configs"):
                for h in cfg["health_configs"]:
                    if h.get("code") == salud_code:
                        salud_pct = float(h.get("plan_pct", 7.0))
                        break

            emp_input = EmployeeInput(
                sueldo_base=int(emp.get("sueldo_base", 0)),
                tipo_contrato=emp.get("tipo_contrato", "indefinido"),
                afp_code=afp_code,
                afp_comision_pct=afp_comision_pct,
                salud_code=salud_code,
                salud_pct=salud_pct,
                gratificacion_legal=bool(emp.get("gratificacion_legal", True)),
                asignacion_movilizacion=int(emp.get("asignacion_movilizacion", 0)),
                asignacion_colacion=int(emp.get("asignacion_colacion", 0)),
                horas_extra=int(emp.get("horas_extra_pendientes", 0)),
            )

            result = calcular_liquidacion(emp_input, settings, utm_valor)

            if result.advertencias:
                advertencias_totales.extend([
                    f"{emp.get('nombres', 'Empleado')}: {a}"
                    for a in result.advertencias
                ])

            liq_data = to_db_dict(result, req.org_id, emp["id"], req.periodo)

            # Upsert: un solo procesamiento por empleado por mes
            exist = db.table("liquidations") \
                .select("id") \
                .eq("employee_id", emp["id"]) \
                .eq("periodo", req.periodo) \
                .execute()

            if exist.data:
                db.table("liquidations") \
                    .update(liq_data) \
                    .eq("id", exist.data[0]["id"]) \
                    .execute()
            else:
                db.table("liquidations").insert(liq_data).execute()

            processed_count += 1

        return {
            "success": True,
            "processed_count": processed_count,
            "uf_usada": uf_valor,
            "utm_usada": utm_valor,
            "message": f"✅ Nómina {req.periodo} procesada: {processed_count} empleados.",
            "advertencias": advertencias_totales,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en proceso de nómina: {str(e)}")
