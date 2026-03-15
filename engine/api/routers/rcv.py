import csv
from datetime import date
from io import StringIO
from fastapi import APIRouter, HTTPException, UploadFile, File
from core.database import get_supabase
from typing import Optional, List, Dict, Any

router = APIRouter()

@router.post("/import-purchases")
async def import_purchases(organization_id: str, periodo: str, file: UploadFile = File(...)):
    """
    Importa el Registro de Compras (RCV) desde un archivo CSV del SII.
    """
    db = get_supabase()
    
    try:
        content = await file.read()
        text = content.decode("utf-8-sig") if content.startswith(b'\xef\xbb\xbf') else content.decode("iso-8859-1")
        
        f = StringIO(text)
        reader = csv.DictReader(f, delimiter=';')
        
        records = []
        for row in reader:
            row = {k.strip(): v for k, v in row.items()}
            
            try:
                tipo_docto = row.get("Tipo Doc") or row.get("Tipo Docto") or "33"
                rut_emisor = row.get("RUT Emisor") or row.get("RUT Proveedor") or ""
                monto_iva = row.get("Monto IVA") or row.get("Monto IVA Recuperable") or 0
                
                fecha_raw = row.get("Fecha Docto", "")
                fecha_db = fecha_raw
                if "/" in fecha_raw:
                    d, m, y = fecha_raw.split("/")
                    fecha_db = f"{y}-{m}-{d}"

                record = {
                    "organization_id": organization_id,
                    "periodo": periodo,
                    "tipo_documento": str(tipo_docto),
                    "folio": int(row.get("Folio") or 0),
                    "rut_emisor": rut_emisor,
                    "razon_social_emisor": row.get("Razon Social", ""),
                    "fecha_docto": fecha_db,
                    "monto_neto": int(row.get("Monto Neto") or 0),
                    "monto_exento": int(row.get("Monto Exento") or 0),
                    "monto_iva": int(monto_iva),
                    "monto_total": int(row.get("Monto Total") or 0)
                }
                records.append(record)
            except Exception:
                continue

        if not records:
            return {"success": False, "detail": "No se encontraron registros válidos"}

        db.table("purchase_records").upsert(records).execute()
        return {"success": True, "inserted": len(records), "periodo": periodo}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-sales")
async def import_sales(organization_id: str, periodo: str, file: UploadFile = File(...)):
    """
    Importa el Registro de Ventas (RCV) desde un archivo CSV del SII.
    """
    db = get_supabase()
    
    try:
        content = await file.read()
        text = content.decode("utf-8-sig") if content.startswith(b'\xef\xbb\xbf') else content.decode("iso-8859-1")
        
        f = StringIO(text)
        reader = csv.DictReader(f, delimiter=';')
        
        records = []
        for row in reader:
            row = {k.strip(): v for k, v in row.items()}
            try:
                tipo_docto = row.get("Tipo Doc") or row.get("Tipo Docto") or "33"
                rut_receptor = row.get("RUT Receptor") or row.get("RUT Cliente") or ""
                monto_iva = row.get("Monto IVA") or row.get("Monto IVA Recuperable") or 0
                
                fecha_raw = row.get("Fecha Docto", "")
                fecha_db = fecha_raw
                if "/" in fecha_raw:
                    d, m, y = fecha_raw.split("/")
                    fecha_db = f"{y}-{m}-{d}"

                record = {
                    "organization_id": organization_id,
                    "periodo": periodo,
                    "tipo_documento": str(tipo_docto),
                    "folio": int(row.get("Folio") or 0),
                    "rut_receptor": rut_receptor,
                    "razon_social_receptor": row.get("Razon Social", ""),
                    "fecha_docto": fecha_db,
                    "monto_neto": int(row.get("Monto Neto") or 0),
                    "monto_exento": int(row.get("Monto Exento") or 0),
                    "monto_iva": int(monto_iva),
                    "monto_total": int(row.get("Monto Total") or 0)
                }
                records.append(record)
            except Exception:
                continue

        if not records:
            return {"success": False, "detail": "No se encontraron registros válidos"}

        db.table("sales_records").upsert(records).execute()
        return {"success": True, "inserted": len(records), "periodo": periodo}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/top-vendors")
async def get_top_vendors(organization_id: str, periodo: Optional[str] = None):
    db = get_supabase()
    query = db.table("purchase_records").select("rut_emisor, razon_social_emisor, monto_total").eq("organization_id", organization_id)
    if periodo:
        query = query.eq("periodo", periodo)
    
    res = query.execute()
    data = res.data or []
    
    vendors: Dict[str, Dict[str, Any]] = {}
    for r in data:
        rut = r["rut_emisor"]
        if rut not in vendors:
            vendors[rut] = {"rut": rut, "nombre": r["razon_social_emisor"], "total": 0, "count": 0}
        vendors[rut]["total"] += r["monto_total"]
        vendors[rut]["count"] += 1
    
    sorted_vendors = sorted(vendors.values(), key=lambda x: x["total"], reverse=True)
    return sorted_vendors[:10]

@router.get("/analysis/top-customers")
async def get_top_customers(organization_id: str, periodo: Optional[str] = None):
    db = get_supabase()
    query = db.table("sales_records").select("rut_receptor, razon_social_receptor, monto_total").eq("organization_id", organization_id)
    if periodo:
        query = query.eq("periodo", periodo)
    
    res = query.execute()
    data = res.data or []
    
    customers: Dict[str, Dict[str, Any]] = {}
    for r in data:
        rut = r["rut_receptor"]
        if rut not in customers:
            customers[rut] = {"rut": rut, "nombre": r["razon_social_receptor"], "total": 0, "count": 0}
        customers[rut]["total"] += r["monto_total"]
        customers[rut]["count"] += 1
    
    sorted_customers = sorted(customers.values(), key=lambda x: x["total"], reverse=True)
    return sorted_customers[:10]
