from datetime import date, datetime, timedelta
import calendar
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.database import get_supabase

router = APIRouter()

class TerminationRequest(BaseModel):
    employee_id: str
    organization_id: str
    fecha_termino: date
    causal_despido: str 
    aviso_previo: bool = True
    dias_vacaciones_tomados: float = 0
    pending_overtime_amount: int = 0
    other_bonuses: int = 0

def calculate_years_of_service(start_date: date, end_date: date):
    delta = end_date - start_date
    total_days = delta.days + 1
    
    years = total_days // 365
    remaining_days = total_days % 365
    months = remaining_days // 30
    
    severance_years = years
    if years >= 1 and (months > 6 or (months == 6 and (remaining_days % 30) > 0)):
        severance_years += 1
        
    return {
        "years": years,
        "months": months,
        "total_days": total_days,
        "severance_years": min(severance_years, 11)
    }

def calculate_proportional_holidays_precise(start_date: date, end_date: date):
    delta = end_date - start_date
    total_days = delta.days + 1
    months = total_days / 30.41
    proportional_days = months * 1.25
    return round(proportional_days, 2)

@router.post("/calculate")
async def calculate_termination(req: TerminationRequest):
    db = get_supabase()
    try:
        emp_res = db.table("employees").select("*").eq("id", req.employee_id).single().execute()
        emp = emp_res.data
        if not emp:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")

        fecha_ingreso = date.fromisoformat(emp["fecha_ingreso"])
        sueldo_base = emp["sueldo_base"]
        
        uf_value = 37000 
        try:
            ind_res = db.table("economic_indicators").select("valor").eq("codigo", "uf").execute()
            if ind_res.data:
                uf_value = float(ind_res.data[0]["valor"])
        except:
            pass
        
        requires_severance = False
        requires_notice = False
        severance_calculation_type = None
        causal_desc = req.causal_despido

        try:
            cause_res = db.table("termination_causes").select("*").or_(f"article_code.eq.{req.causal_despido},article_name.ilike.%{req.causal_despido}%").execute()
            if cause_res.data:
                cause = cause_res.data[0]
                causal_desc = cause["article_name"]
                requires_severance = cause["requires_severance"]
                requires_notice = cause["requires_notice"]
                severance_calculation_type = cause["severance_calculation_type"]
            else:
                if "161" in req.causal_despido or "necesidades" in req.causal_despido.lower():
                    requires_severance = True
                    requires_notice = True
                    severance_calculation_type = "years_service"
        except:
            if "161" in req.causal_despido or "necesidades" in req.causal_despido.lower():
                requires_severance = True
                requires_notice = True
                severance_calculation_type = "years_service"

        time_stats = calculate_years_of_service(fecha_ingreso, req.fecha_termino)
        
        last_day_of_month = calendar.monthrange(req.fecha_termino.year, req.fecha_termino.month)[1]
        worked_days_last_month = req.fecha_termino.day
        pending_salary_amount = int((sueldo_base / 30) * worked_days_last_month)
        
        proportional_days = calculate_proportional_holidays_precise(fecha_ingreso, req.fecha_termino)
        pending_vacation_days = max(0.0, float(proportional_days) - float(req.dias_vacaciones_tomados))
        vacation_daily_rate = int(sueldo_base / 30)
        monto_vacaciones = int(pending_vacation_days * vacation_daily_rate)
        
        monto_anos_servicio = 0
        if requires_severance and severance_calculation_type == "years_service":
            monto_anos_servicio = sueldo_base * time_stats["severance_years"]
            tope_330_uf = int(uf_value * 330)
            if monto_anos_servicio > tope_330_uf:
                monto_anos_servicio = tope_330_uf

        monto_mes_aviso = 0
        if requires_notice and not req.aviso_previo:
            monto_mes_aviso = sueldo_base

        total_compensations = pending_salary_amount + monto_vacaciones + monto_anos_servicio + monto_mes_aviso + req.pending_overtime_amount + req.other_bonuses
        
        termination_data = {
            "organization_id": req.organization_id,
            "employee_id": req.employee_id,
            "fecha_inicio": fecha_ingreso.isoformat(),
            "fecha_termino": req.fecha_termino.isoformat(),
            "causal_despido": causal_desc,
            "vacaciones_pendientes_dias": float(pending_vacation_days),
            "monto_vacaciones": int(monto_vacaciones),
            "monto_indemnizacion_anos": int(monto_anos_servicio),
            "monto_mes_aviso": int(monto_mes_aviso),
            "total_finiquito": int(total_compensations),
            "status": "borrador",
            "worked_days_last_month": worked_days_last_month,
            "pending_salary_amount": pending_salary_amount,
            "vacation_daily_rate": vacation_daily_rate,
            "proportional_vacation_days": float(proportional_days),
            "proportional_vacation_amount": int(monto_vacaciones),
            "severance_years_service": float(time_stats["severance_years"]),
            "severance_monthly_salary": int(sueldo_base),
            "notice_indemnification_amount": int(monto_mes_aviso),
            "pending_overtime_amount": req.pending_overtime_amount,
            "other_bonuses_amount": req.other_bonuses,
            "updated_at": datetime.now().isoformat()
        }

        exist = db.table("employee_terminations").select("id").eq("employee_id", req.employee_id).execute()
        
        if exist.data:
            term_id = exist.data[0]["id"]
            db.table("employee_terminations").update(termination_data).eq("id", term_id).execute()
            termination_data["id"] = term_id
        else:
            ins_res = db.table("employee_terminations").insert(termination_data).execute()
            termination_data["id"] = ins_res.data[0]["id"]

        return {
            "success": True,
            "data": termination_data,
            "calculation_details": {
                "years_of_service": time_stats["years"],
                "months_of_service": time_stats["months"],
                "uf_used": uf_value,
                "severance_years_applied": time_stats["severance_years"]
            }
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error en el cálculo de finiquito: {str(e)}")

@router.get("/causes")
async def get_termination_causes():
    db = get_supabase()
    try:
        res = db.table("termination_causes").select("*").order("article_code").execute()
        if not res.data:
            return {
                "success": True, 
                "data": [
                    {"article_code": "161-1", "article_name": "Art. 161 N°1 - Necesidades de la empresa", "requires_notice": True, "requires_severance": True},
                    {"article_code": "159-1", "article_name": "Art. 159 N°1 - Mutuo acuerdo", "requires_notice": False, "requires_severance": False},
                    {"article_code": "159-2", "article_name": "Art. 159 N°2 - Renuncia voluntaria", "requires_notice": False, "requires_severance": False},
                    {"article_code": "159-4", "article_name": "Art. 159 N°4 - Vencimiento del plazo", "requires_notice": False, "requires_severance": False},
                    {"article_code": "159-5", "article_name": "Art. 159 N°5 - Conclusión de obra", "requires_notice": False, "requires_severance": False}
                ]
            }
        return {"success": True, "data": res.data}
    except:
        return {
            "success": True, 
            "data": [
                {"article_code": "161-1", "article_name": "Art. 161 N°1 - Necesidades de la empresa", "requires_notice": True, "requires_severance": True},
                {"article_code": "159-1", "article_name": "Art. 159 N°1 - Mutuo acuerdo", "requires_notice": False, "requires_severance": False}
            ]
        }

@router.get("/{termination_id}/document/{doc_type}")
async def generate_document_text(termination_id: str, doc_type: str):
    db = get_supabase()
    try:
        term_res = db.table("employee_terminations").select("*, employees(*)").eq("id", termination_id).single().execute()
        term = term_res.data
        if not term:
            raise HTTPException(status_code=404, detail="Finiquito no encontrado")
        
        emp = term["employees"]
        org_id = term["organization_id"]
        org_res = db.table("organizations").select("*").eq("id", org_id).single().execute()
        org = org_res.data or {}
        
        hoy = date.today().strftime("%d de %B de %Y")
        fecha_term = datetime.fromisoformat(term["fecha_termino"]).strftime("%d de %B de %Y")
        
        if doc_type == "carta":
            return {
                "success": True,
                "title": f"CARTA DE AVISO - {emp['nombres']} {emp['apellido_paterno']}",
                "content": f"Punta Arenas, {hoy}\n\nSeñor(a)\n{emp['nombres']} {emp['apellido_paterno']} {emp['apellido_materno'] or ''}\nRUT: {emp['rut']}\nPresente:\n\nRef: Aviso de Término de Contrato de Trabajo.\n\nPor medio de la presente, comunicamos a Ud. que la empresa {org.get('nombre', 'LA EMPRESA')} ha decidido poner término a su contrato de trabajo, en virtud de lo dispuesto en el {term['causal_despido']}, del Código del Trabajo.\n\nEl término de su contrato será efectivo a partir del día {fecha_term}.\n\nAsimismo, ponemos en su conocimiento que sus cotizaciones previsionales y de salud se encuentran al día, según consta en certificados adjuntos.\n\nFinalmente, agradecemos su desempeño y compromiso durante el período en que le correspondió cumplir funciones en nuestra institución.\n\nSin otro particular, saluda atentamente a Ud.\n\n__________________________\nFIRMA EMPLEADOR\n{org.get('nombre', 'CONTAPYME V2')}"
            }
        elif doc_type == "finiquito":
            return {
                "success": True,
                "title": f"ACTA DE FINIQUITO - {emp['nombres']} {emp['apellido_paterno']}",
                "content": f"En Punta Arenas, a {hoy}, entre la empresa {org.get('nombre', 'LA EMPRESA')}, RUT {org.get('rut_empresa', '---')}, representada por su Gerente General, y el trabajador don (ña) {emp['nombres']} {emp['apellido_paterno']}, RUT {emp['rut']}, se ha convenido el siguiente finiquito:\n\nPRIMERO: El trabajador prestó servicios desde el {term['fecha_inicio']} hasta el {term['fecha_termino']}, fecha en que el contrato ha terminado por la causal: {term['causal_despido']}.\n\nSEGUNDO: Por medio de este acto, el empleador paga al trabajador las siguientes sumas:\n- Haberes pendientes y días trabajados: ${term.get('pending_salary_amount', 0):,}\n- Vacaciones proporcionales / pendientes: ${term['monto_vacaciones']:,}\n- Indemnización años de servicio: ${term['monto_indemnizacion_anos']:,}\n- Mes de aviso / Sustitutiva: ${term['monto_mes_aviso']:,}\n- Otros bonos y horas extras: ${term.get('pending_overtime_amount', 0) + term.get('other_bonuses_amount', 0):,}\n\nTOTAL BRUTO A PAGAR: ${term['total_finiquito']:,}\n\nTERCERO: El trabajador declara recibir en este acto, a su entera satisfacción, la suma total indicada, no teniendo reclamo alguno que formular en contra de su empleador derivado de la relación laboral que los unió.\n\nCUARTO: Las partes otorgan el más amplio, completo y recíproco finiquito.\n\n__________________________          __________________________\n    FIRMA TRABAJADOR                    FIRMA EMPLEADOR\n        {emp['rut']}                     {org.get('nombre', '---')}"
            }
        return {"success": False, "error": "Tipo de documento no válido"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
