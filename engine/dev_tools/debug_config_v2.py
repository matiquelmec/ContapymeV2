from core.database import get_supabase
import json
import sys

db = get_supabase()

def check_config():
    try:
        print("--- ORGANIZATIONS ---")
        orgs = db.table("organizations").select("id, name").execute()
        print(json.dumps(orgs.data, indent=2))
        
        print("\n--- ACCOUNT CONFIGS ---")
        configs = db.table("centralized_account_config").select("id, organization_id, module_name, transaction_type").execute()
        print(json.dumps(configs.data, indent=2))
        
        if orgs.data and configs.data:
            org_ids_with_config = set(c['organization_id'] for c in configs.data)
            all_org_ids = [o['id'] for o in orgs.data]
            
            print("\n--- ANALYSIS ---")
            for o_id in all_org_ids:
                if o_id in org_ids_with_config:
                    print(f"Organization {o_id} HAS configurations.")
                else:
                    print(f"Organization {o_id} MISSING configurations.")
                    
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_config()
