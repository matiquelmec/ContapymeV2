import os
import sys
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from supabase import create_client
from postgrest.exceptions import APIError

# Cargar variables de entorno del backend
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "engine", ".env")
load_dotenv(dotenv_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: No se cargaron las variables de entorno de Supabase.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

ORGANIZATION_ID = "19b78bd1-6019-4329-bd8d-b75d5ae9049d"  # Inversiones Riquelme
COMPANY_ID = "f3d240dd-79b2-4a80-9269-74518c4ce830"       # Matías Riquelme en dte_companies

def clean_rut_simple(rut_str):
    if not rut_str:
        return ""
    return "".join(c for c in rut_str if c.isalnum()).upper()

def import_caf_file(file_path, environment):
    filename = os.path.basename(file_path)
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            xml_content = f.read()

        # Parsear XML
        root = ET.fromstring(xml_content.encode('utf-8'))
        
        # Encontrar nodo CAF
        caf_node = root.find(".//CAF")
        if caf_node is None and root.tag == "CAF":
            caf_node = root
            
        if caf_node is None:
            print(f"Saltando {filename}: No se encontro el nodo <CAF>.")
            return False
            
        da_node = caf_node.find("DA")
        if da_node is None:
            print(f"Saltando {filename}: No se encontro el nodo <DA>.")
            return False
            
        rut_emisor = da_node.find("RE").text
        tipo_dte = int(da_node.find("TD").text)
        
        # El rango de folios
        rng_node = da_node.find("RNG")
        if rng_node is not None:
            range_start = int(rng_node.find("D").text)
            range_end = int(rng_node.find("H").text)
        else:
            # Fallback si no está anidado
            range_start = int(da_node.find(".//D").text)
            range_end = int(da_node.find(".//H").text)
            
        fecha_auth = da_node.find("FA").text

        # Preparar inserción
        caf_data = {
            "organization_id": ORGANIZATION_ID,
            "company_id": COMPANY_ID,
            "tipo_dte": tipo_dte,
            "range_start": range_start,
            "range_end": range_end,
            "last_used_folio": range_start - 1,
            "environment": environment,
            "caf_xml": xml_content,
            "authorized_at": fecha_auth,
            "is_active": True
        }

        try:
            # Desactivar folios antiguos del mismo tipo y ambiente para la empresa
            supabase.table("dte_caf_folios")\
                .update({"is_active": False})\
                .eq("organization_id", ORGANIZATION_ID)\
                .eq("company_id", COMPANY_ID)\
                .eq("tipo_dte", tipo_dte)\
                .eq("environment", environment)\
                .execute()

            # Insertar el nuevo folio CAF
            supabase.table("dte_caf_folios").insert(caf_data).execute()
            print(f"[OK] Importado: {filename} | Tipo DTE: {tipo_dte} | Rango: {range_start}-{range_end} | Ambiente: {environment}")
            return True
        except APIError as api_err:
            # Si ya existe por unicidad, ignorar y continuar
            if api_err.code == "23505":
                print(f"[EXISTE] Ya registrado: {filename} | Tipo DTE: {tipo_dte} | Rango: {range_start}-{range_end} | Ambiente: {environment}")
                return True
            else:
                raise api_err
    except Exception as e:
        print(f"[ERROR] Al procesar {filename}: {str(e)}")
        return False

def run_import():
    base_dir = r"C:\Users\Matías Riquelme\Desktop\SistemaOC\caf"
    
    # 1. Importar Certificación
    cert_dir = os.path.join(base_dir, "cert")
    print(f"Procesando directorio de Certificacion: {cert_dir}")
    if os.path.exists(cert_dir):
        files = [os.path.join(cert_dir, f) for f in os.listdir(cert_dir) if f.endswith(".xml")]
        print(f"Encontrados {len(files)} archivos XML de certificacion.")
        imported = 0
        for f in files:
            if import_caf_file(f, "certification"):
                imported += 1
        print(f"Certificacion finalizada. Procesados: {imported}/{len(files)}\n")
    else:
        print("Directorio de certificacion no encontrado.\n")

    # 2. Importar Producción
    prod_dir = os.path.join(base_dir, "prod")
    print(f"Procesando directorio de Produccion: {prod_dir}")
    if os.path.exists(prod_dir):
        files = [os.path.join(prod_dir, f) for f in os.listdir(prod_dir) if f.endswith(".xml")]
        print(f"Encontrados {len(files)} archivos XML de produccion.")
        imported = 0
        for f in files:
            if import_caf_file(f, "production"):
                imported += 1
        print(f"Produccion finalizada. Procesados: {imported}/{len(files)}\n")
    else:
        print("Directorio de produccion no encontrado.\n")

if __name__ == "__main__":
    run_import()
