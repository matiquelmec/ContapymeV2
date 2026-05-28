import os
from dotenv import load_dotenv
from supabase import create_client
import xml.etree.ElementTree as ET

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
db = create_client(url, key)

res = db.table("dte_issued")\
    .select("xml_content")\
    .eq("folio", 10)\
    .eq("tipo_dte", 39)\
    .execute()

if res.data and res.data[0]["xml_content"]:
    xml_str = res.data[0]["xml_content"]
    
    # Simple search in XML string to avoid namespaces complexity in printing
    import re
    doc_id = re.search(r'<Documento\s+ID="([^"]+)"', xml_str)
    ref_uri = re.search(r'<Reference\s+URI="([^"]+)"', xml_str)
    acteco = re.search(r'<Acteco>([^<]+)</Acteco>', xml_str)
    
    print("\n=== VERIFICACIÓN XML FOLIO 10 ===")
    if doc_id:
        print(f"  Documento ID:   {doc_id.group(0)}")
    else:
        print("  Documento ID no encontrado.")
        
    if ref_uri:
        print(f"  Reference URI:  {ref_uri.group(0)}")
    else:
        print("  Reference URI no encontrado.")
        
    if acteco:
        print(f"  Acteco:         {acteco.group(0)}")
    else:
        print("  Acteco no encontrado.")
        
    # Check match
    if doc_id and ref_uri:
        expected_uri = f"#{doc_id.group(1)}"
        actual_uri = ref_uri.group(1)
        if expected_uri == actual_uri:
            print("\n  ✅ COINCIDENCIA EXITOSA: La firma hace referencia correcta al ID del documento.")
        else:
            print(f"\n  ❌ DISCREPANCIA: Se esperaba URI='{expected_uri}' pero se encontró '{actual_uri}'.")
else:
    print("No se encontró XML firmado para el Folio 10.")
