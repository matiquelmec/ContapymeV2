import os
import psycopg2
from dotenv import load_dotenv

def query_import_logs():
    load_dotenv('.env')
    db_url = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
    
    org_id = "19b78bd1-6019-4329-bd8d-b75d5ae9049d" # Inversiones Riquelme
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Consultar si hay rcv_imports para este periodo
        cur.execute("""
            SELECT id, periodo, tipo, total_docs, error_log 
            FROM public.rcv_imports 
            WHERE organization_id = %s;
        """, (org_id,))
        res = cur.fetchall()
        print("=== REGISTROS DE IMPORTACIONES RCV ===")
        for r in res:
            print(f"ID: {r[0]} | Periodo: {r[1]} | Tipo: {r[2]} | Docs: {r[3]} | Errores: {r[4]}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    query_import_logs()
