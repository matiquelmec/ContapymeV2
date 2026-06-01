import csv
import time
import uuid
from io import StringIO
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from core.database import get_supabase
from core.auth import verify_token, verify_org_role
from core.logger import log_activity, log_system_error
from typing import Optional, List, Dict, Any

router = APIRouter()

# ─── Sistema de Caché Interno para Análisis RCV ───────────────────────────
_rcv_analysis_cache = {}
RCV_CACHE_TTL = 1 # Reducido a 1s para asegurar datos frescos en depuración

def _get_rcv_cache(key: str):
    if key in _rcv_analysis_cache:
        data, ts = _rcv_analysis_cache[key]
        if time.time() - ts < RCV_CACHE_TTL: return data
    return None

def _set_rcv_cache(key: str, data: Any):
    _rcv_analysis_cache[key] = (data, time.time())

def _clear_rcv_cache(organization_id: str):
    """Limpia todo el cache analítico de una organización específica."""
    keys_to_del = [k for k in _rcv_analysis_cache.keys() if organization_id in k]
    for k in keys_to_del: del _rcv_analysis_cache[k]

# ==========================================
# CONSTANTES SII — Tipos de Documento
# ==========================================
DOCUMENT_TYPES_NAMES = {
    '33': 'Factura Electrónica',
    '34': 'Factura Exenta',
    '39': 'Boleta Electrónica',
    '41': 'Boleta Exenta',
    '45': 'Factura de Compra',
    '46': 'Factura de Compra Elect.',
    '56': 'Nota de Débito',
    '61': 'Nota de Crédito',
    '110': 'Factura Exportación',
    '111': 'Nota de Débito Export.',
    '112': 'Nota de Crédito Export.'
}

DOCUMENT_TYPES_SUMA = {'33', '34', '39', '41', '43', '45', '46', '56', '110', '111'}
DOCUMENT_TYPES_RESTA = {'61', '112'}

def _calcular_monto(monto_neto: Optional[int], monto_exento: Optional[int], tipo_doc: str) -> tuple[int, bool]:
    monto_base = (monto_neto or 0) + (monto_exento or 0)
    if tipo_doc in DOCUMENT_TYPES_RESTA: return (-monto_base, False)
    return (monto_base, True)

def _normalizar_fecha(fecha_raw: str) -> Optional[str]:
    if not fecha_raw: return None
    fecha_raw = str(fecha_raw).strip()
    if not fecha_raw: return None
    if "/" in fecha_raw:
        try:
            p = fecha_raw.split("/")
            if len(p) == 3:
                if len(p[2]) == 4: return f"{p[2]}-{p[1].zfill(2)}-{p[0].zfill(2)}"
                elif len(p[0]) == 4: return f"{p[0]}-{p[1].zfill(2)}-{p[2].zfill(2)}"
        except: pass
    return fecha_raw if len(fecha_raw) == 10 else None # Garantiza formato YYYY-MM-DD

def _extraer_rut_nombre_archivo(filename: str) -> Optional[str]:
    import re
    match = re.search(r'(\d{1,2}(?:\.?\d{3}){2}-[\dkK])', filename)
    return match.group(1).replace(".", "") if match else None

def _formatear_rut(rut: str) -> str:
    if not rut: return ""
    # Estandarizamos a 12345678-K (Sin puntos, con guion) para matchear DB
    clean = str(rut).replace(".", "").replace("-", "").strip().upper()
    if len(clean) < 2: return clean
    return f"{clean[:-1]}-{clean[-1]}"

def _get_val(row_clean: dict, key: str, default: any = "") -> any:
    aliases = {
        "tipo_doc": ["tipo doc", "tipo docto", "tipo documento", "código", "t_doc", "tipo_doc"],
        "folio": ["folio", "nro folio", "número", "n° documento", "nro docto", "nro documento"],
        "rut_emisor": ["rut emisor", "rut proveedor", "emisor", "rut_emisor", "rut_proveedor"],
        "rut_receptor": ["rut receptor", "rut cliente", "receptor", "comprador", "rut_receptor", "rut_cliente"],
        "razon_social": ["razon social", "razón social", "nombre", "nombre emisor", "nombre receptor"],
        "fecha": ["fecha docto", "fecha emisión", "fecha", "fecha_doc", "fecha documento"],
        "neto": ["monto neto", "neto", "monto_neto"],
        "exento": ["monto exento", "exento", "monto_exento"],
        "iva": ["monto iva", "iva", "iva recuperable", "monto_iva"],
        "total": ["monto total", "total", "monto_total"]
    }
    row_lower = {str(k).lower().strip(): v for k, v in row_clean.items()}
    targets = aliases.get(key, [key])
    for target in targets:
        if target.lower() in row_lower: 
            return row_lower[target.lower()]
    return default

