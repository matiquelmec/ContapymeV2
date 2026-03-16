
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("engine/.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

# Get companies to pick one
res_orgs = supabase.table("organizations").select("*").limit(5).execute()
if not res_orgs.data:
    print("No organizations found")
    exit(0)

org = res_orgs.data[0]
org_id = org['id']
print(f"Testing for Org: {org['nombre']} ({org_id})")

# Test query WITHOUT monto_total
print("\nQuerying WITHOUT monto_total...")
res = supabase.table("journal_entries").select("id, fecha, glosa, lines:journal_entry_lines(*)").eq("organization_id", org_id).limit(5).execute()
if res.data:
    print(f"Success! Found {len(res.data)} entries.")
    for entry in res.data:
        print(f"Entry: {entry['glosa']} - Lines: {len(entry.get('lines', []))}")
else:
    print("No entries found for this org (even without monto_total)")

# Test query WITH monto_total (should fail)
print("\nQuerying WITH monto_total...")
try:
    res_fail = supabase.table("journal_entries").select("id, monto_total").eq("organization_id", org_id).limit(1).execute()
    print("Surprisingly worked?")
except Exception as e:
    print(f"Failed as expected: {e}")
