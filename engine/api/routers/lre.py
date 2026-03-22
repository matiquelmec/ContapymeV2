from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import io
import csv
import logging
from core.database import get_supabase

# Configurar logs para depuración profesional
logger = logging.getLogger("lre_engine")
router = APIRouter()

# DT_HEADERS: Formato institucional completo (Chile 2024)
DT_HEADERS = [
    "Rut trabajador(1101)", "Fecha inicio contrato(1102)", "Fecha término de contrato(1103)",
    "Causal término de contrato(1104)", "Región prestación de servicios(1105)", "Comuna prestación de servicios(1106)",
    "Tipo impuesto a la renta(1170)", "Técnico extranjero exención cot. previsionales(1146)", "Código tipo de jornada(1107)",
    "Persona con Discapacidad - Pensionado por Invalidez(1108)", "Pensionado por vejez(1109)", "AFP(1141)",
    "IPS (ExINP)(1142)", "FONASA - ISAPRE(1143)", "AFC(1151)", "CCAF(1110)", "Org. administrador ley 16.744(1152)",
    "Nro cargas familiares legales autorizadas(1111)", "Nro de cargas familiares maternales(1112)", "Nro de cargas familiares invalidez(1113)",
    "Tramo asignación familiar(1114)", "Rut org sindical 1(1171)", "Rut org sindical 2(1172)", "Rut org sindical 3(1173)",
    "Rut org sindical 4(1174)", "Rut org sindical 5(1175)", "Rut org sindical 6(1176)", "Rut org sindical 7(1177)",
    "Rut org sindical 8(1178)", "Rut org sindical 9(1179)", "Rut org sindical 10(1180)", "Nro días trabajados en el mes(1115)",
    "Nro días de licencia médica en el mes(1116)", "Nro días de vacaciones en el mes(1117)", "Subsidio trabajador joven(1118)",
    "Puesto Trabajo Pesado(1154)", "APVI(1155)", "APVC(1157)", "Indemnización a todo evento(1131)", "Tasa indemnización a todo evento(1132)",
    "Sueldo(2101)", "Sobresueldo(2102)", "Comisiones(2103)", "Semana corrida(2104)", "Participación(2105)",
    "Gratificación(2106)", "Recargo 30% día domingo(2107)", "Remun. variable pagada en vacaciones(2108)",
    "Remun. variable pagada en clausura(2109)", "Aguinaldo(2110)", "Bonos u otras remun. fijas mensuales(2111)",
    "Tratos(2112)", "Bonos u otras remun. variables mensuales o superiores a un mes(2113)", "Ejercicio opción no pactada en contrato(2114)",
    "Beneficios en especie constitutivos de remun(2115)", "Remuneraciones bimestrales(2116)", "Remuneraciones trimestrales(2117)",
    "Remuneraciones cuatrimestral(2118)", "Remuneraciones semestrales(2119)", "Remuneraciones anuales(2120)",
    "Participación anual(2121)", "Gratificación anual(2122)", "Otras remuneraciones superiores a un mes(2123)",
    "Pago por horas de trabajo sindical(2124)", "Sueldo empresarial (2161)", "Subsidio por incapacidad laboral por licencia médica(2201)",
    "Beca de estudio(2202)", "Gratificaciones de zona(2203)", "Otros ingresos no constitutivos de renta(2204)",
    "Colación(2301)", "Movilización(2302)", "Viáticos(2303)", "Asignación de pérdida de caja(2304)",
    "Asignación de desgaste herramienta(2305)", "Asignación familiar legal(2311)", "Gastos por causa del trabajo(2306)",
    "Gastos por cambio de residencia(2307)", "Sala cuna(2308)", "Asignación trabajo a distancia o teletrabajo(2309)",
    "Depósito convenido hasta UF 900(2347)", "Alojamiento por razones de trabajo(2310)", "Asignación de traslación(2312)",
    "Indemnización por feriado legal(2313)", "Indemnización años de servicio(2314)", "Indemnización sustitutiva del aviso previo(2315)",
    "Indemnización fuero maternal(2316)", "Pago indemnización a todo evento(2331)", "Indemnizaciones voluntarias tributables(2417)",
    "Indemnizaciones contractuales tributables(2418)", "Cotización obligatoria previsional (AFP o IPS)(3141)",
    "Cotización obligatoria salud 7%(3143)", "Cotización voluntaria para salud(3144)", "Cotización AFC - trabajador(3151)",
    "Cotizaciones técnico extranjero para seguridad social fuera de Chile(3146)", "Descuento depósito convenido hasta UF 900 anual(3147)",
    "Cotización APVi Mod A(3155)", "Cotización APVi Mod B hasta UF50(3156)", "Cotización APVc Mod A(3157)",
    "Cotización APVc Mod B hasta UF50(3158)", "Impuesto retenido por remuneraciones(3161)", "Impuesto retenido por indemnizaciones(3162)",
    "Mayor retención de impuestos solicitada por el trabajador(3163)", "Impuesto retenido por reliquidación remun. devengadas otros períodos(3164)",
    "Diferencia impuesto reliquidación remun. devengadas en este período(3165)", "Retención préstamo clase media 2020 (Ley 21.252) (3166)",
    "Rebaja zona extrema DL 889 (3167)", "Cuota sindical 1(3171)", "Cuota sindical 2(3172)", "Cuota sindical 3(3173)",
    "Cuota sindical 4(3174)", "Cuota sindical 5(3175)", "Cuota sindical 6(3176)", "Cuota sindical 7(3177)",
    "Cuota sindical 8(3178)", "Cuota sindical 9(3179)", "Cuota sindical 10(3180)", "Crédito social CCAF(3110)",
    "Cuota vivienda o educación(3181)", "Crédito cooperativas de ahorro(3182)",
    "Otros descuentos autorizados y solicitados por el trabajador(3183)", "Cotización adicional trabajo pesado - trabajador(3154)",
    "Donaciones culturales y de reconstrucción(3184)", "Otros descuentos(3185)", "Pensiones de alimentos(3186)",
    "Descuento mujer casada(3187)", "Descuentos por anticipos y préstamos(3188)", "AFC - Aporte empleador(4151)",
    "Aporte empleador seguro accidentes del trabajo y Ley SANNA(4152)", "Aporte empleador indemnización a todo evento(4131)",
    "Aporte adicional trabajo pesado - empleador(4154)", "Aporte empleador seguro invalidez y sobrevivencia(4155)",
    "APVC - Aporte Empleador(4157)", "Total haberes(5201)", "Total haberes imponibles y tributables(5210)",
    "Total haberes imponibles no tributables(5220)", "Total haberes no imponibles y no tributables(5230)",
    "Total haberes no imponibles y tributables(5240)", "Total descuentos(5301)", "Total descuentos impuestos a las remuneraciones(5361)",
    "Total descuentos impuestos por indemnizaciones(5362)", "Total descuentos por cotizaciones del trabajador(5341)",
    "Total otros descuentos(5302)", "Total aportes empleador(5410)", "Total líquido(5501)", "Total indemnizaciones(5502)",
    "Total indemnizaciones tributables(5564)", "Total indemnizaciones no tributables(5565)"
]

