from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date
import pandas as pd
import io
import re
import uuid
from core.database import get_supabase

router = APIRouter()

class ReconcileMatch(BaseModel):
    bank_statement_line_id: Optional[str] = None
    journal_entry_line_id: str
    organization_id: str
    status: str = "matched"
    notes: Optional[str] = None

class ReconciliationSaveRequest(BaseModel):
    matches: List[ReconcileMatch]
    organization_id: str

@router.post("/analyze")
async def analyze_bank_statement(
    file: UploadFile = File(...),
    bank_account_id: Optional[str] = None
):
    """
    Analiza una cartola bancaria y extrae los movimientos.
    Soporta formatos CSV y TXT (BCI, Chile, Santander).
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        transactions = []
        
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content), sep=None, engine='python')
            # Mapeo inteligente de columnas (Case-insensitive)
            cols = {c.lower(): c for c in df.columns}
            
            def get_val(prefixes, default=""):
                for p in prefixes:
                    if p.lower() in cols:
                        return row.get(cols[p.lower()], default)
                return default

            for index, row in df.iterrows():
                monto_val = get_val(["Monto", "Importe", "Valor", "Amount"], 0)
                try:
                    monto_float = float(monto_val)
                except:
                    monto_float = 0

                transactions.append({
                    "fecha": str(get_val(["Fecha", "Date", "F. Operación"])),
                    "descripcion": str(get_val(["Descripcion", "Concepto", "Glosa", "Description"], "Sin descripción")),
                    "monto": abs(monto_float),
                    "tipo": "abono" if monto_float >= 0 else "cargo",
                    "referencia": str(get_val(["Referencia", "Documento", "Nº Doc.", "Ref"]))
                })
        
        elif filename.endswith(".pdf"):
            # Aquí integraríamos pdfplumber + IA (Gemini/Claude)
            # Por ahora lanzamos error de "En desarrollo" para esta fase
            raise HTTPException(status_code=501, detail="El análisis de PDF está en fase de blindaje con IA. Use CSV por ahora.")
            
        return {
            "success": True,
            "filename": file.filename,
            "transactions": transactions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando cartola: {str(e)}")

@router.post("/save-reconciliation")
async def save_reconciliation(req: ReconciliationSaveRequest):
    """
    Guarda masivamente los resultados del cruce en la tabla bank_reconciliations.
    Identifica cada vínculo entre movimiento bancario y asiento contable.
    """
    db = get_supabase()
    try:
        # Por ahora guardamos solo el ID contable vinculado. 
        # En una fase posterior guardaremos también el ID de la línea de cartola persistente.
        data_to_insert = []
        for match in req.matches:
            data_to_insert.append({
                "journal_entry_line_id": match.journal_entry_line_id,
                "organization_id": req.organization_id,  # Vinculación por ID de Empresa
                "status": match.status or "reconciled",
                "notes": match.notes or f"Conciliación automática V2 - {date.today()}",
                "match_type": "automatic" if match.status == 'reconciled' else "manual"
            })
            
        if not data_to_insert:
            return {"success": True, "count": 0}

        # Insertar en Supabase
        db.table("bank_reconciliations").insert(data_to_insert).execute()
        
        return {
            "success": True, 
            "message": f"Se han auditado {len(data_to_insert)} movimientos exitosamente."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error guardando conciliación: {str(e)}")

@router.get("/rules/{organization_id}")
async def get_mapping_rules(organization_id: str):
    # Aquí iría la consulta a public.bank_mapping_rules
    return {"rules": []}
