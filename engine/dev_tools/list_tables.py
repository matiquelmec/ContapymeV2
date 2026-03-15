from core.database import get_supabase

def list_all_tables():
    db = get_supabase()
    # In Supabase, there isn't a direct "list tables" in the client, 
    # but we can try common names or use the API
    print("Listing some common tables to find dependencies...")
    checks = ["lre_registrations", "contracts", "payroll_items", "organization_payroll_settings", "payroll_config"]
    for t in checks:
        try:
            res = db.table(t).select("count", count="exact").limit(1).execute()
            print(f"Table {t} exists and has {res.count} rows")
        except:
            pass

if __name__ == "__main__":
    list_all_tables()
