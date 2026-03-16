
import os
from supabase import create_client
from dotenv import load_dotenv
import json

load_dotenv("engine/.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

res_orgs = supabase.table("organizations").select("*").limit(5).execute()
for org in res_orgs.data:
    org_id = org['id']
    count = supabase.table("journal_entries").select("*", count="exact").eq("organization_id", org_id).execute()
    print(f"Org: {org['nombre']} ({org_id}) -> Entries: {count.count}")

# Check schema more broadly
try:
    res = supabase.table("journal_entries").select("*").limit(1).execute()
    print("\nJournal Entry Record Example:")
    print(json.dumps(res.data[0] if res.data else "No data", indent=2))
except Exception as e:
    print(f"Schema Error: {e}")
