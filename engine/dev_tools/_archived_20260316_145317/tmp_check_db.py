import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def check_f29():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(url, key)
    
    res = supabase.table("f29_forms").select("*").execute()
    print(f"Total records in f29_forms: {len(res.data)}")
    for row in res.data:
        print(f"- Org: {row['organization_id']}, Periodo: {row['periodo']}")

if __name__ == "__main__":
    check_f29()
