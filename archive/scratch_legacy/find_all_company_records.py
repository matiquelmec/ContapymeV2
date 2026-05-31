import os
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
db = create_client(url, key)

res = db.table("dte_companies")\
    .select("id, organization_id, rut, razon_social, acteco, created_at")\
    .eq("rut", "77411206-5")\
    .execute()

print("\n=== REGISTROS DE EMPRESA PARA RUT 77411206-5 ===")
for i, c in enumerate(res.data, 1):
    print(f"Empresa {i}:")
    print(f"  ID:              {c['id']}")
    print(f"  Organization ID: {c['organization_id']}")
    print(f"  RUT:             {c['rut']}")
    print(f"  Razon Social:    {c['razon_social']}")
    print(f"  ACTECO:          '{c['acteco']}'")
    print(f"  Creado:          {c['created_at']}")
    print()
