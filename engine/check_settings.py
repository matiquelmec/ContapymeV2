from core.database import get_supabase
import os
from dotenv import load_dotenv

load_dotenv('engine/.env')

def check():
    db = get_supabase()
    org_id = 'c9898c7d-2915-4e4f-9db6-4a818c60de11'
    res = db.table('organization_payroll_settings').select('*').eq('organization_id', org_id).maybe_single().execute()
    print(f"DEBUG | Data: {res.data}")

if __name__ == "__main__":
    check()
