import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from parsers.f29_plumber import parse_f29_pdf
from core.database import get_supabase

router = APIRouter(prefix="/f29", tags=["Formulario 29"])

class ProcessF29Request(BaseModel):
    storage_path: str
    org_id: str

class F29Response(BaseModel):
    success: bool
    data: Dict[str, Any] | None = None
    error: str | None = None

@router.post("/process", response_model=F29Response)
async def process_f29(payload: ProcessF29Request):
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
            raise HTTPException(status_code=422, detail=parse_result.get("error"))
            
        return F29Response(success=True, data=parse_result["data"])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fatal: {str(e)}")
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/analysis/history")
async def get_f29_history(organization_id: str, limit: int = 12):
    """
    Recupera el historial de F29 y calcula variaciones porcentuales (Tendencias).
    """
    db = get_supabase()
    
    try:
        result = db.table("f29_forms") \
            .select("*") \
            .eq("organization_id", organization_id) \
            .order("periodo", vertical=False) \
            .limit(limit) \
            .execute()
        
        data = result.data or []
        if not data:
            return {"success": True, "history": [], "trends": {}}

        # Ordenar por periodo ascendente para calcular variaciones
        data_sorted = sorted(data, key=lambda x: x["periodo"])
        
        history = []
        for i, current in enumerate(data_sorted):
            entry = {**current}
            if i > 0:
                prev = data_sorted[i-1]
                # Calcular variación de IVA a pagar
                curr_pay = current.get("total_a_pagar", 0)
                prev_pay = prev.get("total_a_pagar", 0)
                
                if prev_pay != 0:
                    entry["variation_pct"] = round(((curr_pay - prev_pay) / prev_pay) * 100, 2)
                else:
                    entry["variation_pct"] = 0
            else:
                entry["variation_pct"] = 0
            history.append(entry)

        # Insights de IA simulada (Tendencias)
        last_3 = history[-3:] if len(history) >= 3 else history
        avg_pay = sum(h["total_a_pagar"] for h in last_3) / len(last_3) if last_3 else 0
        
        return {
            "success": True, 
            "history": history,
            "insights": {
                "average_total": avg_pay,
                "trend": "upward" if history[-1]["variation_pct"] > 0 else "downward",
                "message": f"Las obligaciones tributarias han {'aumentado' if history[-1]['variation_pct'] > 0 else 'disminuido'} un {abs(history[-1]['variation_pct'])}% respecto al mes anterior."
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
