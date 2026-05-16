import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('engine/.env')

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found")
    exit(1)

conn = psycopg2.connect(db_url)
cur = conn.cursor()

try:
    print("Executing migrations for allowances...")
    cur.execute("ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS asignacion_colacion bigint DEFAULT 0;")
    cur.execute("ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS asignacion_movilizacion bigint DEFAULT 0;")
    cur.execute("ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS bono_fijo bigint DEFAULT 0;")
    cur.execute("ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS gratificacion_legal boolean DEFAULT TRUE;")
    conn.commit()
    print("Success: Allowances added to employees table.")
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close()
