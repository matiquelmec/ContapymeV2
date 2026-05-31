import os
import psycopg2
from dotenv import load_dotenv

def audit_mirodrigcab():
    load_dotenv('.env')
    db_url = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Obtener columnas de la tabla dte_companies
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='dte_companies';")
        cols = [c[0] for c in cur.fetchall()]
        print(f"Columnas en dte_companies: {cols}")
        
        org_id = "be168b8e-8906-49e5-86e1-6a75919024ba" # Tecnologa rodriguez Saldivia spa
        
        cur.execute(f"SELECT * FROM public.dte_companies WHERE organization_id = %s;", (org_id,))
        rows = cur.fetchall()
        print("\n=== REGISTROS EN DTE_COMPANIES ===")
        for r in rows:
            print(dict(zip(cols, r)))
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    audit_mirodrigcab()
