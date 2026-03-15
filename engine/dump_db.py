from core.database import get_supabase
import json

db = get_supabase()

def debug():
    with open("db_summary.json", "w") as f:
        orgs = db.table("organizations").select("*").execute()
        configs = db.table("centralized_account_config").select("*").execute()
        
        data = {
            "organizations": orgs.data,
            "centralized_account_config": configs.data
        }
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    debug()
