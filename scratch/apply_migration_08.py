import psycopg2
import os

DB_URL = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

def main():
    print("Aplicando Migración 08...")
    migration_path = "supabase/migrations/08_migration_accounting_events.sql"
    
    if not os.path.exists(migration_path):
        print(f"Error: {migration_path} no existe.")
        return

    with open(migration_path, 'r', encoding='utf-8') as f:
        sql = f.read()

    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        with conn.cursor() as cur:
            # Ejecutar el SQL de la migración completo
            cur.execute(sql)
            print("Migración 08 aplicada con éxito!")
        conn.close()
    except Exception as e:
        print(f"Error al aplicar la migración: {e}")

if __name__ == "__main__":
    main()
