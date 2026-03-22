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
from calculators.national_params import (
    TOPE_AFP_UF, TOPE_SALUD_UF, TOPE_AFC_UF,
    SIS_PCT, SUELDO_MINIMO,
    AFC_INDEFINIDO_TRABAJADOR_PCT, AFC_INDEFINIDO_EMPRESA_PCT, AFC_FIJO_EMPRESA_PCT,
    get_afp_comision,
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class PayrollRequest(BaseModel):
    org_id: str
    periodo: str  # "YYYY-MM"


@router.post("/process")
async def process_payroll(req: PayrollRequest):
    """
    Endpoint del Motor Matemático para procesar liquidaciones en lote.
    
    ARQUITECTURA AUTÓNOMA:
      - Parámetros NACIONALES → Se toman de national_params.py (autónomos)
      - Parámetros de EMPRESA → Se leen de organization_payroll_settings (manuales)
      - Indicadores (UF/UTM) → Se buscan en economic_indicators por fecha (históricos)
    """
    db = get_supabase()

    try:
        # ── 1. Configuración de la EMPRESA (solo lo que es único por organización) ──
        cfg_res = db.table("organization_payroll_settings") \
            .select("*") \
            .eq("organization_id", req.org_id) \
            .maybe_single() \
            .execute()

        cfg = cfg_res.data or {}

        # ── 2. Indicadores económicos Dinámicos (UF y UTM por Periodo) ────────
        target_period_start = f"{req.periodo}-01"
        uf_valor = 38000.0  # Fallback de emergencia
        utm_valor = 67294.0 # Fallback de emergencia

        try:
            ind_res = db.table("economic_indicators") \
                .select("codigo, valor") \
                .in_("codigo", ["uf", "utm"]) \
                .lte("fecha", target_period_start) \
                .order("fecha", desc=True) \
                .limit(2) \
                .execute()

            for ind in (ind_res.data or []):
                if ind["codigo"] == "uf":
                    uf_valor = float(ind["valor"])
                elif ind["codigo"] == "utm":
                    utm_valor = float(ind["valor"])
            
            logger.info(f"📊 Indicadores aplicados para {req.periodo}: UF=${uf_valor}, UTM=${utm_valor}")
        except Exception as e:
            logger.warning(f"⚠️ Usando indicadores de emergencia por fallo en DB: {e}")

        # ── 3. Construir PayrollSettings (NACIONALES autónomos + EMPRESA manuales) ──
        settings = PayrollSettings(
            uf_valor=uf_valor,
            # Topes NACIONALES (autónomos desde national_params.py)
            uf_tope_afp=TOPE_AFP_UF,
            uf_tope_salud=TOPE_SALUD_UF,
            uf_tope_afc=TOPE_AFC_UF,
            sueldo_minimo=SUELDO_MINIMO,
            # Tasas NACIONALES
            afp_sis_pct=SIS_PCT,
            afc_indefinido_trabajador_pct=AFC_INDEFINIDO_TRABAJADOR_PCT,
            afc_indefinido_empresa_pct=AFC_INDEFINIDO_EMPRESA_PCT,
            afc_fijo_empresa_pct=AFC_FIJO_EMPRESA_PCT,
        )

        # ── 4. Traer empleados activos ────────────────────────────────────────
        emp_res = db.table("employees") \
            .select("*") \
            .eq("organization_id", req.org_id) \
            .eq("activo", True) \
            .execute()

        employees = emp_res.data or []
        logger.info(f"🔍 Procesando nómina {req.periodo}. Encontrados {len(employees)} empleados activos en DB.")
        
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
            # Blindaje extra: Si por algún motivo el driver trajo un inactivo, lo saltamos
            if not emp.get("activo", True):
                continue
            
            nome_completo = f"{emp.get('nombres', '')} {emp.get('apellido_paterno', '')}"
            logger.info(f"   ⚙️  Procesando: {nome_completo} (RUT: {emp.get('rut')})")
            
            # Resolver comisión AFP del empleado
            afp_code = (emp.get("afp") or "HABITAT").upper()
            salud_code = (emp.get("prevision_salud") or "FONASA").upper()
            
            # Comisión: primero buscar en config de empresa, fallback a national_params
            afp_comision_pct = get_afp_comision(afp_code)
            if cfg.get("afp_configs"):
                for afp in cfg["afp_configs"]:
                    if afp.get("code") == afp_code:
                        afp_comision_pct = float(afp.get("commission_pct", afp_comision_pct))
                        break

            # Plan de salud: se lee del empleado (0 = FONASA, >0 = plan Isapre en UF)
            plan_salud_uf = float(emp.get("plan_salud_uf", 0))

            # ── 5.1. Obtener contrato vigente para el período (INTELIGENCIA v2) ───
            # Usamos el último día del mes para determinar qué contrato rige.
            # (Ejemplo: si hay un aumento el 15, rige el nuevo sueldo para ese mes).
            from datetime import datetime, date
            import calendar
            
            try:
                year_part, month_part = map(int, req.periodo.split("-"))
                last_day = calendar.monthrange(year_part, month_part)[1]
                target_date_str = f"{req.periodo}-{last_day}"
                
                # Intentamos usar la función de DB RPC
                effective_res = db.rpc("get_effective_contract_data", {
                    "p_employee_id": emp["id"],
                    "p_target_date": target_date_str
                }).execute()
                
                eff = effective_res.data or {}
                # Mezclamos emp con los datos efectivos (prioridad a eff)
                emp_effective = {**emp, **eff}
            except Exception as e:
                logger.warning(f"Error al obtener contrato efectivo para {emp.get('id')}: {e}")
                emp_effective = emp

            emp_input = EmployeeInput(
                sueldo_base=int(emp_effective.get("sueldo_base", 0)),
                tipo_contrato=emp_effective.get("tipo_contrato", "indefinido"),
                afp_code=afp_code,
                afp_comision_pct=afp_comision_pct,
                salud_code=salud_code,
                salud_pct=7.0,  # Siempre 7% legal (national_params)
                plan_salud_uf=plan_salud_uf,
                gratificacion_legal=bool(emp_effective.get("gratificacion_legal", True)),
                asignacion_movilizacion=int(emp_effective.get("asignacion_movilizacion", 0)),
                asignacion_colacion=int(emp_effective.get("asignacion_colacion", 0)),
                horas_extra=int(emp_effective.get("horas_extra_pendientes", 0)),
                family_allowances=int(emp_effective.get("family_allowances", 0)),
                afc_active=bool(emp_effective.get("afc_active", True)),
                horas_semanales=int(emp_effective.get("horas_semanales", 42)),
            )

            result = calcular_liquidacion(emp_input, settings, utm_valor)

            if result.advertencias:
                advertencias_totales.extend([
                    f"{emp.get('nombres', 'Empleado')}: {a}"
                    for a in result.advertencias
                ])

            liq_data = to_db_dict(result, req.org_id, emp["id"], req.periodo)

            # ── 6. Guardado Atómico (Blindaje Maestro) ──────────────────────────
            # Usar upsert con el conflicto definido en la base de datos (org, emp, periodo)
            # Esto evita duplicados incluso en condiciones de carrera.
            db.table("liquidations").upsert(
                liq_data, 
                on_conflict="organization_id,employee_id,periodo"
            ).execute()

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
        logger.exception("Error en proceso de nómina")
        raise HTTPException(status_code=500, detail=str(e))
