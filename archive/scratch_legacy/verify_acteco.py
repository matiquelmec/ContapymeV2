import os
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
db = create_client(url, key)

COMP_MIGUEL = "b924fd19-39f6-4f1c-93de-fe7f01f26bae"

# 1. Update as string
try:
    print("Updating company ACTECO to '620100'...")
    res = db.table("dte_companies")\
        .update({"acteco": "620100"})\
        .eq("id", COMP_MIGUEL)\
        .execute()
    print("Update result data:", res.data)
except Exception as e:
    print("Update failed with error:", e)

# 2. Verify
res2 = db.table("dte_companies")\
    .select("id, acteco")\
    .eq("id", COMP_MIGUEL)\
    .execute()
print("Current company ACTECO in DB:", res2.data)
