import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.database import get_supabase
from datetime import datetime
import calendar

router = APIRouter()

# ─── Sistema de Caché Interno para Métricas Executivas ─────────────────────
# Guardamos los resultados por (org_id, year) para evitar re-cálculos pesados
_metrics_cache = {}
CACHE_TTL = 900  # 15 minutos (900 segundos)

class MetricsRequest(BaseModel):
    organization_id: str
    year: int

def _get_from_cache(org_id: str, year: int):
    key = (org_id, year)
    if key in _metrics_cache:
        data, timestamp = _metrics_cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return data
    return None

def _save_to_cache(org_id: str, year: int, data: dict):
    _metrics_cache[(org_id, year)] = (data, time.time())

@router.post("/executive-metrics")
async def get_executive_metrics(req: MetricsRequest):
    """
    Agrega todas las métricas financieras (Ventas, Compras, Activos, F29)
    para el Dashboard Ejecutivo V2.
    """
    # 1. Verificar Caché
    cached_data = _get_from_cache(req.organization_id, req.year)
    if cached_data:
        print(f"[CACHE HIT] Métricas servidas desde memoria para {req.organization_id}")
        return {"success": True, "data": cached_data, "cached": True}

    db = get_supabase()
    
    try:
        start_date = f"{req.year}-01-01"
        end_date = f"{req.year}-12-31"

        print(f"[FASTAPI DASHBOARD] Calculando métricas pesadas para ORG: {req.organization_id} | AÑO: {req.year}")

        # 2. Obtener Datos (Ventas, Compras y Remuneraciones)
        sales_res = db.table("sales_records") \
            .select("monto_neto, fecha_docto") \
            .eq("organization_id", req.organization_id) \
            .gte("fecha_docto", start_date) \
            .lte("fecha_docto", end_date) \
            .execute()
        
        purchases_res = db.table("purchase_records") \
            .select("monto_neto, fecha_docto") \
            .eq("organization_id", req.organization_id) \
            .gte("fecha_docto", start_date) \
            .lte("fecha_docto", end_date) \
            .execute()

        payroll_res = db.table("liquidations") \
            .select("total_haberes_brutos, afc_empresa, sis_empresa, periodo") \
            .eq("organization_id", req.organization_id) \
            .gte("periodo", f"{req.year}-01-01") \
            .lte("periodo", f"{req.year}-12-31") \
            .execute()

        # 3. Procesar Tendencia Mensual (O(N))
        sales_by_month = [0] * 13
        purch_by_month = [0] * 13
        payroll_by_month = [0] * 13

        for s in sales_res.data:
            try:
                m = int(s["fecha_docto"].split("-")[1])
                sales_by_month[m] += int(s["monto_neto"] or 0)
            except: pass

        for p in purchases_res.data:
            try:
                m = int(p["fecha_docto"].split("-")[1])
                purch_by_month[m] += int(p["monto_neto"] or 0)
            except: pass

        for py in payroll_res.data:
            try:
                m = int(py["periodo"].split("-")[1])
                # El costo real para la empresa es Haberes Brutos + Cargas (SIS, AFC)
                costo = int(py["total_haberes_brutos"] or 0) + int(py["afc_empresa"] or 0) + int(py["sis_empresa"] or 0)
                payroll_by_month[m] += costo
            except: pass

        total_sales = sum(sales_by_month)
        total_purchases = sum(purch_by_month)
        total_payroll = sum(payroll_by_month)

        monthly_trend = []
        for month in range(1, 13):
            # Margen Operativo Mensual = Ventas - (Compras + Remuneraciones)
            op_margin = sales_by_month[month] - (purch_by_month[month] + payroll_by_month[month])
            monthly_trend.append({
                "month": calendar.month_abbr[month],
                "sales": sales_by_month[month],
                "purchases": purch_by_month[month],
                "payroll": payroll_by_month[month],
                "margin": op_margin
            })

        # 4. Activos Fijos y Depreciación (Impacto Financiero)
        assets_res = db.table("fixed_assets") \
            .select("valor_adquisicion, depreciacion_acumulada") \
            .eq("organization_id", req.organization_id) \
            .execute()
            
        total_assets_value = sum([a["valor_adquisicion"] for a in assets_res.data]) if assets_res.data else 0
        acc_depreciation = sum([a["depreciacion_acumulada"] for a in assets_res.data]) if assets_res.data else 0
        
        # Depreciación del ejercicio (Estimación: Vida útil promedio 5-10 años)
        # Esto afecta al EBIT, pero se suma de nuevo para el EBITDA.
        annual_depreciation_expense = int(total_assets_value / 8) if total_assets_value > 0 else 0

        # 5. Cálculos de Negocio (Standard IFRS/Management)
        # Gross Margin = Ventas - Compras (Directas)
        gross_margin = total_sales - total_purchases
        
        # EBITDA = Gross Margin - Operating Expenses (Payroll)
        # Nota: La depreciación NO se resta para el EBITDA, pero el payroll SÍ.
        ebitda = gross_margin - total_payroll
        
        margin_percentage = (gross_margin / total_sales * 100) if total_sales > 0 else 0
        ebitda_margin = (ebitda / total_sales * 100) if total_sales > 0 else 0

        # Evaluación General Profesional (Mapeada a Enums del Frontend)
        overall_assessment = "AVERAGE"
        if total_sales == 0 and total_payroll > 0:
            overall_assessment = "CRITICAL"
        elif ebitda_margin > 25:
            overall_assessment = "EXCELLENT"
        elif ebitda > 0:
            overall_assessment = "GOOD"
        else:
            overall_assessment = "CRITICAL"

        # Score ponderado (Ventas, Margen y EBITDA)
        score = 0
        if total_sales > 0:
            score = int((margin_percentage * 0.4) + (ebitda_margin * 0.6))
        score = min(100, max(0, score))

        # 6. Metadata de la Organización
        org_name = "Organización"
        try:
            org_info = db.table("organizations").select("nombre").eq("id", req.organization_id).single().execute()
            if org_info.data: org_name = org_info.data["nombre"]
        except: pass

        final_result = {
            "year": req.year,
            "orgName": org_name,
            "financials": {
                "totalSales": total_sales,
                "totalPurchases": total_purchases,
                "totalPayroll": total_payroll,
                "grossMargin": gross_margin,
                "marginPercentage": margin_percentage,
                "ebitda": ebitda,
                "ebitdaMargin": ebitda_margin
            },
            "assets": {
                "totalValue": total_assets_value,
                "totalDepreciation": acc_depreciation,
                "estimatedAnnualDepreciation": annual_depreciation_expense
            },
            "monthlyTrend": monthly_trend,
            "executiveSummary": {
                "overallAssessment": overall_assessment,
                "score": score,
                "insights": [
                    f"Ventas totales del periodo: ${total_sales:,.0f} CLP.",
                    f"EBITDA ({'Operativo' if ebitda > 0 else 'Déficit'}): ${ebitda:,.0f} CLP.",
                    f"Carga laboral anual: ${total_payroll:,.0f} CLP." if total_payroll > 0 else "No se registra gasto en remuneraciones.",
                    f"Alerta: Operando sin ingresos en el periodo." if total_sales == 0 and (total_payroll > 0 or total_purchases > 0) else "Flujo operativo detectado."
                ]
            }
        }

        # Guardar en Caché antes de retornar
        _save_to_cache(req.organization_id, req.year, final_result)
        
        return {"success": True, "data": final_result, "cached": False}

    except Exception as e:
        print(f"[DASHBOARD ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al calcular métricas: {str(e)}")
