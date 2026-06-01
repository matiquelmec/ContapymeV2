"""
payroll.py — Router de Remuneraciones
=====================================
Orquesta el procesamiento de nómina usando el Motor Matemático real
de chilean_payroll.py. Este router es solo el intermediario HTTP:
NO contiene lógica de negocio.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, date
import calendar
from core.database import get_supabase
from calculators.chilean_payroll import (
    EmployeeInput,
    PayrollSettings,
    calcular_liquidacion,
    to_db_dict,
)
from core.auth import verify_token, verify_org_role
from core.logger import log_activity
from fastapi import Depends
from core.payroll_legal_params import (
    get_period_start,
    resolve_economic_indicators,
    resolve_legal_payroll_params,
)
from core.payroll_status import is_reprocessable_liquidation_status
from calculators.national_params import (
    get_afp_comision,
    SUELDO_MINIMO,
    TOPE_AFP_UF,
    TOPE_SALUD_UF,
    TOPE_AFC_UF,
    SIS_PCT,
    AFC_INDEFINIDO_TRABAJADOR_PCT,
    AFC_INDEFINIDO_EMPRESA_PCT,
    AFC_FIJO_EMPRESA_PCT,
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class PayrollRequest(BaseModel):
    org_id: str
    periodo: str  # "YYYY-MM"


@router.post("/process")
async def process_payroll(req: PayrollRequest, current_user: dict = Depends(verify_token)):
    """
    Endpoint del Motor Matemático para procesar liquidaciones en lote.
    
    ARQUITECTURA AUTÓNOMA:
      - Parámetros NACIONALES → Se toman de national_params.py (autónomos)
      - Parámetros de EMPRESA → Se leen de organization_payroll_settings (manuales)
      - Indicadores (UF/UTM) → Se buscan en economic_indicators por fecha (históricos)
    """
    await verify_org_role(req.org_id, auth=current_user)
    db = get_supabase()

    try:
        # ── 1. Configuración de la EMPRESA (solo lo que es único por organización) ──
        cfg_res = db.table("organization_payroll_settings") \
            .select("*") \
            .eq("organization_id", req.org_id) \
            .execute()

        cfg = cfg_res.data[0] if cfg_res.data else {}

        # Obtener datos de la organización para detectar Zona Extrema
        org_res = db.table("organizations") \
            .select("region, comuna") \
            .eq("id", req.org_id) \
            .maybe_single() \
            .execute()
        org_data = org_res.data or {}

        # ── 2. Indicadores económicos Dinámicos (UF y UTM por Periodo) ────────
        # Normalizar periodo: si llega "2026-03-01" lo dejamos, si llega "2026-03" le agregamos "-01"
        periodo_clean = req.periodo[:7]  # Siempre tomar solo YYYY-MM
        target_period_start = f"{periodo_clean}-01"
        indicadores_estimados = False
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

            if not ind_res.data:
                indicadores_estimados = True
                logger.warning(f"⚠️ Sin indicadores en DB para {req.periodo}. Usando fallbacks de emergencia.")
            else:
                for ind in ind_res.data:
                    if ind["codigo"] == "uf":
                        uf_valor = float(ind["valor"])
                    elif ind["codigo"] == "utm":
                        utm_valor = float(ind["valor"])
            
            logger.info(f"📊 Indicadores aplicados para {req.periodo}: UF=${uf_valor}, UTM=${utm_valor}")
        except Exception as e:
            indicadores_estimados = True
            logger.warning(f"⚠️ Usando indicadores de emergencia por fallo en DB: {e}")

        # ── 3. Obtener Parámetros Nacionales Legales del Periodo (Desacoplamiento Dinámico) ──
        # Valores por defecto de emergencia (desde national_params.py)
        p_sueldo_minimo = SUELDO_MINIMO
        p_tope_afp = TOPE_AFP_UF
        p_tope_salud = TOPE_SALUD_UF
        p_tope_afc = TOPE_AFC_UF
        p_sis = SIS_PCT
        p_afc_ind_trab = AFC_INDEFINIDO_TRABAJADOR_PCT
        p_afc_ind_emp = AFC_INDEFINIDO_EMPRESA_PCT
        p_afc_fijo_emp = AFC_FIJO_EMPRESA_PCT
        
        try:
            param_res = db.table("national_payroll_params") \
                .select("*") \
                .eq("periodo", target_period_start) \
                .execute()
                
            if param_res.data:
                p_data = param_res.data[0]
                p_sueldo_minimo = int(p_data.get("sueldo_minimo", p_sueldo_minimo))
                p_tope_afp = float(p_data.get("tope_afp_uf", p_tope_afp))
                p_tope_salud = float(p_data.get("tope_salud_uf", p_tope_salud))
                p_tope_afc = float(p_data.get("tope_afc_uf", p_tope_afc))
                p_sis = float(p_data.get("sis_pct", p_sis))
                p_afc_ind_trab = float(p_data.get("afc_indefinido_trabajador_pct", p_afc_ind_trab))
                p_afc_ind_emp = float(p_data.get("afc_indefinido_empresa_pct", p_afc_ind_emp))
                p_afc_fijo_emp = float(p_data.get("afc_fijo_empresa_pct", p_afc_fijo_emp))
                logger.info(f"⚖️ Parámetros legales obtenidos de DB para {req.periodo}.")
            else:
                logger.warning(f"⚠️ Sin parámetros legales en DB para {req.periodo}. Usando constantes estáticas.")
        except Exception as e_param:
            logger.warning(f"⚠️ Error al consultar parámetros legales en DB: {e_param}. Usando fallbacks estáticos.")

        settings = PayrollSettings(
            uf_valor=uf_valor,
            # Topes dinámicos
            uf_tope_afp=p_tope_afp,
            uf_tope_salud=p_tope_salud,
            uf_tope_afc=p_tope_afc,
            sueldo_minimo=p_sueldo_minimo,
            # Tasas dinámicas
            afp_sis_pct=p_sis,
            afc_indefinido_trabajador_pct=p_afc_ind_trab,
            afc_indefinido_empresa_pct=p_afc_ind_emp,
            afc_fijo_empresa_pct=p_afc_fijo_emp,
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

        existing_liq_res = db.table("liquidations") \
            .select("employee_id, status") \
            .eq("organization_id", req.org_id) \
            .eq("periodo", target_period_start) \
            .execute()
        existing_liq_status = {
            row.get("employee_id"): row.get("status")
            for row in (existing_liq_res.data or [])
        }

        # ── 5. Calcular y guardar liquidaciones ───────────────────────────────
        processed_count = 0
        skipped_closed_count = 0
        advertencias_totales = []
        
        # Parsear periodo una sola vez (usado en loop y centralización)
        period_parts = periodo_clean.split("-")
        year_part, month_part = int(period_parts[0]), int(period_parts[1])

        for emp in employees:
            # Blindaje extra: Si por algún motivo el driver trajo un inactivo, lo saltamos
            if not emp.get("activo", True):
                continue

            current_status = existing_liq_status.get(emp.get("id"))
            if not is_reprocessable_liquidation_status(current_status):
                skipped_closed_count += 1
                advertencias_totales.append(
                    f"{emp.get('nombres', 'Empleado')}: liquidación {current_status} no fue reprocesada."
                )
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
            try:
                last_day = calendar.monthrange(year_part, month_part)[1]
                target_date_str = f"{periodo_clean}-{last_day}"
                
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

            # Determinar si aplica Zona Extrema
            # Priorizar si ya viene en el empleado, si no, buscar por region/comuna
            es_zona_extrema = False
            zona_extrema = ""
            
            # Intentar primero por campos directos si existen
            if emp_effective.get("es_zona_extrema"):
                es_zona_extrema = True
                zona_extrema = emp_effective.get("zona_extrema", "")
            else:
                # Detección dinámica por geografía
                emp_region = (emp_effective.get("region") or "").upper()
                emp_city = (emp_effective.get("city") or "").upper()
                org_region = (org_data.get("region") or "").upper()
                org_comuna = (org_data.get("comuna") or "").upper()
                
                if any(x in emp_region or x in emp_city or x in org_region or x in org_comuna for x in ["MAGALLANES", "XII", "PUNTA ARENAS"]):
                    es_zona_extrema = True
                    zona_extrema = "MAGALLANES"
                elif any(x in emp_region or x in emp_city or x in org_region or x in org_comuna for x in ["AYSEN", "XI", "COYHAIQUE"]):
                    es_zona_extrema = True
                    zona_extrema = "AYSEN"
                elif any(x in emp_region or x in emp_city or x in org_region or x in org_comuna for x in ["ARICA", "XV"]):
                    es_zona_extrema = True
                    zona_extrema = "ARICA"
                elif any(x in emp_region or x in emp_city or x in org_region or x in org_comuna for x in ["TARAPACA", "I", "IQUIQUE"]):
                    es_zona_extrema = True
                    zona_extrema = "TARAPACA"
                elif any(x in emp_region or x in emp_city or x in org_region or x in org_comuna for x in ["CHILOE", "CASTRO", "ANCUD"]):
                    es_zona_extrema = True
                    zona_extrema = "CHILOE"
                elif any(x in emp_region or x in emp_city or x in org_region or x in org_comuna for x in ["PALENA", "CHAITEN"]):
                    es_zona_extrema = True
                    zona_extrema = "PALENA"

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
                bono_extra=int(emp_effective.get("bono_extra", 0)),
                dias_trabajados=int(emp_effective.get("dias_trabajados", 30)),
                family_allowances=int(emp_effective.get("family_allowances", 0)),
                afc_active=bool(emp_effective.get("afc_active", True)),
                horas_semanales=int(emp_effective.get("horas_semanales", 42)),
                bono_fijo=int(emp_effective.get("bono_fijo", 0)), # Pasar bono_fijo del Kardex
                mes_proceso=periodo_clean,
                es_zona_extrema=es_zona_extrema,
                zona_extrema=zona_extrema,
            )

            result = calcular_liquidacion(emp_input, settings, utm_valor)

            if result.advertencias:
                advertencias_totales.extend([
                    f"{emp.get('nombres', 'Empleado')}: {a}"
                    for a in result.advertencias
                ])

            liq_data = to_db_dict(result, req.org_id, emp["id"], target_period_start)
            snapshot = liq_data.get("calculation_snapshot") or {}
            credito_ccaf = int(emp_effective.get("credito_ccaf") or 0)
            if credito_ccaf > 0:
                liq_data["credito_ccaf"] = credito_ccaf
                liq_data["otros_descuentos"] = int(liq_data.get("otros_descuentos") or 0) + credito_ccaf
                liq_data["total_descuentos"] = int(liq_data.get("total_descuentos") or 0) + credito_ccaf
                liq_data["sueldo_liquido"] = int(liq_data.get("sueldo_liquido") or 0) - credito_ccaf
                snapshot["credito_ccaf"] = credito_ccaf
            movement_code = str(emp_effective.get("previred_movement_code") or "0")
            dias = int(emp_effective.get("dias_trabajados", 30))
            if movement_code in ("3", "6"):
                last_day = calendar.monthrange(year_part, month_part)[1]
                start_day = 1 if dias <= 0 else min(dias + 1, last_day)
                movement_from = f"{start_day:02d}{month_part:02d}{year_part}"
                movement_to = f"{last_day:02d}{month_part:02d}{year_part}"
                snapshot["movement_from"] = movement_from
                snapshot["movement_to"] = movement_to
            snapshot["movement_code"] = movement_code
            liq_data["calculation_snapshot"] = snapshot

            # ── 6. Guardado Atómico (Blindaje Maestro) ──────────────────────────
            # Usar upsert con el conflicto definido en la base de datos (org, emp, periodo)
            # Esto evita duplicados incluso en condiciones de carrera.
            db.table("liquidations").upsert(
                liq_data, 
                on_conflict="organization_id,employee_id,periodo"
            ).execute()

            processed_count += 1

        if processed_count > 0:
            advertencias_totales.append(
                "La centralización contable queda pendiente hasta cerrar/aprobar las liquidaciones del periodo."
            )

        # REGISTRAR EN BITÁCORA (AUDIT LOG) — envuelto en try/except por si la tabla no existe
        try:
            log_activity(
                action="process_payroll_bulk",
                organization_id=req.org_id,
                user_id=current_user.get("id"),
                entity_type="payroll_period",
                entity_id=f"{req.org_id}_{periodo_clean}",
                details={
                    "processed_count": processed_count,
                    "uf_usada": uf_valor,
                    "utm_usada": utm_valor,
                    "has_warnings": len(advertencias_totales) > 0
                }
            )
        except Exception as e_audit:
            logger.warning(f"⚠️ No se pudo registrar audit log (tabla no existe): {e_audit}")

        return {
            "success": True,
            "processed_count": processed_count,
            "skipped_closed_count": skipped_closed_count,
            "uf_usada": uf_valor,
            "utm_usada": utm_valor,
            "indicadores_estimados": indicadores_estimados,
            "message": f"✅ Nómina {req.periodo} procesada: {processed_count} empleados.",
            "advertencias": advertencias_totales,
        }

    except Exception as e:
        logger.exception("Error en proceso de nómina")
        raise HTTPException(status_code=500, detail=str(e))


class ReversePayrollRequest(BaseModel):
    org_id: str
    target_liquido: int
    periodo: str  # YYYY-MM
    gratificacion_legal: bool = True
    afp_code: str = "HABITAT"
    afp_comision_pct: Optional[float] = None
    salud_code: str = "FONASA"
    plan_salud_uf: float = 0.0
    tipo_contrato: str = "indefinido"
    asignacion_movilizacion: int = 0
    asignacion_colacion: int = 0
    es_zona_extrema: bool = False
    zona_extrema: str = ""


@router.post("/calculate-base")
async def calculate_base_salary(
    req: ReversePayrollRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Calcula el sueldo base necesario a partir de un sueldo líquido deseado.
    """
    await verify_org_role(req.org_id, auth=current_user)
    db = get_supabase()

    try:
        # Cargar configuración de empresa
        cfg_res = db.table("organization_payroll_settings") \
            .select("*") \
            .eq("organization_id", req.org_id) \
            .execute()
        cfg = cfg_res.data[0] if cfg_res.data else {}

        # Determinar indicadores económicos (UF y UTM)
        periodo_clean = req.periodo[:7]
        target_period_start = f"{periodo_clean}-01"
        
        uf_valor = 38000.0
        utm_valor = 67294.0

        try:
            ind_res = db.table("economic_indicators") \
                .select("codigo, valor") \
                .in_("codigo", ["uf", "utm"]) \
                .lte("fecha", target_period_start) \
                .order("fecha", desc=True) \
                .limit(2) \
                .execute()

            if ind_res.data:
                for ind in ind_res.data:
                    if ind["codigo"] == "uf":
                        uf_valor = float(ind["valor"])
                    elif ind["codigo"] == "utm":
                        utm_valor = float(ind["valor"])
        except Exception as e:
            logger.warning(f"Error al obtener indicadores económicos para la calculadora: {e}")

        # Cargar parámetros nacionales
        p_sueldo_minimo = SUELDO_MINIMO
        p_tope_afp = TOPE_AFP_UF
        p_tope_salud = TOPE_SALUD_UF
        p_tope_afc = TOPE_AFC_UF
        p_sis = SIS_PCT
        p_afc_ind_trab = AFC_INDEFINIDO_TRABAJADOR_PCT
        p_afc_ind_emp = AFC_INDEFINIDO_EMPRESA_PCT
        p_afc_fijo_emp = AFC_FIJO_EMPRESA_PCT

        try:
            param_res = db.table("national_payroll_params") \
                .select("*") \
                .eq("periodo", target_period_start) \
                .execute()
            if param_res.data:
                p_data = param_res.data[0]
                p_sueldo_minimo = int(p_data.get("sueldo_minimo", p_sueldo_minimo))
                p_tope_afp = float(p_data.get("tope_afp_uf", p_tope_afp))
                p_tope_salud = float(p_data.get("tope_salud_uf", p_tope_salud))
                p_tope_afc = float(p_data.get("tope_afc_uf", p_tope_afc))
                p_sis = float(p_data.get("sis_pct", p_sis))
                p_afc_ind_trab = float(p_data.get("afc_indefinido_trabajador_pct", p_afc_ind_trab))
                p_afc_ind_emp = float(p_data.get("afc_indefinido_empresa_pct", p_afc_ind_emp))
                p_afc_fijo_emp = float(p_data.get("afc_fijo_empresa_pct", p_afc_fijo_emp))
        except Exception as e:
            logger.warning(f"Error al obtener parámetros legales para la calculadora: {e}")

        settings = PayrollSettings(
            uf_valor=uf_valor,
            uf_tope_afp=p_tope_afp,
            uf_tope_salud=p_tope_salud,
            uf_tope_afc=p_tope_afc,
            sueldo_minimo=p_sueldo_minimo,
            afp_sis_pct=p_sis,
            afc_indefinido_trabajador_pct=p_afc_ind_trab,
            afc_indefinido_empresa_pct=p_afc_ind_emp,
            afc_fijo_empresa_pct=p_afc_fijo_emp,
        )

        # Resolver comisión AFP
        afp_comision_pct = req.afp_comision_pct
        if afp_comision_pct is None:
            afp_comision_pct = get_afp_comision(req.afp_code.upper())
            if cfg.get("afp_configs"):
                for afp in cfg["afp_configs"]:
                    if afp.get("code") == req.afp_code.upper():
                        afp_comision_pct = float(afp.get("commission_pct", afp_comision_pct))
                        break

        # Llamar a la función de cálculo inverso
        from calculators.chilean_payroll import calcular_sueldo_base_desde_liquido, to_db_dict
        res = calcular_sueldo_base_desde_liquido(
            target_liquido=req.target_liquido,
            gratificacion_legal=req.gratificacion_legal,
            afp_code=req.afp_code.upper(),
            afp_comision_pct=afp_comision_pct,
            salud_code=req.salud_code.upper(),
            plan_salud_uf=req.plan_salud_uf,
            tipo_contrato=req.tipo_contrato,
            asignacion_movilizacion=req.asignacion_movilizacion,
            asignacion_colacion=req.asignacion_colacion,
            settings=settings,
            utm_valor=utm_valor,
            es_zona_extrema=req.es_zona_extrema,
            zona_extrema=req.zona_extrema
        )

        return {
            "success": True,
            "sueldo_base": res.sueldo_base,
            "uf_usada": uf_valor,
            "utm_usada": utm_valor,
            "liquidacion": to_db_dict(res, req.org_id, "00000000-0000-0000-0000-000000000000", target_period_start)
        }

    except Exception as e:
        logger.exception("Error al calcular sueldo base desde líquido")
        raise HTTPException(status_code=500, detail=str(e))
