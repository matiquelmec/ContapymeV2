import os
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
db = create_client(url, key)

res = db.table("dte_issued")\
    .select("id, folio, tipo_dte, status, track_id, error_log, created_at")\
    .eq("folio", 10)\
    .eq("tipo_dte", 39)\
    .execute()

if res.data:
    d = res.data[0]
    print("\n=== ESTADO DEL DTE FOLIO 10 ===")
    print(f"  ID:            {d['id']}")
    print(f"  Folio:         {d['folio']}")
    print(f"  Tipo DTE:      {d['tipo_dte']}")
    print(f"  Status:        {d['status']}")
    print(f"  Track ID SII:  {d['track_id']}")
    print(f"  Error Log:     {d['error_log']}")
    print(f"  Creado:        {d['created_at']}")
else:
    print("DTE Folio 10 Tipo 39 no encontrado en la base de datos.")
