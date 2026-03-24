import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv("engine/.env")

if __name__ == "__main__":
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found")
        exit(1)

    migration_file = sys.argv[1] if len(sys.argv) > 1 else "supabase/migrations/20260323030000_onboarding_flag.sql"
    print(f"Applying migration: {migration_file}")
    print(f"Target: {db_url.split('@')[-1]}")
    
    with open(migration_file, "r", encoding="utf-8") as f:
        sql = f.read()

    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(sql)
        print("✅ Migración aplicada exitosamente mediante psycopg2!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
