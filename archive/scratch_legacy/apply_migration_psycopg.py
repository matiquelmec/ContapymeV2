import os
import sys
from dotenv import load_dotenv
import psycopg2

def apply_migration():
    # Cargar .env de la raíz
    load_dotenv('.env')
    
    # La base de datos de Supabase en IPv4 a veces requiere usar el pooler si el host directo no resuelve.
    # Usaremos el host de pooler que provee Supabase para evitar fallos de DNS con IPv6 local.
    db_url = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
    
    migration_path = "supabase/migrations/19_migration_treasury_module.sql"
    if not os.path.exists(migration_path):
        print(f"Error: No se encuentra el archivo en {migration_path}")
        sys.exit(1)
        
    print("Conectando a la base de datos a traves del pooler (IPv4)...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        print(f"Leyendo {migration_path}...")
        with open(migration_path, "r", encoding="utf-8") as f:
            sql_content = f.read()
            
        print("Aplicando migración en Supabase...")
        cur.execute(sql_content)
        conn.commit()
        print("Migracion aplicada exitosamente.")
        
    except Exception as e:
        print(f"Error al aplicar migracion: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    apply_migration()
