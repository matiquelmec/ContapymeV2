import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("engine/.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("FAILURE: Missing credentials")
    exit(1)

try:
    supabase = create_client(url, key)
    # Probar una consulta simple
    res = supabase.table("organizations").select("count", count="exact").limit(1).execute()
    print(f"SUCCESS: Connected to Supabase. Org count: {res.count}")
except Exception as e:
    print(f"FAILURE: {e}")
