from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date
import pandas as pd
import io
import re
from core.database import get_supabase
from core.auth import verify_token
from core.logger import log_activity

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
async def get_bank_accounts(organization_id: str, current_user: dict = Depends(verify_token)):
    """Obtiene las cuentas bancarias de la empresa."""
    db = get_supabase()
    try:
        res = db.table("bank_accounts").select("*").eq("organization_id", organization_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accounts")
async def create_bank_account(req: BankAccountRequest, current_user: dict = Depends(verify_token)):
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
    bank_account_id: Optional[str] = None,
    current_user: dict = Depends(verify_token)
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

        # REGISTRAR EN BITÁCORA (AUDIT LOG)
        log_activity(
            action="upload_bank_statement",
            organization_id=organization_id,
            user_id=current_user.get("id"),
            entity_type="bank_statement",
            entity_id=statement_id,
            details={
                "file_name": file.filename,
                "transactions_count": len(transactions)
            }
        )

        return {
            "success": True,
            "statement_id": statement_id,
            "transactions": transactions
        }
        
    except Exception as e:
        print(f"ERROR analyze_bank_statement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pending-lines/{bank_account_id}")
async def get_pending_bank_lines(bank_account_id: str, current_user: dict = Depends(verify_token)):
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

@router.post("/reconcile-with-adjustment")
async def reconcile_with_adjustment(req: Dict[str, Any], current_user: dict = Depends(verify_token)):
    """
    Crea un asiento de ajuste (ej: gasto bancario) y concilia al mismo tiempo.
    Evita que el contador tenga que salir de la pantalla de conciliación.
    """
    db = get_supabase()
    try:
        bank_line_id = req.get("bank_line_id")
        adjustment_account_code = req.get("account_code") # Ej: 5.1.05.001 (Gastos Bancarios)
        adjustment_account_name = req.get("account_name", "Gasto/Comisión Bancaria")
        org_id = req.get("organization_id")

        if not bank_line_id or not adjustment_account_code or not org_id:
            raise HTTPException(status_code=400, detail="Faltan parámetros requeridos.")

        # 1. Obtener datos de la línea de cartola y la cuenta banco vinculada
        line_res = db.table("bank_statement_lines") \
            .select("*, bank_accounts(chart_account_id, bank_name)") \
            .eq("id", bank_line_id) \
            .single() \
            .execute()
        
        line = line_res.data
        if not line:
            raise HTTPException(status_code=404, detail="Línea de cartola no encontrada.")

        bacc = line.get("bank_accounts", {})
        bank_chart_id = bacc.get("chart_account_id")
        
        # Necesitamos el CÓDIGO de la cuenta banco para el asiento
        bank_account_res = db.table("chart_of_accounts") \
            .select("codigo, nombre") \
            .eq("id", bank_chart_id) \
            .single() \
            .execute()
        
        bank_coa = bank_account_res.data
        if not bank_coa:
            raise HTTPException(status_code=400, detail="La cuenta bancaria no tiene una cuenta contable vinculada.")

        # 2. Definir lógica Debe/Haber (IFRS)
        # Si es CARGO en banco (salida de dinero): Gasto (Debe) contra Banco (Haber)
        # Si es ABONO en banco (entrada de dinero): Banco (Debe) contra Ingreso (Haber)
        monto = line["monto"]
        if line["tipo"] == "cargo":
            debe_acc = {"codigo": adjustment_account_code, "nombre": adjustment_account_name}
            haber_acc = {"codigo": bank_coa["codigo"], "nombre": bank_coa["nombre"]}
        else:
            debe_acc = {"codigo": bank_coa["codigo"], "nombre": bank_coa["nombre"]}
            haber_acc = {"codigo": adjustment_account_code, "nombre": adjustment_account_name}

        # 3. Preparar líneas del asiento
        journal_lines = [
            {"cuenta_codigo": debe_acc["codigo"], "cuenta_nombre": debe_acc["nombre"], "tipo": "debe", "monto": monto},
            {"cuenta_codigo": haber_acc["codigo"], "cuenta_nombre": haber_acc["nombre"], "tipo": "haber", "monto": monto}
        ]

        # 4. Inyectar Asiento vía RPC REUTILIZABLE
        journal_id = db.rpc("create_journal_entry_with_lines", {
            "p_organization_id": org_id,
            "p_fecha": line["fecha"],
            "p_glosa": f"Ajuste Bancario: {line['descripcion']}",
            "p_lines": journal_lines
        }).execute().data

        # 5. Obtener ID de la línea del asiento (asociaremos la línea del banco con la línea del banco en el asiento)
        # Buscamos la línea del asiento que corresponde a la cuenta BANCO (para conciliar contra ella)
        new_entry_lines = db.table("journal_entry_lines") \
            .select("id") \
            .eq("entry_id", journal_id) \
            .eq("cuenta_codigo", bank_coa["codigo"]) \
            .single() \
            .execute()
        
        journal_line_id = new_entry_lines.data["id"]

        # 6. Guardar Conciliación (Blindaje Maestro)
        db.table("bank_reconciliations").insert({
            "bank_line_id": bank_line_id,
            "journal_entry_line_id": journal_line_id,
            "organization_id": org_id,
            "match_type": "automatic",
            "status": "reconciled",
            "notes": f"Ajuste automático generado desde Conciliación Bancaria."
        }).execute()

        # 7. Marcar línea de cartola como conciliada
        db.table("bank_statement_lines").update({"is_reconciled": True}).eq("id", bank_line_id).execute()

        # REGISTRAR EN BITÁCORA (AUDIT LOG)
        log_activity(
            action="reconcile_with_adjustment",
            organization_id=org_id,
            user_id=current_user.get("id"),
            entity_type="bank_reconciliation",
            entity_id=journal_id,
            details={
                "bank_line_id": bank_line_id,
                "account_code": adjustment_account_code,
                "amount": monto
            }
        )

        return {
            "success": True,
            "journal_id": journal_id,
            "message": "Asiento de ajuste generado y conciliado exitosamente."
        }

    except Exception as e:
        print(f"ERROR reconcile_with_adjustment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rules/{organization_id}")
async def get_mapping_rules(organization_id: str, current_user: dict = Depends(verify_token)):
    """Consulta las reglas de pre-mapeo inteligente."""
    db = get_supabase()
    try:
        res = db.table("bank_mapping_rules").select("*").eq("organization_id", organization_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
