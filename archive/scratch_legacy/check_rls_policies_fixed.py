import psycopg2
import sys

DB_URL = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

def main():
    try:
        conn = psycopg2.connect(DB_URL)
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    policyname,
                    permissive,
                    roles,
                    cmd,
                    qual,
                    with_check
                FROM pg_policies
                WHERE schemaname = 'public'
                ORDER BY tablename, policyname;
            """)
            rows = cur.fetchall()
            print(f"{'Tabla':<30} | {'Nombre de Politica':<40} | {'Comando':<10}")
            print("-" * 86)
            for row in rows:
                pname = row[2].encode('ascii', 'replace').decode('ascii')
                tname = row[1].encode('ascii', 'replace').decode('ascii')
                cmd = str(row[5]).encode('ascii', 'replace').decode('ascii')
                print(f"{tname:<30} | {pname:<40} | {cmd:<10}")
            
            # Audit tables with RLS enabled but NO policies
            cur.execute("""
                SELECT 
                    c.relname AS table_name
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' 
                  AND c.relkind = 'r'
                  AND c.relrowsecurity = true
                  AND c.relname NOT IN (SELECT tablename FROM pg_policies WHERE schemaname = 'public')
                ORDER BY table_name;
            """)
            no_policy_tables = cur.fetchall()
            if no_policy_tables:
                print("\n[WARN] TABLAS CON RLS HABILITADO PERO SIN NINGUNA POLITICA (Acceso denegado por defecto):")
                for t in no_policy_tables:
                    print(f"- {t[0]}")
            else:
                print("\n[OK] Todas las tablas habilitadas para RLS tienen al menos una politica definida.")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
