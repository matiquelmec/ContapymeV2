import csv
import time
import uuid
from datetime import date
from io import StringIO
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from core.database import get_supabase
from core.auth import verify_token
from core.logger import log_activity, log_system_error
from typing import Optional, List, Dict, Any

router = APIRouter()

# ==========================================
# CONSTANTES SII â Tipos de Documento
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

# Tipos que SUMAN al monto calculado (Incluye Notas de DÃ©bito 56/111)
DOCUMENT_TYPES_SUMA = {'33', '34', '39', '41', '43', '45', '46', '56', '110', '111'}
# Tipos que RESTAN al monto calculado (Notas de CrÃ©dito)
DOCUMENT_TYPES_RESTA = {'61', '112'}

def _calcular_monto(monto_neto: int, monto_exento: int, tipo_doc: str) -> tuple[int, bool]:
    """
    Calcula el monto final (J+K) segÃºn lÃ³gica SII por tipo de documento.
    Retorna (monto_calculado, es_suma).
    """
    monto_base = monto_neto + monto_exento
    if tipo_doc in DOCUMENT_TYPES_RESTA:
        return (-monto_base, False)
    elif tipo_doc in DOCUMENT_TYPES_SUMA:
        return (monto_base, True)
    else:
        # Por defecto suma si no se conoce
        return (monto_base, True)

def _normalizar_fecha(fecha_raw: str) -> str:
    """Convierte DD/MM/YYYY o YYYY/MM/DD â YYYY-MM-DD."""
    if not fecha_raw:
        return ""
    fecha_raw = str(fecha_raw).strip()
    if "/" in fecha_raw:
        try:
            parts = fecha_raw.split("/")
            if len(parts) == 3:
                # Caso DD/MM/YYYY
                if len(parts[2]) == 4:
                    d, m, y = parts
                    return f"{y}-{m.zfill(2)}-{d.zfill(2)}"
                # Caso YYYY/MM/DD
                elif len(parts[0]) == 4:
                    y, m, d = parts
                    return f"{y}-{m.zfill(2)}-{d.zfill(2)}"
        except Exception:
            pass
    return fecha_raw

def _extraer_rut_nombre_archivo(filename: str) -> Optional[str]:
    """Extrae algo que parece un RUT de un nombre de archivo (ej. RCV_COMPRA_76444333-2.csv)"""
    import re
    # Busca patrones tipo 12345678-9 o 12.345.678-9
    match = re.search(r'(\d{1,2}(?:\.?\d{3}){2}-[\dkK])', filename)
    if match:
        return match.group(1).replace(".", "")
    return None

def _formatear_rut(rut: str) -> str:
    """Elimina puntos para comparacion homogenea."""
    if not rut: return ""
    return str(rut).replace(".", "").strip().upper()

def _get_val(row_clean: dict, key: str, default: any = "") -> any:
    """Busca en el diccionario de forma insensible a mayÃºsculas usando alias conocidos."""
    # Mapa de alias (todos en minÃºsculas)
    aliases = {
        "rut_emisor": ["rut emisor", "rut proveedor", "rut_emisor", "rut_proveedor", "emisor", "proveedor"],
        "rut_receptor": ["rut receptor", "rut cliente", "rut comprador", "rut_receptor", "rut_cliente", "receptor", "cliente"],
        "razon_social": ["razon social", "razÃ³n social", "nombre", "nombre emisor", "nombre receptor", "razÃ³n social emisor"],
        "tipo_doc": ["tipo doc", "tipo docto", "cÃ³digo tipo doc", "tipo documento", "t_doc"],
        "folio": ["folio", "nro docto", "nÂº documento", "nÂ° documento", "folio docto"],
        "fecha": ["fecha docto", "fecha documento", "fecha emisiÃ³n", "fecha", "fecha_doc"],
        "neto": ["monto neto", "neto", "monto_neto", "m_neto"],
        "exento": ["monto exento", "exento", "monto_exento", "m_exento"],
        "iva": ["monto iva", "iva", "monto iva recuperable", "monto iva diferido", "m_iva", "iva recuperable"],
        "total": ["monto total", "total", "monto_total", "m_total"]
    }
    
    # Normalizamos el diccionario de entrada a minÃºsculas
    row_lower = {str(k).lower().strip(): v for k, v in row_clean.items()}
    
    targets = aliases.get(key, [key])
    for target in targets:
        if target.lower() in row_lower:
            return row_lower[target.lower()]
    return default

