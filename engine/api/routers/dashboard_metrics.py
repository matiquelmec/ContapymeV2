from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.database import get_supabase
from datetime import datetime
import calendar

router = APIRouter()

class MetricsRequest(BaseModel):
    organization_id: str
    year: int

@router.post("/executive-metrics")
async def get_executive_metrics(req: MetricsRequest):
    """
    Agrega todas las métricas financieras (Ventas, Compras, Activos, F29)
    para el Dashboard Ejecutivo V2.
    """
    db = get_supabase()
    
    try:
        start_date = f"{req.year}-01-01"
        end_date = f"{req.year}-12-31"

        # 1. Ventas Totales del Año (desde sales_records)
        sales_res = db.table("sales_records") \
            .select("monto_neto") \
            .eq("organization_id", req.organization_id) \
            .gte("fecha_docto", start_date) \
            .lte("fecha_docto", end_date) \
            .execute()
        
        total_sales = sum([s["monto_neto"] for s in sales_res.data]) if sales_res.data else 0

        # 2. Compras Totales del Año (desde purchase_records)
        purchases_res = db.table("purchase_records") \
            .select("monto_neto") \
            .eq("organization_id", req.organization_id) \
            .gte("fecha_docto", start_date) \
            .lte("fecha_docto", end_date) \
            .execute()
            
        total_purchases = sum([p["monto_neto"] for p in purchases_res.data]) if purchases_res.data else 0

        # 3. Activos Fijos y Depreciación
        assets_res = db.table("fixed_assets") \
            .select("valor_adquisicion, depreciacion_acumulada") \
            .eq("organization_id", req.organization_id) \
            .execute()
            
        total_assets_value = sum([a["valor_adquisicion"] for a in assets_res.data]) if assets_res.data else 0
        total_depreciation = sum([a["depreciacion_acumulada"] for a in assets_res.data]) if assets_res.data else 0

        # 4. Tendencia Mensual (Ventas vs Compras)
        monthly_trend = []
        for month in range(1, 13):
            month_str = f"{req.year}-{str(month).zfill(2)}"
            
            m_sales = sum([s["monto_neto"] for s in sales_res.data if s.get("fecha_docto", "").startswith(month_str)])
            m_purch = sum([p["monto_neto"] for p in purchases_res.data if p.get("fecha_docto", "").startswith(month_str)])
            
            monthly_trend.append({
                "month": calendar.month_abbr[month],
                "sales": m_sales,
                "purchases": m_purch,
                "margin": m_sales - m_purch
            })

        # 5. Cálculos de Negocio (Business Health AI Simulation)
        gross_margin = total_sales - total_purchases
        margin_percentage = (gross_margin / total_sales * 100) if total_sales > 0 else 0
        
        # EBITDA Simplificado: Margen Bruto + Depreciación Acumulada (aproximación)
        ebitda = gross_margin + total_depreciation

        # Evaluación General
        overall_assessment = "AVERAGE"
        if margin_percentage > 30 and ebitda > 0:
            overall_assessment = "EXCELLENT"
        elif margin_percentage > 15 and ebitda > 0:
            overall_assessment = "GOOD"
        elif ebitda < 0:
            overall_assessment = "CRITICAL"

        score = min(100, max(0, int(margin_percentage * 2))) if margin_percentage > 0 else 0

        return {
            "success": True,
            "data": {
                "year": req.year,
                "financials": {
                    "totalSales": total_sales,
                    "totalPurchases": total_purchases,
                    "grossMargin": gross_margin,
                    "marginPercentage": margin_percentage,
                    "ebitda": ebitda
                },
                "assets": {
                    "totalValue": total_assets_value,
                    "totalDepreciation": total_depreciation
                },
                "monthlyTrend": monthly_trend,
                "executiveSummary": {
                    "overallAssessment": overall_assessment,
                    "score": score,
                    "insights": [
                        f"Margen operativo del {margin_percentage:.1f}% detectado.",
                        f"EBITDA estimado: ${ebitda:,.0f} CLP.",
                        f"Ratio de inversión en activos frente a compras es saludable." if total_assets_value > 0 else "No hay activos fijos registrados."
                    ]
                }
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular métricas: {str(e)}")
