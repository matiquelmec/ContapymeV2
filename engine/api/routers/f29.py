import os
import shutil
import time
import calendar
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from parsers.f29_plumber import parse_f29_pdf
from core.database import get_supabase
from core.auth import verify_token
from core.logger import log_activity, log_system_error
from api.routers.accounting import get_accounting_config

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

class AuditF29Request(BaseModel):
    organization_id: str
    periodo: str

@router.post("/audit-against-rcv")
async def audit_f29_against_rcv(payload: AuditF29Request, current_user: dict = Depends(verify_token)):
    """
    Auditoría Preventiva F29 ↔ RCV (Pre-SII Shield).
    Cruza el formulario declarado contra las ventas y compras reales registradas.
    """
    db = get_supabase()
    org_id = payload.organization_id
    periodo = payload.periodo # ej: '2026-05'

    # 1. Obtener F29 declarado
    f29_res = db.table("f29_forms").select("*").eq("organization_id", org_id).eq("periodo", periodo).maybe_single().execute()
    f29 = f29_res.data

    # 2. Fechas del periodo
    start_date = f"{periodo}-01"
    parts = periodo.split("-")
    last_day = calendar.monthrange(int(parts[0]), int(parts[1]))[1]
    end_date = f"{periodo}-{last_day}"

    # 3. Ventas y Compras reales del RCV
    sales_res = db.table("sales_records") \
        .select("monto_neto, monto_iva, monto_total") \
        .eq("organization_id", org_id) \
        .gte("fecha_docto", start_date) \
        .lte("fecha_docto", end_date) \
        .execute()

    purchases_res = db.table("purchase_records") \
        .select("monto_neto, monto_iva, monto_total, monto_iva_recuperable") \
        .eq("organization_id", org_id) \
        .gte("fecha_docto", start_date) \
        .lte("fecha_docto", end_date) \
        .execute()

    rcv_sales_net = sum(int(s.get("monto_neto") or 0) for s in (sales_res.data or []))
    rcv_sales_iva = sum(int(s.get("monto_iva") or 0) for s in (sales_res.data or []))

    rcv_purch_net = sum(int(p.get("monto_neto") or 0) for p in (purchases_res.data or []))
    rcv_purch_iva = sum(int(p.get("monto_iva_recuperable") or p.get("monto_iva") or 0) for p in (purchases_res.data or []))

    f29_sales_net = int(f29.get("ventas_netas") or 0) if f29 else 0
    f29_debito = int(f29.get("debito_fiscal") or 0) if f29 else 0
    f29_credito = int(f29.get("credito_fiscal") or 0) if f29 else 0
    f29_total_pagar = int(f29.get("total_a_pagar") or 0) if f29 else 0

    diff_sales_net = f29_sales_net - rcv_sales_net
    diff_debito = f29_debito - rcv_sales_iva
    diff_credito = f29_credito - rcv_purch_iva

    # Diagnóstico de Riesgo Fiscal
    risk_level = "CONSISTENT"
    risk_notes = []

    if not f29:
        risk_level = "PENDING_F29"
        risk_notes.append("No se registra F29 subido para este período en el sistema.")
    else:
        if abs(diff_debito) > 5000:
            risk_level = "HIGH_RISK"
            risk_notes.append(f"Discrepancia en Débito Fiscal: ${diff_debito:,.0f} CLP respecto al RCV emitido.")
        if abs(diff_credito) > 5000:
            if risk_level != "HIGH_RISK": risk_level = "MEDIUM_RISK"
            risk_notes.append(f"Discrepancia en Crédito Fiscal: ${diff_credito:,.0f} CLP respecto al RCV de compras.")
        if abs(diff_sales_net) > 10000:
            risk_notes.append(f"Diferencia en Ventas Netas: ${diff_sales_net:,.0f} CLP.")

    if not risk_notes:
        risk_notes.append("Consistencia total (100% Match): Débitos y Créditos coinciden exactamente con el RCV.")

    return {
        "success": True,
        "periodo": periodo,
        "f29_declared": {
            "ventas_netas": f29_sales_net,
            "debito_fiscal": f29_debito,
            "credito_fiscal": f29_credito,
            "total_a_pagar": f29_total_pagar,
        },
        "rcv_actual": {
            "ventas_netas": rcv_sales_net,
            "debito_fiscal": rcv_sales_iva,
            "credito_fiscal": rcv_purch_iva,
            "purchases_net": rcv_purch_net
        },
        "variance": {
            "sales_net": diff_sales_net,
            "debito_fiscal": diff_debito,
            "credito_fiscal": diff_credito
        },
        "audit": {
            "risk_level": risk_level, # CONSISTENT, MEDIUM_RISK, HIGH_RISK, PENDING_F29
            "notes": risk_notes
        }
    }

