import time
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from core.database import get_supabase
from datetime import datetime
import calendar
from core.auth import verify_token, verify_org_role

router = APIRouter()

# ─── Sistema de Caché Interno para Métricas Executivas ─────────────────────
# Guardamos los resultados por (org_id, year) para evitar re-cálculos pesados
_metrics_cache = {}
CACHE_TTL = 900  # 15 minutos (900 segundos)

class MetricsRequest(BaseModel):
    organization_id: str
    year: int
    refresh: bool = False

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
async def get_executive_metrics(
    req: MetricsRequest,
    current_user: dict = Depends(verify_token)
):
    await verify_org_role(req.organization_id, auth=current_user)
    """
    Agrega todas las métricas financieras (Ventas, Compras, Activos, F29)
    para el Dashboard Ejecutivo V2.
    """
    # 1. Verificar Caché (solo si no se solicita forzar actualización)
    if not req.refresh:
        cached_data = _get_from_cache(req.organization_id, req.year)
        if cached_data:
            print(f"[CACHE HIT] Métricas servidas desde memoria para {req.organization_id}")
            return {"success": True, "data": cached_data, "cached": True}
    else:
        print(f"[CACHE BYPASS] Forzando recalculación de métricas para {req.organization_id}")

    db = get_supabase()
    
    try:
        start_date = f"{req.year}-01-01"
        end_date = f"{req.year}-12-31"

        print(f"[FASTAPI DASHBOARD] Calculando métricas pesadas para ORG: {req.organization_id} | AÑO: {req.year}")

        # 2. Intentar llamar al procedimiento RPC optimizado en PostgreSQL
        db_aggregates = None
        try:
            rpc_res = db.rpc("get_organization_financial_aggregates", {
                "p_organization_id": req.organization_id,
                "p_year": req.year
            }).execute()
            if rpc_res.data:
                db_aggregates = rpc_res.data
        except Exception as rpc_err:
            print(f"[FASTAPI DASHBOARD] Fallback RPC a queries regulares: {rpc_err}")

        if db_aggregates and "totals" in db_aggregates:
            # Vía Rápida: 1 sola llamada de red con respuesta ya computada
            totals = db_aggregates.get("totals") or {}
            total_sales = int(totals.get("total_sales") or 0)
            total_purchases = int(totals.get("total_purchases") or 0)
            total_payroll = int(totals.get("total_payroll") or 0)

            assets_data = db_aggregates.get("assets") or {}
            total_assets_value = int(assets_data.get("total_value") or 0)
            acc_depreciation = int(assets_data.get("total_depreciation") or 0)

            raw_trend = db_aggregates.get("trend") or []
            monthly_trend = []
            for t in raw_trend:
                monthly_trend.append({
                    "month": t.get("month_name") or calendar.month_abbr[int(t.get("month_num", 1))],
                    "sales": int(t.get("sales") or 0),
                    "purchases": int(t.get("purchases") or 0),
                    "payroll": int(t.get("payroll") or 0),
                    "margin": int(t.get("margin") or 0)
                })
        else:
            # Vía Fallback tradicional
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
                    costo = int(py["total_haberes_brutos"] or 0) + int(py["afc_empresa"] or 0) + int(py["sis_empresa"] or 0)
                    payroll_by_month[m] += costo
                except: pass

            total_sales = sum(sales_by_month)
            total_purchases = sum(purch_by_month)
            total_payroll = sum(payroll_by_month)

            monthly_trend = []
            for month in range(1, 13):
                op_margin = sales_by_month[month] - (purch_by_month[month] + payroll_by_month[month])
                monthly_trend.append({
                    "month": calendar.month_abbr[month],
                    "sales": sales_by_month[month],
                    "purchases": purch_by_month[month],
                    "payroll": payroll_by_month[month],
                    "margin": op_margin
                })

            assets_res = db.table("fixed_assets") \
                .select("valor_adquisicion, depreciacion_acumulada") \
                .eq("organization_id", req.organization_id) \
                .execute()
                
            total_assets_value = sum([a["valor_adquisicion"] for a in assets_res.data]) if assets_res.data else 0
            acc_depreciation = sum([a["depreciacion_acumulada"] for a in assets_res.data]) if assets_res.data else 0

        # Depreciación del ejercicio estimada
        annual_depreciation_expense = int(total_assets_value / 8) if total_assets_value > 0 else 0

        # 3. Cálculos Financieros IFRS
        gross_margin = total_sales - total_purchases
        ebitda = gross_margin - total_payroll
        margin_percentage = (gross_margin / total_sales * 100) if total_sales > 0 else 0
        ebitda_margin = (ebitda / total_sales * 100) if total_sales > 0 else 0

        # 4. Evaluación Asistida y Contextual de la Salud del Negocio
        overall_assessment = "AVERAGE"
        score = 0

        if total_sales == 0 and (total_payroll > 0 or total_purchases > 0):
            # Caso "Inversiones Riquelme": Empresa en fase de inversión o arranque operativo
            overall_assessment = "PREOPERATIONAL"
            score = 30  # Puntaje base de estructuración corporativa
        elif total_sales == 0 and total_payroll == 0 and total_purchases == 0:
            overall_assessment = "AVERAGE"
            score = 50
        elif ebitda_margin > 25:
            overall_assessment = "EXCELLENT"
            score = int((margin_percentage * 0.4) + (ebitda_margin * 0.6))
        elif ebitda > 0:
            overall_assessment = "GOOD"
            score = int((margin_percentage * 0.4) + (ebitda_margin * 0.6))
        else:
            overall_assessment = "CRITICAL"
            score = max(5, int(margin_percentage * 0.3))

        score = min(100, max(0, score))

        # 5. Metadata de la Organización
        org_name = "Organización"
        try:
            org_info = db.table("organizations").select("nombre").eq("id", req.organization_id).single().execute()
            if org_info.data: org_name = org_info.data["nombre"]
        except: pass

        # 6. Insights Consultivos Dinámicos
        insights = [
            f"Ventas totales del periodo: ${total_sales:,.0f} CLP.",
            f"EBITDA ({'Operativo' if ebitda > 0 else 'Déficit'}): ${ebitda:,.0f} CLP.",
            f"Carga laboral anual: ${total_payroll:,.0f} CLP." if total_payroll > 0 else "No se registra gasto en remuneraciones.",
        ]

        if overall_assessment == "PREOPERATIONAL":
            insights.append("Fase Preoperativa / Inversión: Registra costos de capital humano sin ventas emitidas. Sincronice su RCV para regularizar.")
        elif total_sales == 0:
            insights.append("Alerta: Sin emisión de facturación en el período fiscal.")
        else:
            insights.append("Flujo operativo transaccional en curso.")

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
                "insights": insights
            }
        }

        # Guardar en Caché antes de retornar
        _save_to_cache(req.organization_id, req.year, final_result)
        
        return {"success": True, "data": final_result, "cached": False}

    except Exception as e:
        print(f"[DASHBOARD ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al calcular métricas: {str(e)}")

