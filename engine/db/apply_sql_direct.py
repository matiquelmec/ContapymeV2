import psycopg2
import os
from dotenv import load_dotenv

# Load env from engine/.env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

def apply_sql_direct(file_path):
    print(f"Aplicando {file_path} vía Direct PostgreSQL...")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL no encontrada en .env")
        return

    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        
        with open(file_path, "r", encoding="utf-8") as f:
            sql = f.read()
            
        cur.execute(sql)
        print("✅ SQL aplicado exitosamente.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error al aplicar SQL: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Uso: python apply_sql_direct.py <file.sql>")
    else:
        apply_sql_direct(sys.argv[1])