# Helpers de Robustez e Inteligencia
def safe_float(val: Any) -> float:
    try:
        if val is None or val == "": return 0.0
        return float(val)
    except:
        return 0.0

def safe_int(val: Any) -> int:
    try:
        if val is None or val == "": return 0
        return int(round(float(val)))
    except:
        return 0

def clean_rut(rut_raw: Any) -> str:
    if not rut_raw: return ""
    return str(rut_raw).replace(".", "").replace("-", "").lower()

class LREGenerateRequest(BaseModel):
    organization_id: str
    periodo: str  # YYYY-MM
    company_name: str
    company_rut: str

@router.get("/list")
async def list_lre(organization_id: str):
    db = get_supabase()
    try:
        res = db.table("payroll_books").select("*").eq("organization_id", organization_id).order("periodo", desc=True).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error listando LRE: {e}")
        raise HTTPException(status_code=500)

@router.post("/generate")
async def generate_lre(req: LREGenerateRequest):
    """
    Consolidador Dinámico LRE con Lógica de Células Inteligentes.
    Cruza Liquidaciones con Contratos para precisión histórica.
    """
    db = get_supabase()
    org_id = req.organization_id
    # Asegurar formato YYYY-MM-01 para la BD
    periodo_standard = f"{req.periodo}-01" if len(req.periodo) == 7 else req.periodo
    
    try:
        # A. Carga de Data Múltiple (Células Inteligentes)
        liq_res = db.table("liquidations").select("*, employees(*)").eq("organization_id", org_id).eq("periodo", periodo_standard).execute()
        liqs = liq_res.data
        if not liqs:
            raise HTTPException(status_code=404, detail="No hay liquidaciones para procesar este periodo.")

        contracts_res = db.table("employment_contracts").select("*").eq("organization_id", org_id).execute()
        contracts_map = {c["employee_id"]: c for c in contracts_res.data}
        
        settings_res = db.table("organization_payroll_settings").select("*").eq("organization_id", org_id).execute()
        settings = settings_res.data[0] if settings_res.data else {"region": "12", "comuna": "12101"}

        # B. Limpieza y Creación de Cabecera
        prev_books = db.table("payroll_books").select("id").eq("organization_id", org_id).eq("periodo", periodo_standard).execute()
        if prev_books.data:
            b_ids = [b["id"] for b in prev_books.data]
            db.table("payroll_book_details").delete().in_("payroll_book_id", b_ids).execute()
            db.table("payroll_books").delete().in_("id", b_ids).execute()

        total_haberes = safe_int(sum(safe_float(l.get("total_haberes_brutos", 0)) for l in liqs))
        total_descuentos = safe_int(sum(safe_float(l.get("total_descuentos", 0)) for l in liqs))
        total_liquido = safe_int(sum(safe_float(l.get("sueldo_liquido", 0)) for l in liqs))

        new_book = db.table("payroll_books").insert({
            "organization_id": org_id,
            "periodo": periodo_standard,
            "book_number": 1,
            "company_name": req.company_name,
            "company_rut": req.company_rut,
            "status": "approved",
            "total_employees": len(liqs),
            "total_haberes": total_haberes,
            "total_descuentos": total_descuentos,
            "total_liquido": total_liquido
        }).execute()
        
        book_id = new_book.data[0]["id"]

        # C. Síntesis DINÁMICA de Detalles (Enriquecimiento)
        details = []
        for l in liqs:
            emp = l.get("employees", {})
            contract = contracts_map.get(emp.get("id"), {})
            
            # Buscando la fuente más robusta para cada dato
            fecha_ingreso = contract.get("fecha_inicio") or emp.get("fecha_ingreso") or "2024-01-01"
            
            detail = {
                "payroll_book_id": book_id,
                "employee_id": emp.get("id"),
                "employee_rut": emp.get("rut"),
                "apellido_paterno": emp.get("apellido_paterno", ""),
                "apellido_materno": emp.get("apellido_materno", ""),
                "nombres": emp.get("nombres", ""),
                "cargo": contract.get("cargo") or emp.get("cargo", "GENERAL"),
                "area": contract.get("department") or emp.get("departamento", "GENERAL"),
                "dias_trabajados": safe_int(l.get("dias_trabajados", 30)),
                "fecha_inicio": fecha_ingreso,
                "fecha_termino": contract.get("fecha_termino"),
                "causal_termino": contract.get("causal_termino", ""),
                "region_prestacion": settings.get("region", "12"),
                "comuna_prestacion": settings.get("comuna", "12101"),
                # Haberes (Casting Int)
                "sueldo_base": safe_int(l.get("sueldo_base", 0)),
                "sobresueldo": safe_int(l.get("horas_extra_monto", 0)),
                "gratificacion_legal": safe_int(l.get("gratificacion", 0)),
                "colacion": safe_int(l.get("asignacion_colacion", 0)),
                "movilizacion": safe_int(l.get("asignacion_movilizacion", 0)),
                "total_haberes_brutos": safe_int(l.get("total_haberes_brutos", 0)),
                "asig_familiar": safe_int(l.get("asignacion_familiar", 0)),
                # Descuentos (Integración AFPs/Salud)
                "afp_nom": (emp.get("afp") or "HABITAT").upper(),
                "salud_nom": (emp.get("prevision_salud") or "FONASA").upper(),
                "descuento_afp_total": safe_int(safe_float(l.get("afp", 0)) + safe_float(l.get("afp_comision", 0))),
                "descuento_salud": safe_int(l.get("salud", 0)),
                "salud_voluntaria": safe_int(l.get("salud_voluntaria", 0)),
                "afc_trab": safe_int(l.get("afc_trabajador", 0)),
                "afc_emp": safe_int(l.get("afc_empresa", 0)),
                "sis_emp": safe_int(l.get("sis_empresa", 0)),
                "impuesto_unico": safe_int(l.get("impuesto_unico", 0)),
                "sueldo_liquido": safe_int(l.get("sueldo_liquido", 0))
            }
            details.append(detail)

        # Inserción Inteligente con Fallback Legacy (Normalización 141 campos)
        db.table("payroll_book_details").insert(details).execute()
        return {"success": True, "book_id": book_id}

    except Exception as e:
        logger.error(f"Fallo LRE: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/{book_id}")
