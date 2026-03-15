from core.database import get_supabase
import json

db = get_supabase()

def check_config():
    orgs = db.table("organizations").select("id, name").execute()
    print(f"Organizations: {json.dumps(orgs.data, indent=2)}")
    
    configs = db.table("centralized_account_config").select("*").execute()
    print(f"Configs: {json.dumps(configs.data, indent=2)}")

if __name__ == "__main__":
    check_config()
