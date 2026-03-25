import os
import shutil
import time
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from parsers.f29_plumber import parse_f29_pdf
from core.database import get_supabase
from core.auth import verify_token
from core.logger import log_activity, log_system_error

router = APIRouter(tags=["Formulario 29"])

# ─── Sistema de Caché Interno para F29 ───────────────────────────
_f29_analysis_cache = {}
F29_CACHE_TTL = 3600 # 1 hora

def _get_f29_cache(key: str):
    if key in _f29_analysis_cache:
        data, ts = _f29_analysis_cache[key]
        if time.time() - ts < F29_CACHE_TTL: return data
    return None

def _set_f29_cache(key: str, data: Any):
    _f29_analysis_cache[key] = (data, time.time())

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
                category="F29_PARSER", message=parse_result.get("error", "Error desconocido"),
                organization_id=payload.org_id, details={"storage_path": payload.storage_path}
            )
            raise HTTPException(status_code=422, detail=parse_result.get("error"))
            
        log_activity(
            action="process_f29_pdf", organization_id=payload.org_id, user_id=current_user.get("id"),
            entity_type="f29_form", entity_id=payload.storage_path, details={"method": "pdfplumber"}
        )

        return F29Response(success=True, data=parse_result["data"], audit=parse_result.get("audit"))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fatal: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.delete("/{organization_id}/{f29_id}")
async def delete_f29_record(organization_id: str, f29_id: str, current_user: dict = Depends(verify_token)):
    db = get_supabase()
    res = db.table("f29_forms").delete().eq("id", f29_id).eq("organization_id", organization_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Registro no encontrado.")
    return {"success": True, "message": "Registro eliminado."}

@router.get("/analysis/history")
async def get_f29_history(organization_id: str, limit: int = 12, current_user: dict = Depends(verify_token)):
    cache_key = f"f29_hist_{organization_id}_{limit}"
    cached = _get_f29_cache(cache_key)
    if cached: return cached

    db = get_supabase()
    try:
        result = db.table("f29_forms").select("*").eq("organization_id", organization_id).execute()
        data = result.data or []
        if not data: return {"success": True, "history": [], "insights": {}}

        data_sorted = sorted(data, key=lambda x: x["periodo"])
        history = []
        
        for i, current in enumerate(data_sorted):
            entry = dict(current)
            v = float(current.get("ventas_netas") or 0)
            df = float(current.get("debito_fiscal") or 0)
            cf = float(current.get("credito_fiscal") or 0)
            tp = float(current.get("total_a_pagar") or 0)
            cp = float(cf / 0.19) if cf > 0 else 0.0
            
            entry["ratios"] = {
                "margin_proyectado": round((v - cp) / (v + 0.01) * 100, 1),
                "tax_burden": round(tp / (v + 0.01) * 100, 2),
                "iva_effectiveness": round(df / (v + 0.01) * 100, 2),
                "credit_debit_ratio": round(cf / (df + 0.01), 2),
                "compras_proyectadas": cp
            }

            var = 0.0
            if i > 0:
                prev_tp = float(data_sorted[i-1].get("total_a_pagar") or 0)
                if prev_tp != 0: var = round(((tp - prev_tp) / prev_tp) * 100, 2)
            
            entry["variation_pct"] = var
            history.append(entry)

        last = history[-1] if history else {}
        sub = history[-3:]
        avg = sum(float(h.get("total_a_pagar") or 0) for h in sub) / len(sub) if sub else 0.0
        
        last_v = float(last.get("variation_pct") or 0)
        status = "subido" if last_v > 0 else "bajado"
        m = last.get("ratios", {}).get("margin_proyectado", 0)
        msg = f"Impuestos han {status} {abs(last_v)}%. Margen: {m}%." if len(history) > 1 else "Primer periodo analizado."

        final_res = {
            "success": True, "history": history,
            "insights": {
                "average_total": avg,
                "last_margin": m,
                "trend": "upward" if last_v > 0 else "downward" if last_v < 0 else "stable",
                "message": msg
            }
        }
        _set_f29_cache(cache_key, final_res)
        return final_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
