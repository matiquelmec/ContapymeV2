from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List, Optional
from datetime import date
import pandas as pd
import io
import re
import uuid
# Supuse que hay un módulo de base de datos o similar para interactuar con Supabase
# Como no lo veo claro en los archivos leídos, usaré un patrón genérico o buscaré el cliente de Supabase

router = APIRouter()

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
            # Lógica simple de parsing CSV (provisional)
            df = pd.read_csv(io.BytesIO(content), sep=None, engine='python')
            # Aquí iría la lógica específica de cada banco para mapear columnas
            # Por ahora devolvemos un mapeo genérico
            for index, row in df.iterrows():
                transactions.append({
                    "fecha": str(row.get("Fecha", "")),
                    "descripcion": str(row.get("Descripcion", "Sin descripción")),
                    "monto": abs(float(row.get("Monto", 0))),
                    "tipo": "abono" if float(row.get("Monto", 0)) >= 0 else "cargo",
                    "referencia": str(row.get("Referencia", ""))
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

@router.get("/rules/{organization_id}")
async def get_mapping_rules(organization_id: str):
    # Aquí iría la consulta a public.bank_mapping_rules
    return {"rules": []}
