import os
import psycopg2
from dotenv import load_dotenv

def query_folio_details():
    load_dotenv('.env')
    db_url = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
    
    org_id = "19b78bd1-6019-4329-bd8d-b75d5ae9049d" # Inversiones Riquelme
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # 1. Obtener detalles del Folio 6
        cur.execute("""
            SELECT id, folio, monto_neto, monto_exento, monto_iva, monto_total, monto_calculado, periodo, fecha_docto, tipo_documento
            FROM public.sales_records 
            WHERE organization_id = %s AND folio = 6;
        """, (org_id,))
        res = cur.fetchone()
        if res:
            print("=== DETALLES FOLIO 6 ===")
            print(f"ID: {res[0]}")
            print(f"Folio: {res[1]}")
            print(f"Monto Neto: {res[2]}")
            print(f"Monto Exento: {res[3]}")
            print(f"Monto IVA: {res[4]}")
            print(f"Monto Total: {res[5]}")
            print(f"Monto Calculado: {res[6]}")
            print(f"Periodo: {res[7]}")
            print(f"Fecha Docto: {res[8]}")
            print(f"Tipo Documento: {res[9]}")
        else:
            print("No se encontro el Folio 6 para esta empresa.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    query_folio_details()
