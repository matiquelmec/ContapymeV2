import os
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
db = create_client(url, key)

COMP_MIGUEL = "b924fd19-39f6-4f1c-93de-fe7f01f26bae"

print("Updating company ACTECO to 620100...")
res = db.table("dte_companies")\
    .update({"acteco": 620100})\
    .eq("id", COMP_MIGUEL)\
    .execute()

if res.data:
    print("Success! Updated company record:")
    print(res.data[0])
else:
    print("Failed to update company.")
