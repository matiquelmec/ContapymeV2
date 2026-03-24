from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('engine/.env')

def check_kardex():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    client = create_client(url, key)
    
    res = client.table("employment_contracts").select("*, employees(nombres)").limit(5).execute()
    print(f"Contracts: {res.data}")

if __name__ == "__main__":
    check_kardex()
