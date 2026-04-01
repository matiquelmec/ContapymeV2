"""
Motor de Depreciación de Activos Fijos — Contapyme V2
Soporta método Lineal y Acelerado (según tabla SII Chile).
Con protección anti-duplicación de períodos y centralización contable automática.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.database import get_supabase
from core.auth import verify_token
from core.logger import log_activity
from fastapi import Depends
from datetime import date
import traceback

router = APIRouter()


class DepreciateRequest(BaseModel):
    org_id: str
    periodo: str  # "YYYY-MM-DD" primer día del mes a procesar


def get_asset_accounting_config(db, org_id: str):
    """
    Busca la configuración de cuentas para el módulo de activos.
    Si no existe, devuelve valores por defecto estándar.
    """
    try:
        res = db.table("centralized_account_config").select("*") \
            .eq("organization_id", org_id) \
            .eq("module_name", "assets") \
            .eq("transaction_type", "depreciation") \
            .eq("is_active", True) \
            .execute()
        
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as e:
        print(f"[WARN] No se pudo obtener config contable de activos: {e}")
    
    # Fallback predeterminado
    return {
        "tax_account_code": "5.1.03.001", "tax_account_name": "Gasto Depreciación del Ejercicio",
        "revenue_account_code": "1.1.05.001", "revenue_account_name": "Depreciación Acumulada"
    }


@router.post("/depreciate")
async def depreciate_assets(req: DepreciateRequest, current_user: dict = Depends(verify_token)):
    """
    Recorre todos los activos fijos ACTIVOS de la empresa y calcula
    la depreciación mensual. Crea un asiento contable por cada procesado.
    """
    db = get_supabase()

    try:
        periodo_mes = req.periodo[:7]  # Ej: "2026-03"
        config = get_asset_accounting_config(db, req.org_id)

        # 1. Traer activos operativos
        result = db.table("fixed_assets") \
            .select("*") \
            .eq("organization_id", req.org_id) \
            .eq("condicion", "activo") \
            .execute()

        assets = result.data
        if not assets:
            return {"success": True, "processed_count": 0, "entries_created": 0,
                    "message": "No hay activos para procesar."}

        processed_count = 0
        entries_created = 0
        skipped_count = 0

        for asset in assets:
            nombre_activo = asset.get("nombre", "Sin nombre")
            asset_id = asset["id"]

            # 🔒 GUARDIA 1 — Norma SII: Saltear mes de adquisición
            fecha_adq = str(asset.get("fecha_adquisicion", ""))
            if fecha_adq[:7] == periodo_mes:
                skipped_count += 1
                continue 

            # 🔒 GUARDIA 2 — Anti-duplicación
            ultimo_periodo = asset.get("ultimo_periodo_depreciado")
            if ultimo_periodo and str(ultimo_periodo)[:7] == periodo_mes:
                skipped_count += 1
                continue

            valor_adq = asset.get("valor_adquisicion", 0)
            vida_util = asset.get("vida_util_meses", 1)
            valor_residual = asset.get("valor_residual", 0)
            dep_acumulada = asset.get("depreciacion_acumulada", 0) or 0
            metodo = asset.get("metodo_depreciacion", "lineal")

            # Cálculo según método
            if metodo == "acelerada":
                tasa_lineal = 1 / max(vida_util, 1)
                valor_libro_actual = valor_adq - dep_acumulada
                dep_mensual = valor_libro_actual * (tasa_lineal * 2)
            else: # Lineal por defecto
                dep_mensual = (valor_adq - valor_residual) / max(vida_util, 1)

            # Ajuste de tope para no sobre-depreciar
            monto_maximo = max(0, valor_adq - valor_residual - dep_acumulada)
            monto_asiento = int(min(dep_mensual, monto_maximo))

            if monto_asiento <= 0:
                skipped_count += 1
                continue

            # --- CENTRALIZACIÓN CONTABLE ---
            glosa = f"Depreciación Mensual {periodo_mes} — {nombre_activo}"
            
            # Priorizar nuevas columnas específicas, fallback a genéricas de la migración original
            expense_code = config.get("asset_depreciation_expense_code") or config.get("tax_account_code")
            expense_name = config.get("asset_depreciation_expense_name") or config.get("tax_account_name")
            accumulated_code = config.get("asset_accumulated_depreciation_code") or config.get("revenue_account_code")
            accumulated_name = config.get("asset_accumulated_depreciation_name") or config.get("revenue_account_name")

            lines = [
                {
                    "cuenta_codigo": expense_code, 
                    "cuenta_nombre": expense_name, 
                    "tipo": "debe", "monto": monto_asiento
                },
                {
                    "cuenta_codigo": accumulated_code, 
                    "cuenta_nombre": accumulated_name, 
                    "tipo": "haber", "monto": monto_asiento
                }
            ]

            rpc_res = db.rpc("create_journal_entry_with_lines", {
                "p_organization_id": req.org_id,
                "p_fecha": req.periodo,
                "p_glosa": glosa,
                "p_lines": lines
            }).execute()

            journal_id = rpc_res.data
            if journal_id:
                # Vincular el asiento al activo para trazabilidad
                db.table("journal_entries").update({"fixed_asset_id": asset_id}).eq("id", journal_id).execute()
                entries_created += 1

            # Actualizar Estado del Activo
            nueva_dep_acumulada = dep_acumulada + monto_asiento
            update_data = {
                "depreciacion_mensual": monto_asiento,
                "depreciacion_acumulada": int(nueva_dep_acumulada),
                "valor_libro_actual": int(valor_adq - nueva_dep_acumulada),
                "ultimo_periodo_depreciado": req.periodo,
            }

            db.table("fixed_assets").update(update_data).eq("id", asset_id).execute()
            processed_count += 1

        # REGISTRAR EN BITÁCORA (AUDIT LOG)
        log_activity(
            action="depreciate_assets",
            organization_id=req.org_id,
            user_id=current_user.get("id"),
            entity_type="fixed_assets_period",
            entity_id=f"{req.org_id}_{periodo_mes}",
            details={
                "processed_count": processed_count,
                "entries_created": entries_created
            }
        )

        return {
            "success": True,
            "processed_count": processed_count,
            "entries_created": entries_created,
            "message": f"Se procesaron {processed_count} activos y se generaron {entries_created} asientos contables."
        }

    except Exception as e:
        print(f"[ERROR depreciate_assets] {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_asset(asset_data: dict, current_user: dict = Depends(verify_token)):
    """Crea un nuevo activo fijo con metadatos de inventario y depreciación inicial."""
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

        if not result.data:
            raise Exception("No se pudo insertar el activo.")

        # REGISTRAR EN BITÁCORA (AUDIT LOG)
        log_activity(
            action="create_fixed_asset",
            organization_id=asset_data.get("organization_id"),
            user_id=current_user.get("id"),
            entity_type="fixed_asset",
            entity_id=result.data[0]["id"],
            details={
                "name": asset_data.get("nombre"),
                "value": asset_data.get("valor_adquisicion")
            }
        )

        return {"success": True, "data": result.data[0]}
    except Exception as e:
        print(f"[ERROR create_asset] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

