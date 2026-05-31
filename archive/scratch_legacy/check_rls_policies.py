import psycopg2

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
            print(f"{'Tabla':<30} | {'Nombre de Política':<30} | {'Comando':<10}")
            print("-" * 76)
            for row in rows:
                print(f"{row[1]:<30} | {row[2]:<30} | {row[5]:<10}")
            
            # También auditaremos si hay tablas habilitadas para RLS pero SIN políticas
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
                print("\n⚠️ TABLAS CON RLS HABILITADO PERO SIN NINGUNA POLÍTICA (Acceso denegado por defecto):")
                for t in no_policy_tables:
                    print(f"- {t[0]}")
            else:
                print("\n✅ Todas las tablas habilitadas para RLS tienen al menos una política definida.")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