async def export_lre(book_id: str):
    db = get_supabase()
    AFP_DT_MAP = {'CAPITAL': '1', 'CUPRUM': '3', 'HABITAT': '5', 'MODELO': '34', 'PLANVITAL': '29', 'PROVIDA': '8', 'UNO': '35'}
    SALUD_DT_MAP = {'FONASA': '7', 'BANMEDICA': '1', 'CONSALUD': '2', 'CRUZBLANCA': '3', 'VIDATRES': '5', 'COLMENA': '6'}

    try:
        book = db.table("payroll_books").select("*").eq("id", book_id).single().execute().data
        details = db.table("payroll_book_details").select("*").eq("payroll_book_id", book_id).execute().data

        output = io.StringIO()
        output.write('\uFEFF')
        writer = csv.DictWriter(output, fieldnames=DT_HEADERS, delimiter=';')
        writer.writeheader()

        for d in details:
            row: Dict[str, Any] = {h: "" for h in DT_HEADERS}
            
            # Identificación y Metadata (1100s)
            row["Rut trabajador(1101)"] = clean_rut(d.get("employee_rut"))
            row["Fecha inicio contrato(1102)"] = d.get("fecha_inicio") or "2024-01-01"
            row["Región prestación de servicios(1105)"] = str(d.get("region_prestacion", "12"))
            row["Comuna prestación de servicios(1106)"] = str(d.get("comuna_prestacion", "12101"))
            row["Código tipo de jornada(1107)"] = "1"
            row["Nro días trabajados en el mes(1115)"] = safe_int(d.get("dias_trabajados", 30))
            
            # Instituciones Dinámicas (MAPEO MAESTRO)
            row["AFP(1141)"] = AFP_DT_MAP.get(d.get("afp_nom", ""), "5") # Default Habitat
            row["FONASA - ISAPRE(1143)"] = SALUD_DT_MAP.get(d.get("salud_nom", ""), "7") # Default Fonasa
            row["AFC(1151)"] = "1" # Activo

            # Remuneraciones (2000s)
            row["Sueldo(2101)"] = safe_int(d.get("sueldo_base", 0))
            row["Sobresueldo(2102)"] = safe_int(d.get("sobresueldo", 0))
            row["Gratificación(2106)"] = safe_int(d.get("gratificacion_legal", 0))
            row["Colación(2301)"] = safe_int(d.get("colacion", 0))
            row["Movilización(2302)"] = safe_int(d.get("movilizacion", 0))
            row["Asignación familiar legal(2311)"] = safe_int(d.get("asig_familiar", 0))

            # Descuentos y Aportes (3000s - 4000s)
            row["Cotización obligatoria previsional (AFP o IPS)(3141)"] = safe_int(d.get("descuento_afp_total", 0))
            row["Cotización obligatoria salud 7%(3143)"] = safe_int(d.get("descuento_salud", 0))
            row["Cotización voluntaria para salud(3144)"] = safe_int(d.get("salud_voluntaria", 0))
            row["Cotización AFC - trabajador(3151)"] = safe_int(d.get("afc_trab", 0))
            row["Impuesto retenido por remuneraciones(3161)"] = safe_int(d.get("impuesto_unico", 0))
            row["AFC - Aporte empleador(4151)"] = safe_int(d.get("afc_emp", 0))
            row["Aporte empleador seguro invalidez y sobrevivencia(4155)"] = safe_int(d.get("sis_emp", 0))
            row["Aporte empleador seguro accidentes del trabajo y Ley SANNA(4152)"] = safe_int(safe_int(d.get("sueldo_base", 0)) * 0.0095) # Mutual ~0.95%

            # Totales y Sueldo Líquido (5000s)
            row["Total haberes(5201)"] = safe_int(d.get("total_haberes_brutos", 0))
            row["Total líquido(5501)"] = safe_int(d.get("sueldo_liquido", 0))
            row["Total descuentos(5301)"] = safe_int(d.get("descuento_afp_total", 0) + safe_int(d.get("descuento_salud", 0)) + safe_int(d.get("afc_trab", 0)) + safe_int(d.get("impuesto_unico", 0)))

            # Relleno de Ceros Automático (Garantía de Formato DT)
            for k in row:
                if any(x in k for x in ["(2", "(3", "(4", "(5"]) and row[k] == "":
                    row[k] = 0

            writer.writerow(row)

        content = output.getvalue()
        fname = f"LRE_DINAMICO_{book['company_rut'].replace('-','')}_{book['periodo']}.csv"
        return Response(content=content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={fname}"})
    except Exception as e:
        logger.error(f"Fallo exportador: {e}")
        raise HTTPException(status_code=500, detail="Error de síntesis dinámica")
