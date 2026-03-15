from core.database import get_supabase
import json

def test():
    db = get_supabase()
    try:
        res = db.table("organizations").select("id, nombre").limit(1).execute()
        print(f"ORGS: {json.dumps(res.data)}")
        
        # Test if table exists
        try:
            res_config = db.table("centralized_account_config").select("*").limit(1).execute()
            print(f"CONFIG TABLE OK: {json.dumps(res_config.data)}")
        except Exception as e:
            print(f"CONFIG TABLE ERROR: {str(e)}")
    except Exception as e:
        print(f"GENERIC ERROR: {str(e)}")

if __name__ == "__main__":
    test()
