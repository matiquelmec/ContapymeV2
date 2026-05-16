import json
import os
import uuid
from core.database import get_supabase

# Configuración
TARGET_ORG_ID = "2e9f634b-4087-448c-bfa6-244bfa1eec61"
BACKUP_PATH = r"C:\Users\Matías Riquelme\Desktop\SistemaOC_BACKUP_20260515\datos_exportados.json"
CAF_BASE_DIR = r"C:\Users\Matías Riquelme\Desktop\SistemaOC\caf"

def migrate():
    supabase = get_supabase()
    
    with open(BACKUP_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    # Usar datos de certificación para la prueba
    cert_data = data.get("certificacion", {})
    empresa = cert_data.get("mi_empresa", [{}])[0]
    
    if not empresa:
        print("Error: No hay datos de empresa en el backup.")
        return

    print(f"--- Migrando datos para: {empresa['razon_social']} ---")
    
    # 1. Migrar Empresa
    company_record = {
        "organization_id": TARGET_ORG_ID,
        "rut": empresa["rut"],
        "razon_social": empresa["razon_social"],
        "giro": empresa["giro"],
        "direccion": empresa["direccion"],
        "comuna": empresa["comuna"],
        "ciudad": empresa["ciudad"],
        "acteco": empresa.get("acteco", "620100"), # Default acteco si no hay
        "resolucion_numero": int(empresa.get("resolucion_sii", 80)),
        "resolucion_fecha": empresa.get("fecha_resolucion", "2014-08-22")
    }
    
    # Upsert por RUT y Org
    res_comp = supabase.table("dte_companies").upsert(company_record, on_conflict="organization_id, rut").execute()
    company_id = res_comp.data[0]["id"]
    print(f"[OK] Emisor registrado: {company_id}")
    
    # 2. Migrar DTEs Emitidos (últimos 5 para prueba)
    dtes = cert_data.get("dte_emitidos", [])
    print(f"Migrando {min(len(dtes), 5)} DTEs...")
    
    for dte in dtes[:5]:
        dte_record = {
            "organization_id": TARGET_ORG_ID,
            "company_id": company_id,
            "tipo_dte": dte["tipo_dte"],
            "folio": dte["folio"],
            "fecha_emision": dte.get("fecha"), # Corregido: 'fecha' en JSON
            "receptor_rut": dte["receptor_rut"],
            "receptor_razon_social": dte.get("receptor_nombre", "PARTICULAR"), # Corregido: 'receptor_nombre' en JSON
            "monto_neto": int(dte.get("monto_neto", 0)),
            "monto_iva": int(dte.get("monto_iva", 0)),
            "monto_total": int(dte.get("monto_total", 0)),
            "status": "accepted" if dte.get("estado") == "Aceptado" else "signed",
            "xml_content": dte.get("xml_path")
        }
        supabase.table("dte_issued").upsert(dte_record, on_conflict="organization_id, tipo_dte, folio").execute()

    print("[OK] DTEs migrados.")
    
    # 3. Migrar CAFs (Folios)
    from core.dte.caf_manager import CAFManager
    caf_cert_dir = os.path.join(CAF_BASE_DIR, "cert")
    if os.path.exists(caf_cert_dir):
        files = [f for f in os.listdir(caf_cert_dir) if f.endswith(".xml")]
        print(f"Migrando {len(files)} archivos CAF...")
        for filename in files:
            file_path = os.path.join(caf_cert_dir, filename)
            try:
                with open(file_path, "r", encoding="ISO-8859-1") as cf:
                    xml_content = cf.read()
                
                info = CAFManager.parse_caf_xml(xml_content)
                
                caf_record = {
                    "organization_id": TARGET_ORG_ID,
                    "company_id": company_id,
                    "tipo_dte": info["tipo_dte"],
                    "range_start": info["range_start"],
                    "range_end": info["range_end"],
                    "last_used_folio": info["range_start"] - 1,
                    "environment": "certification",
                    "caf_xml": xml_content,
                    "authorized_at": info["authorized_at"]
                }
                supabase.table("dte_caf_folios").upsert(caf_record, on_conflict="organization_id, company_id, tipo_dte, range_start, environment").execute()
            except Exception as e:
                print(f"Error procesando {filename}: {e}")
                
    print("--- MIGRACION FINALIZADA ---")

if __name__ == "__main__":
    migrate()
