import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from parsers.f29_plumber import parse_f29_pdf
from core.database import get_supabase
from core.auth import verify_token
from core.logger import log_activity, log_system_error
from fastapi import Depends

router = APIRouter(tags=["Formulario 29"])

class ProcessF29Request(BaseModel):
    storage_path: str
    org_id: str

class F29Response(BaseModel):
    success: bool
    data: Dict[str, Any] | None = None
    audit: Dict[str, Any] | None = None
    error: str | None = None

@router.post("/process", response_model=F29Response)
async def process_f29(payload: ProcessF29Request, current_user: dict = Depends(verify_token)):
    """
    Endpoint de alta intensidad de CPU. 
    1. Descarga el PDF temporalmente desde Supabase Storage.
    2. Delega el parseo geométrico a un threadpool.
    3. Devuelve los valores matemáticamente limpios en JSON.
    """
    db = get_supabase()
    
    if not payload.storage_path.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Documento inválido. Se requiere un PDF del F29.")
        
    temp_dir = os.path.join(os.getcwd(), "tmp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, os.path.basename(payload.storage_path))
    
    try:
        res = db.storage.from_('tax_documents').download(payload.storage_path)
        with open(temp_path, "wb") as buffer:
            buffer.write(res)
            
        parse_result = await run_in_threadpool(parse_f29_pdf, temp_path)
        
        if not parse_result.get("success"):
            log_system_error(
                category="F29_PARSER",
                message=parse_result.get("error", "Error desconocido"),
                organization_id=payload.org_id,
                details={"storage_path": payload.storage_path}
            )
            raise HTTPException(status_code=422, detail=parse_result.get("error"))
            
        # REGISTRAR EN BITÁCORA (AUDIT LOG)
        log_activity(
            action="process_f29_pdf",
            organization_id=payload.org_id,
            user_id=current_user.get("id"),
            entity_type="f29_form",
            entity_id=payload.storage_path,
            details={
                "method": "pdfplumber",
                "success": True
            }
        )

        return F29Response(
            success=True, 
            data=parse_result["data"],
            audit=parse_result.get("audit")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fatal: {str(e)}")
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/debug/all")
async def debug_all_f29(current_user: dict = Depends(verify_token)):
    db = get_supabase()
    result = db.table("f29_forms").select("*").execute()
    return {"total": len(result.data), "data": result.data}

@router.delete("/{f29_id}")
async def delete_f29_record(f29_id: str, current_user: dict = Depends(verify_token)):
    """Elimina un registro de F29 por su ID."""
    db = get_supabase()
    result = db.table("f29_forms").delete().eq("id", f29_id).execute()
    return {"success": True, "message": f"Registro {f29_id} eliminado."}

@router.get("/analysis/history")
async def get_f29_history(organization_id: str, limit: int = 12, current_user: dict = Depends(verify_token)):
    """
    Recupera el historial de F29 y calcula variaciones porcentuales (Tendencias).
    """
    print(f"DEBUG: Buscando historial para ORG_ID: {organization_id}")
    db = get_supabase()
    try:
        # Consulta simplificada para asegurar recuperación
        result = db.table("f29_forms") \
            .select("*") \
            .eq("organization_id", organization_id) \
            .execute()
        
        data = result.data or []
        print(f"DEBUG: Registros encontrados: {len(data)}")
        
        if not data:
            return {"success": True, "history": [], "insights": {}}

        # Ordenar localmente para evitar problemas de parámetros en el SDK
        data_sorted = sorted(data, key=lambda x: x["periodo"])
        
        from typing import Any
        history: list[Any] = []
        
        for i, current in enumerate(data_sorted):
            entry = dict(current)
            
            # Valores base como floats
            v = float(current.get("ventas_netas") or 0)
            df = float(current.get("debito_fiscal") or 0)
            cf = float(current.get("credito_fiscal") or 0)
            tp = float(current.get("total_a_pagar") or 0)
            
            cp = float(cf / 0.19) if cf > 0 else 0.0
            
            # Ratios
            entry["ratios"] = {
                "margin_proyectado": round((v - cp) / v * 100, 1) if v > 0 else 0.0,
                "tax_burden": round(tp / v * 100, 2) if v > 0 else 0.0,
                "iva_effectiveness": round(df / v * 100, 2) if v > 0 else 0.0,
                "credit_debit_ratio": round(cf / df, 2) if df > 0 else 0.0,
                "compras_proyectadas": cp
            }

            var = 0.0
            if i > 0:
                prev_tp = float(data_sorted[i-1].get("total_a_pagar") or 0)
                if prev_tp != 0:
                    var = round(((tp - prev_tp) / prev_tp) * 100, 2)
            
            entry["variation_pct"] = var
            history.append(entry)

        # Resumen final
        last = history[-1] if history else {}
        sub = history[-3:] if history else []
        avg = sum(float(h.get("total_a_pagar") or 0) for h in sub) / len(sub) if sub else 0.0
        
        msg = "Inicie cargando su primer F29."
        last_v = 0.0
        
        if len(history) == 1:
            msg = "Primer periodo analizado. Suba otro mes para comparar."
        elif len(history) > 1:
            last_v = float(last.get("variation_pct") or 0)
            status = "subido" if last_v > 0 else "bajado"
            m = last.get("ratios", {}).get("margin_proyectado", 0)
            msg = f"Impuestos han {status} {abs(last_v)}%. Margen: {m}%."

        return {
            "success": True, 
            "history": history,
            "insights": {
                "average_total": avg,
                "last_margin": last.get("ratios", {}).get("margin_proyectado", 0) if history else 0,
                "trend": "upward" if last_v > 0 else "downward" if last_v < 0 else "stable",
                "message": msg
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
