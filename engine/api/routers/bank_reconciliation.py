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

class BankAccountRequest(BaseModel):
    bank_name: str
    account_number: str
    account_type: str = "corriente"
    chart_account_id: Optional[str] = None
    organization_id: str

class ReconcileMatch(BaseModel):
    bank_line_id: str
    journal_entry_line_id: str
    organization_id: str
    status: str = "matched"
    notes: Optional[str] = None

class ReconciliationSaveRequest(BaseModel):
    matches: List[ReconcileMatch]
    organization_id: str

@router.get("/accounts")
async def get_bank_accounts(organization_id: str):
    """Obtiene las cuentas bancarias de la empresa."""
    db = get_supabase()
    try:
        res = db.table("bank_accounts").select("*").eq("organization_id", organization_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accounts")
async def create_bank_account(req: BankAccountRequest):
    """Registra una nueva cuenta bancaria."""
    db = get_supabase()
    try:
        res = db.table("bank_accounts").insert(req.dict()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Error al crear cuenta bancaria")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_bank_statement(
    file: UploadFile = File(...),
    organization_id: Optional[str] = None,
    bank_account_id: Optional[str] = None
):
    """
    Analiza una cartola bancaria, la persiste en la DB y extrae movimientos para el cruce.
    """
    if not organization_id or not bank_account_id:
        raise HTTPException(status_code=400, detail="organization_id y bank_account_id son requeridos para persistencia.")

    db = get_supabase()
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        transactions = []
        df = None
        
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content), sep=None, engine='python')
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Use CSV o Excel.")

        # Mapeo inteligente de columnas
        cols = {c.lower(): c for c in df.columns}
        def get_val(row, prefixes, default=""):
            for p in prefixes:
                if p.lower() in cols:
                    return row[cols[p.lower()]]
            return default

        # 1. Crear el registro de la cartola (Statement Metadata)
        statement_res = db.table("bank_statements").insert({
            "organization_id": organization_id,
            "bank_account_id": bank_account_id,
            "period": date.today().replace(day=1), # Simplificado al mes actual
            "file_name": file.filename,
            "status": "processing"
        }).execute()
        
        statement_id = statement_res.data[0]["id"] if statement_res.data else None

        # 2. Preparar líneas para inserción masiva
        lines_to_save = []
        for _, row in df.iterrows():
            monto_val = get_val(row, ["Monto", "Importe", "Valor", "Amount"], 0)
            try:
                # Limpiar formatos de moneda si vienen como string (ej: "$ 1.250")
                if isinstance(monto_val, str):
                    monto_val = re.sub(r'[^\d\-.]', '', monto_val)
                monto_float = float(monto_val)
            except:
                monto_float = 0

            lines_to_save.append({
                "statement_id": statement_id,
                "bank_account_id": bank_account_id,
                "fecha": str(get_val(row, ["Fecha", "Date", "F. Operación"], date.today())),
                "descripcion": str(get_val(row, ["Descripcion", "Concepto", "Glosa", "Description"], "Sin descripción")),
                "monto": int(abs(monto_float)),
                "tipo": "abono" if monto_float >= 0 else "cargo",
                "referencia_bancaria": str(get_val(row, ["Referencia", "Documento", "Nº Doc.", "Ref"])),
                "is_reconciled": False
            })

        if lines_to_save:
            # Insertar y recuperar con IDs para el frontend
            insert_res = db.table("bank_statement_lines").insert(lines_to_save).execute()
            transactions = insert_res.data or []

        return {
            "success": True,
            "statement_id": statement_id,
            "transactions": transactions
        }
        
    except Exception as e:
        print(f"ERROR analyze_bank_statement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pending-lines/{bank_account_id}")
async def get_pending_bank_lines(bank_account_id: str):
    """Obtiene movimientos bancarios cargados que aún no están conciliables."""
    db = get_supabase()
    try:
        res = db.table("bank_statement_lines") \
            .select("*") \
            .eq("bank_account_id", bank_account_id) \
            .eq("is_reconciled", False) \
            .execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save-reconciliation")
async def save_reconciliation(req: ReconciliationSaveRequest):
    """
    Persistencia de cruce: bank_line_id <-> journal_entry_line_id.
    """
    db = get_supabase()
    try:
        data_to_insert = []
        bank_line_ids = []
        
        for match in req.matches:
            data_to_insert.append({
                "bank_line_id": match.bank_line_id,
                "journal_entry_line_id": match.journal_entry_line_id,
                "organization_id": req.organization_id,
                "match_type": "automatic" if match.status == 'matched' else "manual",
                "status": "reconciled",
                "notes": match.notes or f"Autoconciliación V2 — {date.today()}"
            })
            bank_line_ids.append(match.bank_line_id)
            
        if not data_to_insert:
            return {"success": True, "count": 0}

        # 1. Guardar en tabla de conciliaciones
        db.table("bank_reconciliations").insert(data_to_insert).execute()
        
        # 2. Marcar líneas de cartola como conciliadas
        if bank_line_ids:
            db.table("bank_statement_lines").update({"is_reconciled": True}).in_("id", bank_line_ids).execute()
        
        return {
            "success": True, 
            "message": f"Se han blindado {len(data_to_insert)} movimientos exitosamente."
        }
        
    except Exception as e:
        print(f"ERROR save_reconciliation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rules/{organization_id}")
async def get_mapping_rules(organization_id: str):
    """Consulta las reglas de pre-mapeo inteligente."""
    db = get_supabase()
    try:
        res = db.table("bank_mapping_rules").select("*").eq("organization_id", organization_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