def _dedup_records(records: List[Dict[str, Any]], key_fields: tuple) -> List[Dict[str, Any]]:
    """Colapsa filas con la misma clave de conflicto (gana la última ocurrencia).

    Evita el error 21000 de Postgres ('ON CONFLICT DO UPDATE command cannot affect
    row a second time') cuando el archivo del SII trae folios repetidos dentro del
    mismo tipo de documento (típicamente filas de resumen con folio 0) o documentos
    duplicados. La clave debe coincidir EXACTAMENTE con la constraint del on_conflict.
    """
    deduped: Dict[tuple, Dict[str, Any]] = {}
    for r in records:
        k = tuple(r.get(f) for f in key_fields)
        deduped[k] = r
    return list(deduped.values())

def _to_int(val: any) -> int:
    if not val: return 0
    if isinstance(val, (int, float)): return int(val)
    # Limpieza de formato (eliminar puntos de miles de Chile, espacios y signos)
    s = str(val).strip().split(',')[0].replace(".", "").replace("$", "").replace(" ", "")
    try: return int(s)
    except: return 0

@router.post("/import-purchases")
async def import_purchases(
    organization_id: str, 
    periodo: str, 
    force: bool = False, 
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    try:
        if not periodo or periodo == "undefined" or len(periodo) < 6:
            raise HTTPException(status_code=400, detail="Error de Protocolo SII: Periodo inválido o no seleccionado.")
        
        if len(periodo) == 6: periodo = f"{periodo[:4]}-{periodo[4:]}-01"
        elif len(periodo) == 7: periodo = f"{periodo}-01"

        org_res = db.table("organizations").select("rut_empresa").eq("id", organization_id).single().execute()
        org_rut = _formatear_rut(org_res.data.get("rut_empresa")) if org_res.data else None
        
        file_rut = _extraer_rut_nombre_archivo(file.filename)
        if file_rut and org_rut:
            if _formatear_rut(file_rut) != org_rut:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Carga Bloqueada: El archivo pertenece al RUT {file_rut}, pero la empresa activa tiene registrado el RUT {org_res.data.get('rut_empresa') or 'No Configurado'}."
                )
        elif not org_rut:
             raise HTTPException(status_code=400, detail="Carga bloqueada: La empresa seleccionada no tiene un RUT configurado. Por favor, complete la configuración de la empresa.")


        if not force:
            existing = db.table("rcv_imports").select("id").eq("organization_id", organization_id).eq("periodo", periodo).eq("tipo", "purchases").gt("total_docs", 0).execute()
            if existing.data: raise HTTPException(status_code=400, detail="YA EXISTE una carga validada.")

        content = await file.read()
        storage_path = f"rcv/{organization_id}/{periodo}_compras_{int(time.time())}.csv"
        db.storage.from_("tax_documents").upload(storage_path, content)
        
        # 1. Crear o Actualizar el Lote de Importación (Evita error 23505 Duplicate Key)
        import_data = {
            "organization_id": organization_id, "periodo": periodo, "tipo": "purchases",
            "file_name": file.filename, "storage_path": storage_path, "total_docs": 0, "failed_docs": 0
        }
        
        # Buscar lote existente para el mismo periodo y tipo
        existing_import = db.table("rcv_imports").select("id")\
            .eq("organization_id", organization_id).eq("periodo", periodo).eq("tipo", "purchases").execute()
        
        if existing_import.data:
            import_id = existing_import.data[0]["id"]
            db.table("rcv_imports").update(import_data).eq("id", import_id).execute()
        else:
            import_id = str(uuid.uuid4())
            import_data["id"] = import_id
            db.table("rcv_imports").insert(import_data).execute()

        # 1. Detección Inteligente de Delimitador y Codificación
        text = content.decode("utf-8-sig") if content.startswith(b'\xef\xbb\xbf') else content.decode("iso-8859-1")
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        if not lines: return {"success": True, "count": 0}

        # Encontrar la línea que parece ser el cabezal (skip titles if any)
        header_idx = 0
        for idx, line in enumerate(lines[:10]):
            line_up = line.upper()
            if "TIPO" in line_up or "FOLIO" in line_up or "RUT" in line_up:
                header_idx = idx
                break
        
        header_line = lines[header_idx]
        delim = ';' if header_line.count(';') >= header_line.count(',') else ','
        
        # 2. Iniciar Reader desde la línea de cabeceras
        f = StringIO("\n".join(lines[header_idx:]))
        reader = csv.DictReader(f, delimiter=delim)

        records = []
        errors = []
        for i, row in enumerate(reader, 2):
            row_clean = {str(k).strip(): str(v).strip() if v else "" for k, v in row.items() if k is not None}
            try:
                tipo = _get_val(row_clean, "tipo_doc", "33")
                monto_neto = _to_int(_get_val(row_clean, "neto", 0))
                monto_exento = _to_int(_get_val(row_clean, "exento", 0))
                m_calc, es_suma = _calcular_monto(monto_neto, monto_exento, str(tipo))
                
                records.append({
                    "organization_id": organization_id, 
                    "periodo": periodo, 
                    "tipo_documento": str(tipo),
                    "folio": _to_int(_get_val(row_clean, "folio", 0)), 
                    "rut_emisor": _formatear_rut(_get_val(row_clean, "rut_emisor", "")),
                    "razon_social_emisor": _get_val(row_clean, "razon_social", ""), 
                    "fecha_docto": _normalizar_fecha(_get_val(row_clean, "fecha", "")),
                    "monto_neto": monto_neto, 
                    "monto_exento": monto_exento, 
                    "monto_iva": _to_int(_get_val(row_clean, "iva", 0)),
                    "monto_total": _to_int(_get_val(row_clean, "total", 0)), 
                    "monto_calculado": m_calc, 
                    "es_suma": es_suma, 
                    "import_id": import_id
                })
            except Exception as e: errors.append(f"Fila {i}: {str(e)}")

        if errors:
            db.table("rcv_imports").update({"error_log": errors[:50]}).eq("id", import_id).execute()
            raise HTTPException(status_code=422, detail=f"Errores en filas: {errors[:3]}")

        if records:
            records = _dedup_records(records, ("organization_id", "tipo_documento", "folio", "rut_emisor"))
            db.table("purchase_records").upsert(records, on_conflict="organization_id,tipo_documento,folio,rut_emisor").execute()
            _clear_rcv_cache(organization_id)
        
        db.table("rcv_imports").update({"total_docs": len(records)}).eq("id", import_id).execute()
        
        res_suma = len([r for r in records if r.get("es_suma")])
        res_resta = len(records) - res_suma
        
        return {
            "success": True, 
            "inserted": len(records),
            "tipo_suma": res_suma,
            "tipo_resta": res_resta
        }
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-sales")
async def import_sales(
    organization_id: str, 
    periodo: str, 
    force: bool = False, 
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    try:
        if not periodo or periodo == "undefined" or len(periodo) < 6:
            raise HTTPException(status_code=400, detail="Error de Protocolo SII: Periodo inválido o no seleccionado.")
        
        if len(periodo) == 6: periodo = f"{periodo[:4]}-{periodo[4:]}-01"
        elif len(periodo) == 7: periodo = f"{periodo}-01"

        org_res = db.table("organizations").select("rut_empresa").eq("id", organization_id).single().execute()
        org_rut = _formatear_rut(org_res.data.get("rut_empresa")) if org_res.data else None
        
        file_rut = _extraer_rut_nombre_archivo(file.filename)
        if file_rut and org_rut:
            if _formatear_rut(file_rut) != org_rut:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Carga Bloqueada: El archivo pertenece al RUT {file_rut}, pero la empresa activa tiene registrado el RUT {org_res.data.get('rut_empresa') or 'No Configurado'}."
                )
        elif not org_rut:
             raise HTTPException(status_code=400, detail="Carga bloqueada: La empresa seleccionada no tiene un RUT configurado. Por favor, complete la configuración de la empresa.")

        if not force:
            existing = db.table("rcv_imports").select("id").eq("organization_id", organization_id).eq("periodo", periodo).eq("tipo", "sales").gt("total_docs", 0).execute()
            if existing.data: raise HTTPException(status_code=400, detail="YA EXISTE una carga validada.")

        content = await file.read()
        storage_path = f"rcv/{organization_id}/{periodo}_ventas_{int(time.time())}.csv"
        db.storage.from_("tax_documents").upload(storage_path, content)
        
        # 1. Crear o Actualizar el Lote de Importación (Evita error 23505 Duplicate Key)
        import_data = {
            "organization_id": organization_id, "periodo": periodo, "tipo": "sales",
            "file_name": file.filename, "storage_path": storage_path, "total_docs": 0, "failed_docs": 0
        }
        
        # Buscar lote existente para el mismo periodo y tipo
        existing_import = db.table("rcv_imports").select("id")\
            .eq("organization_id", organization_id).eq("periodo", periodo).eq("tipo", "sales").execute()
        
        if existing_import.data:
            import_id = existing_import.data[0]["id"]
            db.table("rcv_imports").update(import_data).eq("id", import_id).execute()
        else:
            import_id = str(uuid.uuid4())
            import_data["id"] = import_id
            db.table("rcv_imports").insert(import_data).execute()

        # 1. Detección Inteligente de Delimitador y Codificación
        text = content.decode("utf-8-sig") if content.startswith(b'\xef\xbb\xbf') else content.decode("iso-8859-1")
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        if not lines: return {"success": True, "count": 0}

        # Encontrar la línea que parece ser el cabezal (skip titles if any)
        header_idx = 0
        for idx, line in enumerate(lines[:10]):
            line_up = line.upper()
            if "TIPO" in line_up or "FOLIO" in line_up or "RUT" in line_up:
                header_idx = idx
                break
        
        header_line = lines[header_idx]
        delim = ';' if header_line.count(';') >= header_line.count(',') else ','
        
        # 2. Iniciar Reader desde la línea de cabeceras
        f = StringIO("\n".join(lines[header_idx:]))
        reader = csv.DictReader(f, delimiter=delim)

        records = []
        errors = []
        for i, row in enumerate(reader, 2):
            row_clean = {str(k).strip(): str(v).strip() if v else "" for k, v in row.items() if k is not None}
            try:
                tipo = _get_val(row_clean, "tipo_doc", "33")
                monto_neto = _to_int(_get_val(row_clean, "neto", 0))
                monto_exento = _to_int(_get_val(row_clean, "exento", 0))
                m_calc, es_suma = _calcular_monto(monto_neto, monto_exento, str(tipo))
                
                records.append({
                    "organization_id": organization_id, 
                    "periodo": periodo, 
                    "tipo_documento": str(tipo),
                    "folio": _to_int(_get_val(row_clean, "folio", 0)), 
                    "rut_receptor": _formatear_rut(_get_val(row_clean, "rut_receptor", "")),
                    "razon_social_receptor": _get_val(row_clean, "razon_social", ""), 
                    "fecha_docto": _normalizar_fecha(_get_val(row_clean, "fecha", "")),
                    "monto_neto": monto_neto, 
                    "monto_exento": monto_exento, 
                    "monto_iva": _to_int(_get_val(row_clean, "iva", 0)),
                    "monto_total": _to_int(_get_val(row_clean, "total", 0)), 
                    "monto_calculado": m_calc, 
                    "es_suma": es_suma, 
                    "import_id": import_id
                })
            except Exception as e: errors.append(f"Fila {i}: {str(e)}")

        if errors:
            db.table("rcv_imports").update({"error_log": errors[:50]}).eq("id", import_id).execute()
            raise HTTPException(status_code=422, detail=f"Errores en filas: {errors[:3]}")

        if records:
            records = _dedup_records(records, ("organization_id", "tipo_documento", "folio", "rut_receptor"))
            db.table("sales_records").upsert(records, on_conflict="organization_id,tipo_documento,folio,rut_receptor").execute()
            _clear_rcv_cache(organization_id)
        
        db.table("rcv_imports").update({"total_docs": len(records)}).eq("id", import_id).execute()
        
        res_suma = len([r for r in records if r.get("es_suma")])
        res_resta = len(records) - res_suma

        return {
            "success": True, 
            "inserted": len(records),
            "tipo_suma": res_suma,
            "tipo_resta": res_resta
        }
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/top-vendors")
async def get_top_vendors(
    organization_id: str, 
    periodo: Optional[str] = None, 
    limit: int = 10,
    current_user: dict = Depends(verify_token)
):
    await verify_org_role(organization_id, auth=current_user)
    cache_key = f"vendors_{organization_id}_{periodo}_{limit}"
    cached = _get_rcv_cache(cache_key)
    if cached: return cached
    
    db = get_supabase()
    
    # Identificar lotes
    imp_ids = []
    if periodo:
        imp_res = db.table("rcv_imports").select("id").eq("organization_id", organization_id).eq("periodo", periodo).execute()
        imp_ids = [i["id"] for i in (imp_res.data or [])]

    query = db.table("purchase_records").select("rut_emisor, razon_social_emisor, monto_total, monto_calculado, es_suma").eq("organization_id", organization_id)
    if periodo:
        if imp_ids:
            query = query.or_(f"periodo.eq.{periodo},import_id.in.({','.join(imp_ids)})")
        else:
            query = query.eq("periodo", periodo)
    else:
        # Para Visión Global, aumentamos el límite de escaneo para capturar todos los periodos
        query = query.limit(10000)
        
    res = query.execute()
    data = res.data or []
    
    total_calc_global = sum(abs(r.get("monto_calculado", 0)) for r in data)
    vendors = {}
    for r in data:
        rut = r["rut_emisor"]
        if rut not in vendors: vendors[rut] = {"rut": rut, "nombre": r["razon_social_emisor"], "monto_calculado": 0, "count": 0}
        vendors[rut]["monto_calculado"] += r.get("monto_calculado", 0)
        vendors[rut]["count"] += 1
    
    result = []
    for v in sorted(vendors.values(), key=lambda x: abs(x["monto_calculado"]), reverse=True):
        v["porcentaje"] = round(abs(v["monto_calculado"]) / total_calc_global * 100, 2) if total_calc_global > 0 else 0
        result.append(v)
    
    _set_rcv_cache(cache_key, result[:limit])
    return result[:limit]

