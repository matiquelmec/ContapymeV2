from core.database import get_supabase
import json

db = get_supabase()

def find_account():
    res = db.table("chart_of_accounts").select("*").eq("codigo", "3456").execute()
    print(json.dumps(res.data, indent=2))

if __name__ == "__main__":
    find_account()
