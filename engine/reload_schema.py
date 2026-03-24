import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def reload():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL no configurado.")
        return
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("NOTIFY pgrst, 'reload schema';")
        conn.commit()
        cur.close()
        conn.close()
        print("🚀 Recarga de esquema de Supabase solicitada con éxito.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reload()
