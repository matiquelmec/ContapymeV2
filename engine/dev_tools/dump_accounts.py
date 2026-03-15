from core.database import get_supabase
import json

db = get_supabase()

def debug_accounts():
    accounts = db.table("chart_of_accounts").select("*").execute()
    data = {
        "chart_of_accounts_count": len(accounts.data),
        "sample": accounts.data[:5] if accounts.data else []
    }
    with open("accounts_summary.json", "w") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    debug_accounts()
