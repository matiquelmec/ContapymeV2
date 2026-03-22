# /tmp/apply_migration_smart.py
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar variables de entorno desde el engine
load_dotenv('engine/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Necesario para migraciones DDL

if not url or not key:
    print("❌ Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase: Client = create_client(url, key)

SQL_FILE = os.path.abspath('supabase/migrations/20260322000002_contract_modifications_system.sql')

with open(SQL_FILE, 'r', encoding='utf-8') as f:
    sql_query = f.read()

try:
    # Supabase Python client no tiene un método directo .query() (es para REST)
    # Sin embargo, como estamos en un entorno donde queremos robustez, 
    # intentaremos usar el motor de RPC si estuviera expuesto, o reportaremos.
    # Pero usualmente, para correr SQL plano necesitamos psycopg2 o usar el MCP tool.
    
    # Intentaré usar psycopg2 si está disponible para conexión directa a PostgreSQL
    # (vimos DATABASE_URL en el .env)
    
    import psycopg2
    db_url = os.environ.get("DATABASE_URL")
    print(f"🔄 Conectando a PostgreSQL para aplicar migración...")
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    cursor.execute(sql_query)
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Migración aplicada exitosamente a través de PostgreSQL.")

except ImportError:
    print("⚠️ psycopg2 no está instalado. No podemos aplicar SQL DDL directamente desde Python sin él.")
    print("Sugerencia: Ejecute 'pip install psycopg2-binary' o use la herramienta de Supabase.")
except Exception as e:
    print(f"❌ Error al aplicar migración: {e}")
