import psycopg2
import os

DATABASE_URL = "postgresql://postgres:Matigol1234.@db.mofkjgfrpfmtnktaepqi.supabase.co:5432/postgres"

def discover_schema():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    tables = ['journal_entries', 'chart_of_accounts', 'centralized_account_config']
    
    for table in tables:
        print(f"\n--- Schema for {table} ---")
        cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
        columns = cur.fetchall()
        for col in columns:
            print(f"{col[0]}: {col[1]}")
            
    # Also get some sample orgs
    print("\n--- Sample Organizations ---")
    cur.execute("SELECT id, nombre FROM organizations LIMIT 5")
    orgs = cur.fetchall()
    for org in orgs:
        print(f"ID: {org[0]}, Name: {org[1]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    discover_schema()
