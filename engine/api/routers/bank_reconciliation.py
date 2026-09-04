import time
import re
import io
import pandas as pd
from datetime import date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from core.database import get_supabase
from core.auth import verify_token
from core.logger import log_activity

router = APIRouter()

# ─── Sistema de Caché Interno para Conciliación ───────────────────────────
_bank_cache = {}
BANK_CACHE_TTL = 300 # 5 minutos

def _get_bank_cache(key: str):
    if key in _bank_cache:
        data, ts = _bank_cache[key]
        if time.time() - ts < BANK_CACHE_TTL: return data
    return None

def _set_bank_cache(key: str, data: Any):
    _bank_cache[key] = (data, time.time())

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

@router.post("/save-reconciliation")
async def save_reconciliation(req: ReconciliationSaveRequest, current_user: dict = Depends(verify_token)):
    """Guarda múltiples conciliaciones en lote y actualiza el estado de las líneas."""
    db = get_supabase()
    try:
        if not req.matches:
            return {"success": True, "message": "No hay coincidencias que guardar."}

        reconciliation_records = []
        for m in req.matches:
            reconciliation_records.append({
                "bank_line_id": m.bank_line_id,
                "journal_entry_line_id": m.journal_entry_line_id,
                "organization_id": req.organization_id,
                "match_type": "manual",
                "confidence_score": 1.0,
                "status": m.status,
                "notes": m.notes or "Conciliación manual."
            })

        res = db.table("bank_reconciliations").insert(reconciliation_records).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Error al guardar conciliaciones en base de datos")

        log_activity(
            action="save_reconciliation",
            organization_id=req.organization_id,
            user_id=current_user.get("id"),
            entity_type="bank_reconciliation",
            entity_id=req.organization_id,
            details={"count": len(req.matches)}
        )

        return {"success": True, "message": f"Se registraron {len(req.matches)} conciliaciones exitosamente."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/accounts")
async def get_bank_accounts(organization_id: str, current_user: dict = Depends(verify_token)):
    """Obtiene las cuentas bancarias de la empresa (Cacheado 5 min)."""
    cache_key = f"bank_accs_{organization_id}"
    cached = _get_bank_cache(cache_key)
    if cached: return cached

    db = get_supabase()
    try:
        res = db.table("bank_accounts").select("*").eq("organization_id", organization_id).execute()
        _set_bank_cache(cache_key, res.data)
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
    organization_id: str = "",
    bank_account_id: str = "",
    current_user: dict = Depends(verify_token)
):
    """
    Analiza una cartola bancaria. Optimizado con Vectorización Pandas.
    """
    if not organization_id or not bank_account_id:
        raise HTTPException(status_code=400, detail="Identificadores requeridos.")

    db = get_supabase()
    try:
        content = await file.read()
        filename = file.filename.lower()
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content), sep=None, engine='python')
        else:
            df = pd.read_excel(io.BytesIO(content))

        cols = {c.lower(): c for c in df.columns}
        def get_val(row, prefixes):
            for p in prefixes:
                if p.lower() in cols: return row[cols[p.lower()]]
            return ""

        stmt_res = db.table("bank_statements").insert({
            "organization_id": organization_id, "bank_account_id": bank_account_id,
            "period": str(date.today().replace(day=1)), "file_name": file.filename, "status": "processing"
        }).execute()
        stmt_id = stmt_res.data[0]["id"]

        rows = df.to_dict('records')
        lines_to_save = []
        for row in rows:
            m_val = get_val(row, ["Monto", "Importe", "Valor", "Amount"])
            try:
                if isinstance(m_val, str): m_val = re.sub(r'[^\d\-.]', '', m_val)
                m_float = float(m_val)
            except: m_float = 0.0

            lines_to_save.append({
                "statement_id": stmt_id, "bank_account_id": bank_account_id,
                "fecha": str(get_val(row, ["Fecha", "Date", "F. Operación"]) or date.today()),
                "descripcion": str(get_val(row, ["Descripcion", "Concepto", "Glosa", "Description"]) or "Sin glosa"),
                "monto": int(abs(m_float)), "tipo": "abono" if m_float >= 0 else "cargo",
                "referencia_bancaria": str(get_val(row, ["Referencia", "Documento", "Nº Doc."])),
                "is_reconciled": False
            })

        transactions = []
        if lines_to_save:
            res = db.table("bank_statement_lines").insert(lines_to_save).execute()
            transactions = res.data or []

        log_activity(
            action="upload_bank_statement", organization_id=organization_id, user_id=current_user.get("id"),
            entity_type="bank_statement", entity_id=stmt_id, details={"count": len(transactions)}
        )

        return {"success": True, "statement_id": stmt_id, "transactions": transactions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/matching/suggested/{organization_id}")
async def suggest_matches(organization_id: str, bank_account_id: str, current_user: dict = Depends(verify_token)):
    """Sugiere cruces entre cartola y contabilidad basándose en monto y proximidad temporal."""
    db = get_supabase()
    bank_lines = db.table("bank_statement_lines").select("*") \
        .eq("bank_account_id", bank_account_id).eq("is_reconciled", False).execute().data or []
    
    acc_res = db.table("bank_accounts").select("chart_account_id").eq("id", bank_account_id).single().execute()
    chart_id = acc_res.data.get("chart_account_id")

    journal_lines = db.table("journal_entry_lines").select("*, journal_entries(fecha, glosa)") \
        .eq("organization_id", organization_id).eq("account_id", chart_id).eq("is_reconciled", False).execute().data or []

    suggestions = []
    used_journal_ids = set()

    for b in bank_lines:
        b_monto = b["monto"]
        b_fecha = pd.to_datetime(b["fecha"])
        matched = False

        # 1. Matching Exacto
        for j in journal_lines:
            if j["id"] in used_journal_ids:
                continue
            j_monto = int(abs(float(j["monto"])))
            j_fecha = pd.to_datetime(j["journal_entries"]["fecha"])
            diff_days = abs((b_fecha - j_fecha).days)

            if b_monto == j_monto and diff_days <= 5:
                suggestions.append({
                    "bank_line": b,
                    "journal_line": j,
                    "match_type": "exact",
                    "confidence": "high" if diff_days <= 1 else "medium",
                    "fee_difference": 0
                })
                used_journal_ids.add(j["id"])
                matched = True
                break

        # 2. Smart Matching con Tolerancia de Comisión (ej: Transbank/Pasarelas 1% - 3.5%)
        if not matched and b.get("tipo") == "abono":
            for j in journal_lines:
                if j["id"] in used_journal_ids:
                    continue
                j_monto = int(abs(float(j["monto"])))
                j_fecha = pd.to_datetime(j["journal_entries"]["fecha"])
                diff_days = abs((b_fecha - j_fecha).days)

                if diff_days <= 4 and j_monto > b_monto:
                    diff_pct = (j_monto - b_monto) / j_monto
                    # Tolerancia típica de comisión de adquirencia
                    if 0.008 <= diff_pct <= 0.04:
                        fee = j_monto - b_monto
                        suggestions.append({
                            "bank_line": b,
                            "journal_line": j,
                            "match_type": "commission_adjusted",
                            "confidence": "medium",
                            "fee_difference": fee,
                            "estimated_fee_pct": round(diff_pct * 100, 2),
                            "notes": f"Abono neto con descuento estimado de comisión ({round(diff_pct * 100, 1)}% = ${fee:,.0f} CLP)"
                        })
                        used_journal_ids.add(j["id"])
                        break

    return suggestions

@router.get("/pending-lines/{bank_account_id}")
async def get_pending_bank_lines(bank_account_id: str, current_user: dict = Depends(verify_token)):
    """Obtiene movimientos bancarios cargados que aún no están conciliables."""
    db = get_supabase()
    try:
        res = db.table("bank_statement_lines").select("*") \
            .eq("bank_account_id", bank_account_id).eq("is_reconciled", False).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reconcile-with-adjustment")
async def reconcile_with_adjustment(req: Dict[str, Any], current_user: dict = Depends(verify_token)):
    """Crea un asiento de ajuste y concilia al mismo tiempo."""
    db = get_supabase()
    try:
        bank_line_id = req.get("bank_line_id")
        adjustment_account_code = req.get("account_code")
        adjustment_account_name = req.get("account_name", "Gasto/Comisión Bancaria")
        org_id = req.get("organization_id")

        if not bank_line_id or not adjustment_account_code or not org_id:
            raise HTTPException(status_code=400, detail="Faltan parámetros.")

        line = db.table("bank_statement_lines").select("*, bank_accounts(chart_account_id)") \
            .eq("id", bank_line_id).single().execute().data
        
        bank_chart_id = line.get("bank_accounts", {}).get("chart_account_id")
        bank_coa = db.table("chart_of_accounts").select("codigo, nombre").eq("id", bank_chart_id).single().execute().data
        
        monto = line["monto"]
        if line["tipo"] == "cargo":
            debe_acc, haber_acc = {"code": adjustment_account_code, "name": adjustment_account_name}, {"code": bank_coa["codigo"], "name": bank_coa["nombre"]}
        else:
            debe_acc, haber_acc = {"code": bank_coa["codigo"], "name": bank_coa["nombre"]}, {"code": adjustment_account_code, "name": adjustment_account_name}

        journal_lines = [
            {"cuenta_codigo": debe_acc["code"], "cuenta_nombre": debe_acc["name"], "tipo": "debe", "monto": monto},
            {"cuenta_codigo": haber_acc["code"], "cuenta_nombre": haber_acc["name"], "tipo": "haber", "monto": monto}
        ]

        journal_id = db.rpc("create_journal_entry_with_lines", {
            "p_organization_id": org_id, "p_fecha": line["fecha"], "p_glosa": f"Ajuste Bancario: {line['descripcion']}", "p_lines": journal_lines
        }).execute().data

        j_line_id = db.table("journal_entry_lines").select("id").eq("entry_id", journal_id).eq("account_id", bank_chart_id).single().execute().data["id"]

        db.table("bank_reconciliations").insert({
            "bank_line_id": bank_line_id, "journal_entry_line_id": j_line_id, "organization_id": org_id,
            "match_type": "automatic", "status": "reconciled", "notes": "Ajuste automático."
        }).execute()

        db.table("bank_statement_lines").update({"is_reconciled": True}).eq("id", bank_line_id).execute()
        
        log_activity(action="reconcile_with_adjustment", organization_id=org_id, user_id=current_user.get("id"), entity_type="bank_reconciliation", entity_id=journal_id)
        return {"success": True, "message": "Conciliado."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rules/{organization_id}")
async def get_mapping_rules(organization_id: str, current_user: dict = Depends(verify_token)):
    db = get_supabase()
    try:
        res = db.table("bank_mapping_rules").select("*").eq("organization_id", organization_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