@router.get("/analysis/top-customers")
async def get_top_customers(
    organization_id: str, 
    periodo: Optional[str] = None, 
    limit: int = 10,
    current_user: dict = Depends(verify_token)
):
    await verify_org_role(organization_id, auth=current_user)
    cache_key = f"customers_{organization_id}_{periodo}_{limit}"
    cached = _get_rcv_cache(cache_key)
    if cached: return cached
    
    db = get_supabase()
    
    # Identificar lotes
    imp_ids = []
    if periodo:
        imp_res = db.table("rcv_imports").select("id").eq("organization_id", organization_id).eq("periodo", periodo).execute()
        imp_ids = [i["id"] for i in (imp_res.data or [])]

    query = db.table("sales_records").select("rut_receptor, razon_social_receptor, monto_total, monto_calculado, es_suma").eq("organization_id", organization_id)
    if periodo:
        if imp_ids:
            query = query.or_(f"periodo.eq.{periodo},import_id.in.({','.join(imp_ids)})")
        else:
            query = query.eq("periodo", periodo)
    else:
        # Para Visión Global, aumentamos el límite de escaneo
        query = query.limit(10000)
        
    res = query.execute()
    data = res.data or []
    
    total_calc_global = sum(abs(r.get("monto_calculado", 0)) for r in data)
    customers = {}
    for r in data:
        rut = r["rut_receptor"]
        if rut not in customers: customers[rut] = {"rut": rut, "nombre": r["razon_social_receptor"], "monto_calculado": 0, "count": 0}
        customers[rut]["monto_calculado"] += r.get("monto_calculado", 0)
        customers[rut]["count"] += 1
    
    result = []
    for c in sorted(customers.values(), key=lambda x: abs(x["monto_calculado"]), reverse=True):
        c["porcentaje"] = round(abs(c["monto_calculado"]) / total_calc_global * 100, 2) if total_calc_global > 0 else 0
        result.append(c)
    
    _set_rcv_cache(cache_key, result[:limit])
    return result[:limit]