@router.delete("/{organization_id}/{f29_id}")
async def delete_f29_record(organization_id: str, f29_id: str, current_user: dict = Depends(verify_token)):
    db = get_supabase()
    
    # 1. Obtener Periodo
    f29_check = db.table("f29_forms").select("periodo").eq("id", f29_id).eq("organization_id", organization_id).execute()
    periodo_info = f29_check.data[0] if f29_check.data else None

    # 2. Borrar Formulario
    res = db.table("f29_forms").delete().eq("id", f29_id).eq("organization_id", organization_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Registro de F29 no encontrado.")

    # 3. Purgar Asiento Contable Diario y Mayor (Cascada Lógica Inmediata usando accounting_events)
    if periodo_info:
        periodo = periodo_info["periodo"]
        event_res = db.table("accounting_events").select("id").eq("organization_id", organization_id).eq("event_type", "F29").eq("source_id", periodo).eq("status", "active").execute()
        if event_res.data:
            event_id = event_res.data[0]["id"]
            old_entries = db.table("journal_entries").select("id").eq("organization_id", organization_id).eq("event_id", event_id).execute()
            for e in (old_entries.data or []):
                db.table("journal_entry_lines").delete().eq("entry_id", e["id"]).execute()
                db.table("journal_entries").delete().eq("id", e["id"]).execute()
            db.table("accounting_events").delete().eq("id", event_id).execute()

    return {"success": True, "message": "F29 y su reversión del Asiento Diario/Mayor eliminados sincronizadamente."}

@router.delete("/{f29_id}")
async def delete_f29_record_by_id(f29_id: str, current_user: dict = Depends(verify_token)):
    """Ruta de compatibilidad para borrado directo con ID resolviendo organización del registro"""
    db = get_supabase()
    f29_check = db.table("f29_forms").select("organization_id, periodo").eq("id", f29_id).execute()
    if not f29_check.data:
        raise HTTPException(status_code=404, detail="Registro de F29 no encontrado.")
    org_id = f29_check.data[0]["organization_id"]
    return await delete_f29_record(organization_id=org_id, f29_id=f29_id, current_user=current_user)

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


class CentralizeF29Request(BaseModel):
    org_id: str
    periodo: str  # YYYY-MM

@router.post("/centralize")
async def centralize_f29(req: CentralizeF29Request, current_user: dict = Depends(verify_token)):
    """
    Centraliza automáticamente el F29 en el Libro Mayor.
    Genera el Asiento Contable Provisión F29 idempóticamente.
    """
    db = get_supabase()
    
    try:
        # 1. Obtener los datos del formulario y la configuración contable
        res = db.table("f29_forms").select("*").eq("organization_id", req.org_id).eq("periodo", req.periodo).execute()
        f29 = res.data[0] if res.data else None
        if not f29:
            raise Exception("No se encontró el formulario para este periodo.")

        # Obtener Configuración Dinámica (Fase 3 Auditoría: Des-hardcoding)
        config = get_accounting_config(db, req.org_id, "f29", "generic") or {}

        debito = int(f29.get("debito_fiscal") or 0)
        credito = int(f29.get("credito_fiscal") or 0)
        ppm = int(f29.get("ppm_neto") or 0)
        retenciones = int(f29.get("retencion_honorarios") or 0)
        total_pagar = int(f29.get("total_a_pagar") or 0)

        journal_lines = []

        # Lógica de compensación de IVA
        iva_compensado = min(debito, credito)
        
        # Reconocer el Débito del mes para limpiarlo (Viene del Pasivo)
        if debito > 0:
            journal_lines.append({
                "cuenta_codigo": config.get("tax_iva_debito_code", "2.1.04.002"), 
                "cuenta_nombre": config.get("tax_iva_debito_name", "IVA Débito Fiscal"), 
                "tipo": "debe", "monto": debito
            })
        
        # Eliminar el Crédito Fiscal utilizado (Activo)
        if iva_compensado > 0:
            journal_lines.append({
                "cuenta_codigo": config.get("tax_iva_credito_code", "1.1.07.002"), 
                "cuenta_nombre": config.get("tax_iva_credito_name", "IVA Crédito Fiscal"), 
                "tipo": "haber", "monto": iva_compensado
            })

        # PPM a favor (Activo nace o crece)
        if ppm > 0:
            journal_lines.append({
                "cuenta_codigo": config.get("tax_ppm_code", "1.1.07.001"), 
                "cuenta_nombre": config.get("tax_ppm_name", "PPM Pagado (Por Recuperar)"), 
                "tipo": "debe", "monto": ppm
            })

        # Retenciones de boletas consolidadas en el mes (las provisionamos)
        if retenciones > 0:
            journal_lines.append({
                "cuenta_codigo": config.get("tax_retentions_code", "2.1.04.007"), 
                "cuenta_nombre": config.get("tax_retentions_name", "Retenciones Honorarios"), 
                "tipo": "debe", "monto": retenciones
            })

        # Finalmente, el Pago a Tesorería o Pasivo Resumido (Haber final para balancear)
        total_debe = sum(l["monto"] for l in journal_lines if l["tipo"] == "debe")
        total_haber = sum(l["monto"] for l in journal_lines if l["tipo"] == "haber")
        
        monto_f29_por_pagar = total_debe - total_haber
        
        if monto_f29_por_pagar > 0:
            journal_lines.append({
                "cuenta_codigo": config.get("tax_f29_payable_code", "2.1.04.009"), 
                "cuenta_nombre": config.get("tax_f29_payable_name", "F29 y Otros Impuestos por Pagar"), 
                "tipo": "haber", "monto": monto_f29_por_pagar
            })
        elif monto_f29_por_pagar < 0:
            journal_lines.append({
                "cuenta_codigo": config.get("tax_iva_remanente_code", "1.1.07.002"), # Fallback al crédito fiscal
                "cuenta_nombre": config.get("tax_iva_remanente_name", "Remanente Tributario a Favor"), 
                "tipo": "debe", "monto": abs(monto_f29_por_pagar)
            })

        # 2. Fecha del Asiento (Último día del mes tributario)
        parts = req.periodo.split("-")
        last_day = calendar.monthrange(int(parts[0]), int(parts[1]))[1]
        fecha_asiento = f"{req.periodo}-{last_day}"
        glosa = f"Centralización e Impuestos F29 Periodo {req.periodo}"

        # 3. IDEMPOTENCIA: Obtener o crear el evento de negocio y purgar el asiento anterior
        from core.accounting_events import get_or_create_accounting_event
        event_id = get_or_create_accounting_event(db, req.org_id, "F29", req.periodo, notes="Provisión e Impuestos F29")

        old_entries = db.table("journal_entries").select("id").eq("organization_id", req.org_id).eq("event_id", event_id).execute()
        for e in (old_entries.data or []):
            db.table("journal_entry_lines").delete().eq("entry_id", e["id"]).execute()
            db.table("journal_entries").delete().eq("id", e["id"]).execute()

        # 4. Inyectar nuevo Asiento
        rpc_res = db.rpc("create_journal_entry_with_lines", {
            "p_organization_id": req.org_id,
            "p_fecha": fecha_asiento,
            "p_glosa": glosa,
            "p_lines": journal_lines
        }).execute()

        # 5. Marcar DNA del Asiento vinculando el event_id
        journal_entry_id = rpc_res.data
        if journal_entry_id:
            db.table("journal_entries") \
                .update({"event_id": event_id}) \
                .eq("id", journal_entry_id) \
                .execute()

        return {"success": True, "message": "Provisión F29 centralizada exitosamente en el Libro Mayor."}

    except Exception as e:
        log_system_error(category="F29_CENTRALIZE", message=str(e), organization_id=req.org_id)
        raise HTTPException(status_code=500, detail=str(e))

