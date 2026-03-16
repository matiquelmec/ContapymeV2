import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("engine/.env")
url = os.environ.get("DATABASE_URL")

sql = """
SELECT 
    periodo, 
    tipo, 
    file_name, 
    total_docs, 
    created_at 
FROM 
    public.rcv_imports 
ORDER BY 
    periodo DESC, created_at DESC;
"""

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall()
    
    print("📊 Auditoría de RCV_IMPORTS:")
    print("-" * 80)
    print(f"{'Periodo':<12} | {'Tipo':<10} | {'Docs':<5} | {'Archivo':<40} | {'Fecha Carga'}")
    print("-" * 80)
    for row in rows:
        print(f"{str(row[0]):<12} | {row[1]:<10} | {row[3]:<5} | {row[2]:<40} | {str(row[4])[:19]}")
    
except Exception as e:
    print(f"FAILURE: {e}")
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
