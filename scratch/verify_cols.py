import os
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
db = create_client(url, key)

res = db.table("dte_issued").select("*").limit(1).execute()
if res.data:
    print("Columns found in dte_issued:")
    for col in sorted(res.data[0].keys()):
        print(f"  - {col}")
else:
    print("No data in dte_issued")
