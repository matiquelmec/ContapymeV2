import os
import psycopg2
import re
from dotenv import load_dotenv

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")
match = re.search(r"postgresql://([^:]+):([^@]+)@db\.([^.]+)\.supabase\.co:5432/(.+)", db_url)
user_base, password, project_ref, dbname = match.groups()

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
    # 1. Obtener la organización activa o las disponibles
    cur.execute("SELECT id, nombre, rut_empresa FROM organizations;")
    orgs = cur.fetchall()
    print("=== ORGANIZACIONES ===")
    org_id = None
    for o in orgs:
        print(f"ID: {o[0]} | Nombre: {o[1]} | RUT: {o[2]}")
        if "rodríguez" in o[1].lower() or "rodriguez" in o[1].lower() or "77411206" in o[2]:
            org_id = o[0]
            
    org_id = "be168b8e-8906-49e5-86e1-6a75919024ba"
    print(f"\nAuditando organización ID: {org_id}")
    
    # 2. Consultar dte_issued
    cur.execute("""
        SELECT id, tipo_dte, folio, status, payment_status, monto_total, created_at 
        FROM dte_issued 
        WHERE organization_id = %s
        ORDER BY tipo_dte, folio;
    """, (org_id,))
    dtes = cur.fetchall()
    print(f"\n=== DTE ISSUED ({len(dtes)} documentos) ===")
    for d in dtes:
        print(f"ID: {d[0]} | Tipo DTE: {d[1]} | Folio: {d[2]} | Status: {d[3]} | Payment Status: {d[4]} | Monto: {d[5]} | Creado: {d[6]}")
        
    # 3. Consultar sales_records (RCV)
    cur.execute("""
        SELECT id, tipo_documento, folio, rut_receptor, monto_total, payment_status, journal_entry_id 
        FROM sales_records 
        WHERE organization_id = %s
        ORDER BY tipo_documento, folio;
    """, (org_id,))
    rcv = cur.fetchall()
    print(f"\n=== SALES RECORDS / RCV ({len(rcv)} documentos) ===")
    for r in rcv:
        print(f"ID: {r[0]} | Tipo: {r[1]} | Folio: {r[2]} | Rut Rec: {r[3]} | Monto: {r[4]} | Payment: {r[5]} | Asiento Contable: {r[6]}")

    # 4. Consultar journal_entries
    cur.execute("SELECT * FROM journal_entries LIMIT 1;")
    col_names = [desc[0] for desc in cur.description]
    print(f"\nJournal Entries columns: {col_names}")
    
    # Usar columnas dinámicas para evitar fallos de compilación/ejecución
    concept_col = "description" if "description" in col_names else ("glosa" if "glosa" in col_names else "concept")
    date_col = "date" if "date" in col_names else "fecha"
    
    cur.execute(f"""
        SELECT id, {concept_col}, {date_col}, created_at 
        FROM journal_entries 
        WHERE organization_id = %s
        ORDER BY {date_col}, created_at;
    """, (org_id,))
    entries = cur.fetchall()
    print(f"\n=== JOURNAL ENTRIES / LIBRO DIARIO ({len(entries)} asientos) ===")
    for e in entries:
        print(f"ID: {e[0]} | Concepto: {e[1]} | Fecha: {e[2]} | Creado: {e[3]}")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    cur.close()
    conn.close()
