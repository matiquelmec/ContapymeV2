from core.database import get_supabase
import json

db = get_supabase()

def debug_users():
    memberships = db.table("organization_members").select("*").execute()
    data = {
        "organization_members": memberships.data
    }
    with open("members_summary.json", "w") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    debug_users()