# ==========================================
# IMPORTACIÃN
# ==========================================
@router.post("/import-purchases")
async def import_purchases(
    organization_id: str, 
    periodo: str, 
    force: bool = False, 
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    db = get_supabase()
    try:
        # Normalizar periodo (YYYY-MM -> YYYY-MM-01)
        if len(periodo) == 7:
            periodo = f"{periodo}-01"

        # 0. BLINDAJE: Obtener RUT de la organizaciÃ³n para validaciÃ³n cruzada
        org_res = db.table("organizations").select("rut_empresa").eq("id", organization_id).single().execute()
        org_rut = _formatear_rut(org_res.data.get("rut_empresa")) if org_res.data else None
        
        # 1. BLINDAJE: Validar Nombre del Archivo (Si trae RUT)
        file_rut = _extraer_rut_nombre_archivo(file.filename)
        if file_rut and org_rut and _formatear_rut(file_rut) != org_rut:
             raise HTTPException(
                status_code=400,
                detail=f"Carga Bloqueada: El Archivo RCV pertenece al contribuyente RUT {file_rut}, lo cual no coincide con la instancia activa (RUT {org_rut})."
            )

        # 2. VALIDACIÃN DE DUPLICADOS: Solo bloquear si existe una carga EXITOSA (>0 docs)
        if not force:
            existing = db.table("rcv_imports") \
                .select("id, file_name, total_docs") \
                .eq("organization_id", organization_id) \
                .eq("periodo", periodo) \
                .eq("tipo", "purchases") \
                .gt("total_docs", 0) \
                .execute()
            
            if existing.data:
                last_file = existing.data[0].get("file_name", "desconocido")
                raise HTTPException(
                    status_code=400, 
                    detail=f"YA EXISTE una carga de COMPRAS VALIDADA para este periodo (Archivo: {last_file}). "
                           f"Usa el botÃ³n 'FORZAR SOBREESCRITURA' si deseas reemplazarla."
                )

        # 3. LIMPIEZA DE BASURA
        db.table("rcv_imports") \
            .delete() \
            .eq("organization_id", organization_id) \
            .eq("periodo", periodo) \
            .eq("tipo", "purchases") \
            .eq("total_docs", 0) \
            .execute()

        content = await file.read()
        timestamp = int(time.time())
        file_ext = file.filename.split('.')[-1] if file.filename else 'csv'
        safe_filename = f"{periodo}_compras_{timestamp}.{file_ext}"
        storage_path = f"rcv/{organization_id}/{safe_filename}"
        
        db.storage.from_("tax_documents").upload(storage_path, content)
        
        import_id = str(uuid.uuid4())
        db.table("rcv_imports").insert({
            "id": import_id,
            "organization_id": organization_id,
            "periodo": periodo,
            "tipo": "purchases",
            "file_name": file.filename or "unknown.csv",
            "storage_path": storage_path,
            "total_docs": 0,
            "failed_docs": 0,
            "error_log": []
        }).execute()

        text = content.decode("utf-8-sig") if content.startswith(b'\xef\xbb\xbf') else content.decode("iso-8859-1")
        # DetecciÃ³n de delimitador
        delim = ';' if ';' in text.split('\n')[0] else ','
        f = StringIO(text)
        reader = csv.DictReader(f, delimiter=delim)

        records = []
        errors = []
        row_num = 1
        
        # 4. BLINDAJE: Validar Contenido de Filas
        for row in reader:
            row_num += 1
            row_clean = {str(k).strip(): str(v).strip() if v else "" for k, v in row.items() if k is not None}
            row_keys_lower = [str(k).lower().strip() for k in row_clean.keys()]

            # Validar si el receptor de la compra es nuestra empresa (Si la columna existe)
            if org_rut:
                rut_receptor_csv = _formatear_rut(_get_val(row_clean, "rut_receptor", ""))
                if rut_receptor_csv and rut_receptor_csv != org_rut:
                     errors.append(f"Error crÃ­tico: El documento en fila {row_num} indica Receptor {rut_receptor_csv}, pero la empresa activa es {org_rut}.")
                     break

            # ValidaciÃ³n de cruce (Ventas en Compras)
            if row_num == 2:
                if "rut receptor" in row_keys_lower or ("rut cliente" in row_keys_lower and "tipo compra" not in row_keys_lower):
                     errors.append("Error crÃ­tico: Parece que intentaste subir un archivo de VENTAS en la secciÃ³n de COMPRAS.")
                     break

            try:
                tipo_docto = _get_val(row_clean, "tipo_doc", "33")
                rut_emisor = _get_val(row_clean, "rut_emisor", "")
                monto_iva_raw = _get_val(row_clean, "iva", 0)

                if not rut_emisor or len(str(rut_emisor)) < 3:
                     raise ValueError(f"RUT Emisor no encontrado. Columnas disponibles: {list(row_clean.keys())[:5]}")

                fecha_db = _normalizar_fecha(_get_val(row_clean, "fecha", ""))
                monto_neto = int(_get_val(row_clean, "neto", 0))
                monto_exento = int(_get_val(row_clean, "exento", 0))
                monto_iva = int(monto_iva_raw)
                monto_total = int(_get_val(row_clean, "total", 0))
                monto_calculado, es_suma = _calcular_monto(monto_neto, monto_exento, str(tipo_docto))

                records.append({
                    "organization_id": organization_id,
                    "periodo": periodo,
                    "tipo_documento": str(tipo_docto),
                    "folio": int(_get_val(row_clean, "folio", 0)),
                    "rut_emisor": str(rut_emisor),
                    "razon_social_emisor": _get_val(row_clean, "razon_social", ""),
                    "fecha_docto": fecha_db,
                    "monto_neto": monto_neto,
                    "monto_exento": monto_exento,
                    "monto_iva": monto_iva,
                    "monto_total": monto_total,
                    "monto_calculado": monto_calculado,
                    "es_suma": es_suma,
                    "import_id": import_id,
                })
            except Exception as e:
                errors.append(f"Fila {row_num}: {str(e)}")

        if errors:
            # ACTUALIZAR ESTADO DE FALLO (ATOMICIDAD: No se insertan records)
            db.table("rcv_imports").update({
                "total_docs": 0,
                "failed_docs": len(records) + len(errors),
                "error_log": errors[:50]
            }).eq("id", import_id).execute()
            
            log_system_error(
                category="RCV_PURCHASES_PARSER",
                message=f"Importación ABORTADA: {len(errors)} errores",
                organization_id=organization_id,
                details={"errors": errors[:5], "file": file.filename}
            )
            raise HTTPException(
                status_code=422,
                detail=f"Importación ABORTADA. Se encontraron {len(errors)} errores. Por favor corrige el archivo y reintenta. Ejemplos: {errors[:3]}"
            )

        if records:
            db.table("purchase_records").upsert(records, on_conflict="organization_id,folio,rut_emisor,periodo").execute()

        db.table("rcv_imports").update({
            "total_docs": len(records),
            "failed_docs": 0,
            "error_log": []
        }).eq("id", import_id).execute()

        # REGISTRAR EN BITÁCORA (AUDIT LOG)
        log_activity(
            action="import_rcv_purchases",
            organization_id=organization_id,
            user_id=current_user.get("id"),
            entity_type="rcv_import",
            entity_id=import_id,
            details={
                "periodo": periodo,
                "file_name": file.filename,
                "total_docs": len(records),
                "failed_docs": len(errors)
            }
        )

        return {
            "success": True,
            "inserted": len(records),
            "failed": len(errors),
            "errors": errors[:5],
            "periodo": periodo,
            "tipo_suma": sum(1 for r in records if r["es_suma"]),
            "tipo_resta": sum(1 for r in records if not r["es_suma"]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-sales")
async def import_sales(
    organization_id: str, 
    periodo: str, 
    force: bool = False, 
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    db = get_supabase()
    try:
        # 0. BLINDAJE: Obtener RUT de la organizaciÃ³n
        org_res = db.table("organizations").select("rut_empresa").eq("id", organization_id).single().execute()
        org_rut = _formatear_rut(org_res.data.get("rut_empresa")) if org_res.data else None

        # 1. BLINDAJE: Validar Nombre del Archivo
        file_rut = _extraer_rut_nombre_archivo(file.filename)
        if file_rut and org_rut and _formatear_rut(file_rut) != org_rut:
             raise HTTPException(
                status_code=400,
                detail=f"Carga Bloqueada: El Archivo RCV pertenece al contribuyente RUT {file_rut}, lo cual no coincide con la instancia activa (RUT {org_rut})."
            )

        # Normalizar periodo (YYYY-MM -> YYYY-MM-01)
        if len(periodo) == 7:
            periodo = f"{periodo}-01"

        # 2. VALIDACIÃN DE DUPLICADOS
        if not force:
            existing = db.table("rcv_imports") \
                .select("id, file_name, total_docs") \
                .eq("organization_id", organization_id) \
                .eq("periodo", periodo) \
                .eq("tipo", "sales") \
                .gt("total_docs", 0) \
                .execute()
            
            if existing.data:
                last_file = existing.data[0].get("file_name", "desconocido")
                raise HTTPException(
                    status_code=400, 
                    detail=f"YA EXISTE una carga de VENTAS VALIDADA para este periodo (Archivo: {last_file}). "
                           f"Usa el botÃ³n 'FORZAR SOBREESCURA' si deseas reemplazarla."
                )

        # 3. LIMPIEZA DE BASURA
        db.table("rcv_imports") \
            .delete() \
            .eq("organization_id", organization_id) \
            .eq("periodo", periodo) \
            .eq("tipo", "sales") \
            .eq("total_docs", 0) \
            .execute()

        content = await file.read()
        timestamp = int(time.time())
        file_ext = file.filename.split('.')[-1] if file.filename else 'csv'
        safe_filename = f"{periodo}_ventas_{timestamp}.{file_ext}"
        storage_path = f"rcv/{organization_id}/{safe_filename}"
        
        db.storage.from_("tax_documents").upload(storage_path, content)
        
        import_id = str(uuid.uuid4())
        db.table("rcv_imports").insert({
            "id": import_id,
            "organization_id": organization_id,
            "periodo": periodo,
            "tipo": "sales",
            "file_name": file.filename or "unknown.csv",
            "storage_path": storage_path,
            "total_docs": 0,
            "failed_docs": 0,
            "error_log": []
        }).execute()

        text = content.decode("utf-8-sig") if content.startswith(b'\xef\xbb\xbf') else content.decode("iso-8859-1")
        delim = ';' if ';' in text.split('\n')[0] else ','
        f = StringIO(text)
        reader = csv.DictReader(f, delimiter=delim)

        records = []
        errors = []
        row_num = 1
        
        # 4. BLINDAJE: Validar Contenido de Filas
        for row in reader:
            row_num += 1
            row_clean = {str(k).strip(): str(v).strip() if v else "" for k, v in row.items() if k is not None}
            row_keys_lower = [str(k).lower().strip() for k in row_clean.keys()]

            # Validar si el emisor de la venta es nuestra empresa
            if org_rut:
                rut_emisor_csv = _formatear_rut(_get_val(row_clean, "rut_emisor", ""))
                if rut_emisor_csv and rut_emisor_csv != org_rut:
                     errors.append(f"Error crÃ­tico: El documento en fila {row_num} indica Emisor {rut_emisor_csv}, pero la empresa activa es {org_rut}.")
                     break

            # ValidaciÃ³n de cruce (Compras en Ventas)
            if row_num == 2:
                if "tipo compra" in row_keys_lower or "rut emisor" in row_keys_lower or "rut proveedor" in row_keys_lower:
                     errors.append("Error crÃ­tico: Parece que intentaste subir un archivo de COMPRAS en la secciÃ³n de VENTAS.")
                     break
            try:
                tipo_docto = _get_val(row_clean, "tipo_doc", "33")
                rut_receptor = _get_val(row_clean, "rut_receptor", "")
                monto_iva_raw = _get_val(row_clean, "iva", 0)

                if not rut_receptor or len(str(rut_receptor)) < 3:
                     raise ValueError(f"RUT Receptor no encontrado. Columnas disponibles: {list(row_clean.keys())[:5]}")

                fecha_db = _normalizar_fecha(_get_val(row_clean, "fecha", ""))
                monto_neto = int(_get_val(row_clean, "neto", 0))
                monto_exento = int(_get_val(row_clean, "exento", 0))
                monto_iva = int(monto_iva_raw)
                monto_total = int(_get_val(row_clean, "total", 0))
                monto_calculado, es_suma = _calcular_monto(monto_neto, monto_exento, str(tipo_docto))

                records.append({
                    "organization_id": organization_id,
                    "periodo": periodo,
                    "tipo_documento": str(tipo_docto),
                    "folio": int(_get_val(row_clean, "folio", 0)),
                    "rut_receptor": str(rut_receptor),
                    "razon_social_receptor": _get_val(row_clean, "razon_social", ""),
                    "fecha_docto": fecha_db,
                    "monto_neto": monto_neto,
                    "monto_exento": monto_exento,
                    "monto_iva": monto_iva,
                    "monto_total": monto_total,
                    "monto_calculado": monto_calculado,
                    "es_suma": es_suma,
                    "import_id": import_id,
                })
            except Exception as e:
                errors.append(f"Fila {row_num}: {str(e)}")

        if errors:
            # ACTUALIZAR ESTADO DE FALLO (ATOMICIDAD: No se insertas records)
            db.table("rcv_imports").update({
                "total_docs": 0,
                "failed_docs": len(records) + len(errors),
                "error_log": errors[:50]
            }).eq("id", import_id).execute()
            
            log_system_error(
                category="RCV_SALES_PARSER",
                message=f"Importación ABORTADA: {len(errors)} errores",
                organization_id=organization_id,
                details={"errors": errors[:5], "file": file.filename}
            )
            raise HTTPException(
                status_code=422,
                detail=f"Importación ABORTADA. Se encontraron {len(errors)} errores en ventas. Por favor corrige el archivo y reintenta. Ejemplos: {errors[:3]}"
            )

        if records:
            db.table("sales_records").upsert(records, on_conflict="organization_id,folio,rut_receptor,periodo").execute()

        db.table("rcv_imports").update({
            "total_docs": len(records),
            "failed_docs": 0,
            "error_log": []
        }).eq("id", import_id).execute()

        return {
            "success": True,
            "inserted": len(records),
            "failed": len(errors),
            "errors": errors[:5],
            "periodo": periodo,
            "tipo_suma": sum(1 for r in records if r["es_suma"]),
            "tipo_resta": sum(1 for r in records if not r["es_suma"]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# ANÃLISIS â ENDPOINTS DE CONSULTA
# ==========================================

@router.get("/analysis/top-vendors")
async def get_top_vendors(organization_id: str, periodo: Optional[str] = None, limit: int = 10):
    """
    Retorna top proveedores agrupados por RUT con monto calculado (J+K), 
    porcentaje del total, y desglose de compras vs devoluciones.
    """
    db = get_supabase()
    query = db.table("purchase_records").select(
        "rut_emisor, razon_social_emisor, monto_neto, monto_exento, monto_total, monto_calculado, es_suma, tipo_documento"
    ).eq("organization_id", organization_id)

    if periodo:
        query = query.eq("periodo", periodo)

    res = query.execute()
    data = res.data or []

    total_calculado_global = sum(abs(r.get("monto_calculado", r["monto_total"])) for r in data)

    vendors: Dict[str, Dict[str, Any]] = {}
    for r in data:
        rut = r["rut_emisor"]
        mc = r.get("monto_calculado", r["monto_total"])
        if rut not in vendors:
            vendors[rut] = {
                "rut": rut,
                "nombre": r["razon_social_emisor"],
                "total": 0,
                "monto_calculado": 0,
                "count": 0,
                "count_suma": 0,
                "count_resta": 0,
            }
        vendors[rut]["total"] += r["monto_total"]
        vendors[rut]["monto_calculado"] += mc
        vendors[rut]["count"] += 1
        if r.get("es_suma", True):
            vendors[rut]["count_suma"] += 1
        else:
            vendors[rut]["count_resta"] += 1

    # Calcular porcentaje y ordenar
    result = []
    for v in sorted(vendors.values(), key=lambda x: abs(x["monto_calculado"]), reverse=True):
        v["porcentaje"] = round(
            abs(v["monto_calculado"]) / total_calculado_global * 100, 2
        ) if total_calculado_global > 0 else 0
        result.append(v)

    return result[:limit]


@router.get("/analysis/top-customers")
async def get_top_customers(organization_id: str, periodo: Optional[str] = None, limit: int = 10):
    """
    Retorna top clientes agrupados por RUT con monto calculado (J+K),
    porcentaje del total, y desglose de ventas vs devoluciones.
    """
    db = get_supabase()
    query = db.table("sales_records").select(
        "rut_receptor, razon_social_receptor, monto_neto, monto_exento, monto_total, monto_calculado, es_suma, tipo_documento"
    ).eq("organization_id", organization_id)

    if periodo:
        query = query.eq("periodo", periodo)

    res = query.execute()
    data = res.data or []

    total_calculado_global = sum(abs(r.get("monto_calculado", r["monto_total"])) for r in data)

    customers: Dict[str, Dict[str, Any]] = {}
    for r in data:
        rut = r["rut_receptor"]
        mc = r.get("monto_calculado", r["monto_total"])
        if rut not in customers:
            customers[rut] = {
                "rut": rut,
                "nombre": r["razon_social_receptor"],
                "total": 0,
                "monto_calculado": 0,
                "count": 0,
                "count_suma": 0,
                "count_resta": 0,
            }
        customers[rut]["total"] += r["monto_total"]
        customers[rut]["monto_calculado"] += mc
        customers[rut]["count"] += 1
        if r.get("es_suma", True):
            customers[rut]["count_suma"] += 1
        else:
            customers[rut]["count_resta"] += 1

    result = []
    for c in sorted(customers.values(), key=lambda x: abs(x["monto_calculado"]), reverse=True):
        c["porcentaje"] = round(
            abs(c["monto_calculado"]) / total_calculado_global * 100, 2
        ) if total_calculado_global > 0 else 0
        result.append(c)

    return result[:limit]


@router.get("/analysis/summary")
async def get_rcv_summary(organization_id: str, periodo: Optional[str] = None):
    """
    Retorna KPIs resumen del perÃ­odo:
    - monto_compras, monto_ventas, monto_calculado_compras, monto_calculado_ventas
    - total_docs_compras, total_docs_ventas
    - proveedores_unicos, clientes_unicos
    - periodo_disponible (si no se filtra)
    """
    db = get_supabase()

    # Query purchases
    pq = db.table("purchase_records").select(
        "monto_total, monto_calculado, es_suma, rut_emisor"
    ).eq("organization_id", organization_id)
    if periodo:
        pq = pq.eq("periodo", periodo)
    purchases = pq.execute().data or []

    # Query sales
    sq = db.table("sales_records").select(
        "monto_total, monto_calculado, es_suma, rut_receptor"
    ).eq("organization_id", organization_id)
    if periodo:
        sq = sq.eq("periodo", periodo)
    sales = sq.execute().data or []

    monto_compras = sum(r["monto_total"] for r in purchases)
    monto_ventas = sum(r["monto_total"] for r in sales)
    monto_calculado_compras = sum(r.get("monto_calculado", r["monto_total"]) for r in purchases)
    monto_calculado_ventas = sum(r.get("monto_calculado", r["monto_total"]) for r in sales)
    proveedores_unicos = len(set(r["rut_emisor"] for r in purchases if r.get("rut_emisor")))
    clientes_unicos = len(set(r["rut_receptor"] for r in sales if r.get("rut_receptor")))

    return {
        "total_docs_compras": len(purchases),
        "total_docs_ventas": len(sales),
        "monto_compras": monto_compras,
        "monto_ventas": monto_ventas,
        "monto_calculado_compras": monto_calculado_compras,
        "monto_calculado_ventas": monto_calculado_ventas,
        "proveedores_unicos": proveedores_unicos,
        "clientes_unicos": clientes_unicos,
        "balance": monto_calculado_ventas - abs(monto_calculado_compras),
    }


@router.get("/periodos")
async def get_available_periods(organization_id: str):
    """
    Retorna lista de perÃ­odos Ãºnicos (YYYY-MM-01) que tienen datos,
    con conteo de documentos de compras y ventas por perÃ­odo.
    """
    db = get_supabase()

    p_res = db.table("purchase_records").select("periodo").eq("organization_id", organization_id).execute()
    s_res = db.table("sales_records").select("periodo").eq("organization_id", organization_id).execute()

    periodos_compras: Dict[str, int] = {}
    for r in p_res.data or []:
        p = r["periodo"]
        periodos_compras[p] = periodos_compras.get(p, 0) + 1

    periodos_ventas: Dict[str, int] = {}
    for r in s_res.data or []:
        p = r["periodo"]
        periodos_ventas[p] = periodos_ventas.get(p, 0) + 1

    all_periods = sorted(set(list(periodos_compras.keys()) + list(periodos_ventas.keys())), reverse=True)

    return [
        {
            "periodo": p,
            "docs_compras": periodos_compras.get(p, 0),
            "docs_ventas": periodos_ventas.get(p, 0),
        }
        for p in all_periods
    ]


@router.get("/history")
async def get_import_history(organization_id: str, limit: int = 30):
    """
    Retorna historial de importaciones agrupado por (periodo, tipo).
    Incluye totales de documentos, monto, y si ya tiene asientos contables generados.
    """
    db = get_supabase()

    # Compras â agrupar por periodo
    p_res = db.table("purchase_records").select(
        "periodo, monto_total, monto_calculado, es_suma, journal_entry_id"
    ).eq("organization_id", organization_id).order("periodo", desc=True).execute()

    # Ventas â agrupar por periodo
    s_res = db.table("sales_records").select(
        "periodo, monto_total, monto_calculado, es_suma, journal_entry_id"
    ).eq("organization_id", organization_id).order("periodo", desc=True).execute()

    def _agrupar(records: list, tipo: str) -> list:
        grupos: Dict[str, Dict[str, Any]] = {}
        for r in records:
            p = r["periodo"]
            if p not in grupos:
                grupos[p] = {
                    "periodo": p,
                    "tipo": tipo,
                    "total_docs": 0,
                    "monto_total": 0,
                    "monto_calculado": 0,
                    "docs_con_asiento": 0,
                    "docs_sin_asiento": 0,
                }
            grupos[p]["total_docs"] += 1
            grupos[p]["monto_total"] += r["monto_total"]
            grupos[p]["monto_calculado"] += r.get("monto_calculado", r["monto_total"])
            if r.get("journal_entry_id"):
                grupos[p]["docs_con_asiento"] += 1
            else:
                grupos[p]["docs_sin_asiento"] += 1
        return list(grupos.values())

    compras_hist = _agrupar(p_res.data or [], "purchases")
    ventas_hist = _agrupar(s_res.data or [], "sales")

    # Combinar y ordenar por periodo desc
    history = sorted(compras_hist + ventas_hist, key=lambda x: x["periodo"], reverse=True)
    return history[:limit]
