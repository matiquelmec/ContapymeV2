"""
payroll.py — Router de Remuneraciones
=====================================
Orquesta el procesamiento de nómina usando el Motor Matemático real
de chilean_payroll.py. Este router es solo el intermediario HTTP:
NO contiene lógica de negocio.
"""
from fastapi import APIRouter, HTTPException
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

        # ── 5. Calcular y guardar liquidaciones ───────────────────────────────
        processed_count = 0
        advertencias_totales = []
        
        # Parsear periodo una sola vez (usado en loop y centralización)
        period_parts = periodo_clean.split("-")
        year_part, month_part = int(period_parts[0]), int(period_parts[1])

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
                family_allowances=int(emp_effective.get("family_allowances", 0)),
                afc_active=bool(emp_effective.get("afc_active", True)),
                horas_semanales=int(emp_effective.get("horas_semanales", 42)),
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

            # ── 6. Guardado Atómico (Blindaje Maestro) ──────────────────────────
            # Usar upsert con el conflicto definido en la base de datos (org, emp, periodo)
            # Esto evita duplicados incluso en condiciones de carrera.
            db.table("liquidations").upsert(
                liq_data, 
                on_conflict="organization_id,employee_id,periodo"
            ).execute()

            processed_count += 1

        # ── 7. CENTRALIZACIÓN CONTABLE AUTOMÁTICA (Integración IFRS) ──────────
        if processed_count > 0:
            try:
                # 7.1. Obtener totales agregados del periodo (siempre en Python, más robusto)
                all_liq = db.table("liquidations") \
                    .select("*") \
                    .eq("organization_id", req.org_id) \
                    .eq("periodo", target_period_start) \
                    .execute()
                
                data = all_liq.data or []
                sums = {
                    "bruto": sum(l.get("total_haberes_brutos", 0) for l in data),
                    "afc_emp": sum(l.get("afc_empresa", 0) for l in data),
                    "sis_emp": sum(l.get("sis_empresa", 0) for l in data),
                    "afp_total": sum(l.get("afp", 0) + l.get("afp_comision", 0) + l.get("sis_empresa", 0) for l in data),
                    "salud": sum(l.get("salud_total", 0) for l in data),
                    "afc_trab": sum(l.get("afc_trabajador", 0) for l in data),
                    "impuesto": sum(l.get("impuesto_unico", 0) for l in data),
                    "liquido": sum(l.get("sueldo_liquido", 0) for l in data),
                }

                # 7.2. Definir Líneas del Asiento de Centralización
                # Glosa institucional
                glosa_centralizacion = f"Centralización Remuneraciones Periodo {periodo_clean}"
                legacy_glosa = f"Centralización de Remuneraciones {periodo_clean}"
                
                journal_lines = [
                    # GASTOS (Debe)
                    {"cuenta_codigo": cfg.get("expense_salary_code", "5.1.02.001"), "cuenta_nombre": cfg.get("expense_salary_name", "Sueldos y Salarios"), "tipo": "debe", "monto": sums["bruto"]},
                    {"cuenta_codigo": cfg.get("expense_social_code", "5.1.02.002"), "cuenta_nombre": cfg.get("expense_social_name", "Leyes Sociales Empresa"), "tipo": "debe", "monto": sums["afc_emp"] + sums["sis_emp"]},
                    
                    # PASIVOS (Haber)
                    {"cuenta_codigo": cfg.get("liability_afp_code", "2.1.04.004"), "cuenta_nombre": cfg.get("liability_afp_name", "AFP por Pagar"), "tipo": "haber", "monto": sums["afp_total"]},
                    {"cuenta_codigo": cfg.get("liability_salud_code", "2.1.04.005"), "cuenta_nombre": cfg.get("liability_salud_name", "Salud por Pagar"), "tipo": "haber", "monto": sums["salud"]},
                    {"cuenta_codigo": cfg.get("liability_afc_code", "2.1.04.006"), "cuenta_nombre": cfg.get("liability_afc_name", "AFC por Pagar"), "tipo": "haber", "monto": sums["afc_trab"] + sums["afc_emp"]},
                    {"cuenta_codigo": cfg.get("liability_tax_code", "2.1.03.001"), "cuenta_nombre": cfg.get("liability_tax_name", "Impuesto Único por Pagar"), "tipo": "haber", "monto": sums["impuesto"]},
                    {"cuenta_codigo": cfg.get("liability_net_code", "2.1.04.001"), "cuenta_nombre": cfg.get("liability_net_name", "Sueldos por Pagar"), "tipo": "haber", "monto": sums["liquido"]},
                ]

                # 7.3. Inyectar Asiento (CON CONTROL DE DUPLICADOS EXACTO Nivel DB)
                last_day_contable = calendar.monthrange(year_part, month_part)[1]
                fecha_asiento = f"{periodo_clean}-{last_day_contable}"

                # a) Buscar asientos antiguos usando su Meta-Referencia (Garantía Arquitectónica) o Glosa
                existing_entries = db.table("journal_entries") \
                    .select("id") \
                    .eq("organization_id", req.org_id) \
                    .or_(f"and(source_type.eq.NOMINA,source_id.eq.{periodo_clean}),glosa.eq.\"{glosa_centralizacion}\",glosa.eq.\"{legacy_glosa}\"") \
                    .execute()

                # b) Eliminar primero sus líneas y luego el asiento
                for e in (existing_entries.data or []):
                    db.table("journal_entry_lines").delete().eq("entry_id", e["id"]).execute()
                    db.table("journal_entries").delete().eq("id", e["id"]).execute()

                # c) Crear el asiento consolidado final vía RPC (retorna el UUID del asiento)
                res_rpc = db.rpc("create_journal_entry_with_lines", {
                    "p_organization_id": req.org_id,
                    "p_fecha": fecha_asiento,
                    "p_glosa": glosa_centralizacion,
                    "p_lines": journal_lines
                }).execute()
                
                journal_entry_id = res_rpc.data

                # d) Marcar el asiento recién creado con su ADN exacto para el índice único usando el UUID directo
                if journal_entry_id:
                    db.table("journal_entries") \
                        .update({"source_type": "NOMINA", "source_id": periodo_clean}) \
                        .eq("id", journal_entry_id) \
                        .execute()

                logger.info(f"🏦 Asiento de centralización (idempótico metadata) exitoso para {req.periodo}")

            except Exception as ex_cont:
                logger.error(f"❌ Error al centralizar contablemente la nómina: {ex_cont}")
                advertencias_totales.append(f"⚠️ Nómina procesada pero falló la creación del asiento contable: {ex_cont}")

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
            "uf_usada": uf_valor,
            "utm_usada": utm_valor,
            "message": f"✅ Nómina {req.periodo} procesada: {processed_count} empleados.",
            "advertencias": advertencias_totales,
        }

    except Exception as e:
        logger.exception("Error en proceso de nómina")
        raise HTTPException(status_code=500, detail=str(e))
