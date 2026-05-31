import psycopg2

DB_URL = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

def main():
    print("Aplicando Migración 10...")
    with open("supabase/migrations/10_migration_security_and_performance.sql", 'r', encoding='utf-8') as f:
        sql = f.read()

    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(sql)
            print("Migración 10 aplicada con éxito!")
        conn.close()
    except Exception as e:
        print(f"Error al aplicar la migración: {e}")

if __name__ == "__main__":
    main()