@router.get("/analysis/summary")
async def get_rcv_summary(
    organization_id: str, 
    periodo: Optional[str] = None,
    current_user: dict = Depends(verify_token)
):
    await verify_org_role(organization_id, auth=current_user)
    cache_key = f"summary_{organization_id}_{periodo}"
    cached = _get_rcv_cache(cache_key)
    if cached: return cached
    
    db = get_supabase()
    # 1. Identificar lotes vinculados a este periodo
    imp_ids = []
    if periodo:
        imp_res = db.table("rcv_imports").select("id").eq("organization_id", organization_id).eq("periodo", periodo).execute()
        imp_ids = [i["id"] for i in (imp_res.data or [])]
    
    # 2. Obtener Compras (Usamos un límite muy alto para el resumen global)
    pq = db.table("purchase_records").select("monto_total, monto_calculado, rut_emisor").eq("organization_id", organization_id)
    if periodo:
        if imp_ids:
            pq = pq.or_(f"periodo.eq.{periodo},import_id.in.({','.join(imp_ids)})")
        else:
            pq = pq.eq("periodo", periodo)
    else:
        # Para global, queremos TODO. PostgREST tiene un límite duro, así que pedimos el máximo permitido
        pq = pq.limit(10000)
        
    p_res = pq.execute()
    purchases = p_res.data or []
    
    # 3. Obtener Ventas
    sq = db.table("sales_records").select("monto_total, monto_calculado, rut_receptor").eq("organization_id", organization_id)
    if periodo:
        if imp_ids:
            sq = sq.or_(f"periodo.eq.{periodo},import_id.in.({','.join(imp_ids)})")
        else:
            sq = sq.eq("periodo", periodo)
    else:
        sq = sq.limit(10000)
        
    s_res = sq.execute()
    sales = s_res.data or []
    
    # Debug para el desarrollador
    print(f"DEBUG Analysis: Org={organization_id}, Periodo={periodo}, Purchases={len(purchases)}, Sales={len(sales)}")
    
    # 4. Cálculos Robustos
    total_purch = sum(abs(r.get("monto_total", 0)) for r in purchases)
    total_sales = sum(abs(r.get("monto_total", 0)) for r in sales)
    mc_purch = sum(r.get("monto_calculado", 0) for r in purchases)
    mc_sales = sum(r.get("monto_calculado", 0) for r in sales)
    
    unique_vendors = len(set(r.get("rut_emisor") for r in purchases if r.get("rut_emisor")))
    unique_customers = len(set(r.get("rut_receptor") for r in sales if r.get("rut_receptor")))
    
    # Log profesional para diagnóstico en consola del motor
    mode = "GLOBAL" if periodo is None else f"PERIOD:{periodo}"
    print(f"[RCV_ANALYSIS] Mode: {mode} | Org: {organization_id} | PurchDocs: {len(purchases)} | SalesDocs: {len(sales)} | SumPurch: ${total_purch:,.0f}")

    result = {
        "total_docs_compras": len(purchases),
        "total_docs_ventas": len(sales),
        "monto_compras": total_purch,
        "monto_ventas": total_sales,
        "monto_calculado_compras": mc_purch,
        "monto_calculado_ventas": mc_sales,
        "proveedores_unicos": unique_vendors,
        "clientes_unicos": unique_customers,
        "balance": mc_sales - abs(mc_purch),
        "is_global": periodo is None
    }
    _set_rcv_cache(cache_key, result)
    return result

@router.get("/periodos")
async def get_available_periods(
    organization_id: str,
    current_user: dict = Depends(verify_token)
):
    """
    Lista los periodos que tienen documentos físicos en la base de datos.
    Filtra periodos 'fantasma' que solo existen en la bitácora de importación.
    """
    await verify_org_role(organization_id, auth=current_user)
    db = get_supabase()
    p_res = db.table("purchase_records").select("periodo").eq("organization_id", organization_id).execute()
    s_res = db.table("sales_records").select("periodo").eq("organization_id", organization_id).execute()
    
    # Extraemos periodos únicos de las tablas de documentos reales
    p_data = list(set([r["periodo"] for r in (p_res.data or []) if r.get("periodo")]))
    s_data = list(set([r["periodo"] for r in (s_res.data or []) if r.get("periodo")]))
    
    # Unificamos y ordenamos
    periods = sorted(list(set(p_data + s_data)), reverse=True)
    
    print(f"[RCV_CONFIG] Periodos reales encontrados para {organization_id}: {len(periods)}")
    return periods
