import os
import psycopg2
from dotenv import load_dotenv

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")
import re
match = re.search(r"postgresql://([^:]+):([^@]+)@db\.([^.]+)\.supabase\.co:5432/(.+)", db_url)
user_base, password, project_ref, dbname = match.groups()

# Conectar al host correcto aws-1-us-east-2.pooler.supabase.com
host = "aws-1-us-east-2.pooler.supabase.com"
pooler_user = f"{user_base}.{project_ref}"

conn = psycopg2.connect(
    host=host,
    port=6543,
    user=pooler_user,
    password=password,
    database=dbname
)
cur = conn.cursor()

try:
    print("1. Eliminando el constraint unico antiguo en sales_records...")
    cur.execute("ALTER TABLE sales_records DROP CONSTRAINT IF EXISTS sales_records_unique_doc;")
    
    print("2. Creando el nuevo constraint unico incluyendo tipo_documento...")
    cur.execute("ALTER TABLE sales_records ADD CONSTRAINT sales_records_unique_doc UNIQUE (organization_id, folio, rut_receptor, periodo, tipo_documento);")
    
    # 3. Restaurar el RUT receptor correcto en la Boleta Folio 1 ahora que el constraint lo permite
    print("3. Restaurando RUT receptor en la Boleta Folio 1...")
    cur.execute("""
        UPDATE sales_records 
        SET rut_receptor = '18209442-0' 
        WHERE organization_id = %s 
          AND folio = 1 
          AND tipo_documento = '39' 
          AND rut_receptor = '18209442-0-B';
    """, (org_id := "be168b8e-8906-49e5-86e1-6a75919024ba",))
    
    conn.commit()
    print("\n¡Solucion definitiva aplicada con exito!")
    
except Exception as e:
    conn.rollback()
    print(f"Error al aplicar la solucion definitiva: {e}")
finally:
    cur.close()
    conn.close()
