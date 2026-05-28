import os
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
db = create_client(url, key)

print("Updating ACTECO to '620100' for all company records with RUT 77411206-5...")
res = db.table("dte_companies")\
    .update({"acteco": "620100"})\
    .eq("rut", "77411206-5")\
    .execute()

print(f"Updated {len(res.data)} company records:")
for c in res.data:
    print(f"  ID: {c['id']} | Org ID: {c['organization_id']} | ACTECO: '{c['acteco']}'")
