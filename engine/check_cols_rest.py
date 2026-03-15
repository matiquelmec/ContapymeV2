import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

try:
    res = supabase.table("employee_terminations").select("*").limit(1).execute()
    if res.data:
        print("Columnas encontradas:", list(res.data[0].keys()))
    else:
        print("La tabla está vacía, no se pueden inferir columnas via REST.")
except Exception as e:
    print(f"Error: {e}")
