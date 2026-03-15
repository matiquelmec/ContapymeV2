from core.database import get_supabase
import json

db = get_supabase()

def full_dump():
    orgs = db.table("organizations").select("*").execute()
    members = db.table("organization_members").select("*").execute()
    
    print(f"Total Organizations: {len(orgs.data)}")
    for o in orgs.data:
        print(f" - {o['nombre']} ({o['rut_empresa']}) ID: {o['id']}")
        
    print(f"\nTotal Memberships: {len(members.data)}")
    for m in members.data:
        print(f" - Org: {m['organization_id']} User: {m['user_id']}")

if __name__ == "__main__":
    full_dump()
