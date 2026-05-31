import os, re
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
db = create_client(url, key)

# Get latest DTEs
res = db.table("dte_issued")\
    .select("id, folio, tipo_dte, status, track_id, error_log, created_at, xml_content")\
    .order("created_at", desc=True)\
    .limit(5)\
    .execute()

print("=== ULTIMAS 5 BOLETAS EMITIDAS ===\n")
for d in res.data:
    xml = d.get("xml_content") or ""
    ref_uri = re.search(r'<Reference\s+URI="([^"]*)"', xml)
    doc_id = re.search(r'<Documento\s+ID="([^"]*)"', xml)
    acteco = re.search(r'<Acteco>([^<]*)</Acteco>', xml)
    
    ref_str = ref_uri.group(1) if ref_uri else "N/A"
    doc_str = doc_id.group(1) if doc_id else "N/A"
    act_str = acteco.group(1) if acteco else "N/A"
    
    # Check signature match
    match_ok = ref_str == f"#{doc_str}" if ref_uri and doc_id else False
    sig_status = "OK" if match_ok else "MISMATCH"
    
    print(f"Folio {d['folio']} (Tipo {d['tipo_dte']}):")
    print(f"  ID:           {d['id']}")
    print(f"  Status:       {d['status']}")
    print(f"  Track ID:     {d['track_id']}")
    print(f"  Error Log:    {d['error_log']}")
    print(f"  Documento ID: {doc_str}")
    print(f"  Reference:    {ref_str}")
    print(f"  Firma:        {sig_status}")
    print(f"  Acteco:       {act_str}")
    print(f"  Creado:       {d['created_at']}")
    print()
