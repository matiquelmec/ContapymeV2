"""
Motor de Depreciación de Activos Fijos — Contapyme V2
Soporta método Lineal y Acelerado (según tabla SII Chile).
Con protección anti-duplicación de períodos.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.database import get_supabase
from datetime import date

router = APIRouter()


class DepreciateRequest(BaseModel):
    org_id: str
    periodo: str  # "YYYY-MM-DD" primer día del mes a procesar


@router.post("/depreciate")
async def depreciate_assets(req: DepreciateRequest):
    """
    Recorre todos los activos fijos ACTIVOS de la empresa y calcula
    la depreciación mensual. Protegido contra doble aplicación en el mismo período.
    """
    db = get_supabase()

    try:
        # Normalizar período al "YYYY-MM" para comparación mensual
        periodo_mes = req.periodo[:7]  # Ej: "2026-03"

        # 1. Traer activos activos de la empresa
        result = db.table("fixed_assets") \
            .select("*") \
            .eq("organization_id", req.org_id) \
            .eq("condicion", "activo") \
            .execute()

        assets = result.data
        if not assets:
            return {"success": True, "processed_count": 0, "skipped_count": 0,
                    "message": "No hay activos activos"}

        processed_count = 0
        skipped_count = 0
        skipped_names = []
        new_asset_names = []

        for asset in assets:
            nombre_activo = asset.get("nombre", "Sin nombre")

            # 🔒 GUARDIA 1 — NORMA SII/CHILE: Activos ingresados este mismo mes NO se deprecian.
            # La depreciación comienza el mes SIGUIENTE al de adquisición.
            fecha_adq = str(asset.get("fecha_adquisicion", ""))
            if fecha_adq[:7] == periodo_mes:
                new_asset_names.append(nombre_activo)
                skipped_count += 1
                continue  # Primer mes: no depreciar

            # 🔒 GUARDIA 2 — ANTI-DUPLICACIÓN: verificar si ya se depreció este mes
            ultimo_periodo = asset.get("ultimo_periodo_depreciado")
            if ultimo_periodo and str(ultimo_periodo)[:7] == periodo_mes:
                skipped_count += 1
                skipped_names.append(nombre_activo)
                continue

            valor_adq = asset.get("valor_adquisicion", 0)
            vida_util = asset.get("vida_util_meses", 1)
            valor_residual = asset.get("valor_residual", 0)
            dep_acumulada = asset.get("depreciacion_acumulada", 0) or 0
            metodo = asset.get("metodo_depreciacion", "lineal")

            # Fórmula de depreciación mensual
            if metodo == "lineal":
                dep_mensual = (valor_adq - valor_residual) / max(vida_util, 1)
            elif metodo == "acelerada":
                tasa_lineal = 1 / max(vida_util, 1)
                valor_libro_actual = valor_adq - dep_acumulada
                dep_mensual = valor_libro_actual * (tasa_lineal * 2)
            else:
                dep_mensual = (valor_adq - valor_residual) / max(vida_util, 1)

            # Tope: no depreciar más del valor depreciable
            nueva_dep_acumulada = min(
                dep_acumulada + dep_mensual,
                valor_adq - valor_residual
            )
            nuevo_valor_libro = valor_adq - nueva_dep_acumulada

            # Actualizar en DB con el sello del período
            update_data = {
                "depreciacion_mensual": int(dep_mensual),
                "depreciacion_acumulada": int(nueva_dep_acumulada),
                "valor_libro_actual": int(nuevo_valor_libro),
                "ultimo_periodo_depreciado": req.periodo,
            }

            db.table("fixed_assets") \
                .update(update_data) \
                .eq("id", asset["id"]) \
                .execute()

            processed_count += 1

        msg = f"Depreciación aplicada a {processed_count} activos."
        if new_asset_names:
            msg += f" {len(new_asset_names)} activo(s) ingresado(s) este mes, depreciarán desde el próximo período ({', '.join(new_asset_names)})."
        if skipped_names:
            msg += f" {len(skipped_names)} ya procesado(s) este período."

        return {
            "success": True,
            "processed_count": processed_count,
            "skipped_count": skipped_count,
            "skipped_names": skipped_names,
            "new_assets": new_asset_names,
            "message": msg
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_asset(asset_data: dict):
    """Crea un nuevo activo fijo con depreciación inicial calculada."""
    db = get_supabase()

    try:
        valor_adq = asset_data.get("valor_adquisicion", 0)
        vida_util = asset_data.get("vida_util_meses", 1)
        valor_residual = asset_data.get("valor_residual", 0)

        dep_mensual = (valor_adq - valor_residual) / max(vida_util, 1)

        asset_data["depreciacion_mensual"] = int(dep_mensual)
        asset_data["depreciacion_acumulada"] = 0
        asset_data["valor_libro_actual"] = valor_adq

        result = db.table("fixed_assets").insert(asset_data).execute()

        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
