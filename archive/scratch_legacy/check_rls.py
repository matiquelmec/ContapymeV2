import psycopg2

DB_URL = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

def main():
    try:
        conn = psycopg2.connect(DB_URL)
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    c.relname AS table_name,
                    c.relrowsecurity AS rls_enabled,
                    c.relforcerowsecurity AS force_rls
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' 
                  AND c.relkind = 'r'
                ORDER BY table_name;
            """)
            rows = cur.fetchall()
            print(f"{'Tabla':<35} | {'RLS Habilitado':<15} | {'Forzado':<10}")
            print("-" * 68)
            for row in rows:
                print(f"{row[0]:<35} | {str(row[1]):<15} | {str(row[2]):<10}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
