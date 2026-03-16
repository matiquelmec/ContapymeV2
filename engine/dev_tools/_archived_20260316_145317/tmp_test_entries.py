
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("engine/.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

res = supabase.table("journal_entries").select("*").limit(1).execute()
print(res.data)
