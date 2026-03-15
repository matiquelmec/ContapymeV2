from core.database import get_supabase

def check_schema():
    db = get_supabase()
    tables = ["organizations", "employees", "organization_payroll_settings"]
    for table in tables:
        try:
            res = db.table(table).select("*").execute()
            print(f"TABLA: {table} | REGISTROS: {len(res.data)}")
            for r in res.data:
                print(f"  - {r.get('nombre') or r.get('nombres') or r.get('id')}")
        except Exception as e:
            print(f"ERROR EN {table}: {e}")

if __name__ == "__main__":
    check_schema()
