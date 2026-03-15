import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import date

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

dummy = {
    "organization_id": "00000000-0000-0000-0000-000000000000", # Will fail FK but show column error first
    "employee_id": "00000000-0000-0000-0000-000000000000",
    "fecha_inicio": date.today().isoformat(),
    "fecha_termino": date.today().isoformat(),
    "causal_despido": "test",
    "notice_indemnification_amount": 0
}

try:
    res = supabase.table("employee_terminations").insert(dummy).execute()
    print("Success?")
except Exception as e:
    print(f"Error: {e}")
