import os
import sys
import psycopg2
import re
from dotenv import load_dotenv

# Configurar path de Python para poder importar core
sys.path.append(r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine")

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

org_id = "be168b8e-8906-49e5-86e1-6a75919024ba"

try:
    print("=== INICIANDO REPARACIÓN DE INCONSISTENCIAS ===")

    # ==========================================
    # REPARACIÓN 1: Factura Folio 2 (DTE 33)
    # ==========================================
    # 1. Obtener detalles de dte_issued para Factura Folio 2
    cur.execute("""
        SELECT id, fecha_emision, receptor_rut, receptor_razon_social, monto_neto, monto_iva, monto_total
        FROM dte_issued
        WHERE organization_id = %s AND tipo_dte = 33 AND folio = 2;
    """, (org_id,))
    fact_dte = cur.fetchone()
    
    if fact_dte:
        fact_id, fecha, rut, razon_social, neto, iva, total = fact_dte
        print(f"\n1. Reparando Factura Folio 2 (DTE ID: {fact_id})...")
        
        # Insertar en sales_records (RCV)
        periodo = fecha.strftime("%Y-%m-%d")[:7] + "-01"
        cur.execute("""
            INSERT INTO sales_records (
                organization_id, periodo, tipo_documento, folio, rut_receptor, 
                razon_social_receptor, fecha_docto, monto_neto, monto_exento, 
                monto_iva, monto_total, monto_calculado, es_suma, payment_status
            ) VALUES (%s, %s, '33', %s, %s, %s, %s, %s, 0, %s, %s, %s, true, 'pending')
            ON CONFLICT (organization_id, folio, rut_receptor, periodo, tipo_documento) DO NOTHING
            RETURNING id;
        """, (org_id, periodo, 2, rut, razon_social, fecha, neto, iva, total, total))
        sales_rec = cur.fetchone()
        
        if sales_rec:
            sales_rec_id = sales_rec[0]
            print(f"   -> Registro RCV insertado con ID: {sales_rec_id}")
        else:
            cur.execute("""
                SELECT id FROM sales_records 
                WHERE organization_id = %s AND tipo_documento = '33' AND folio = 2;
            """, (org_id,))
            sales_rec_id = cur.fetchone()[0]
            print(f"   -> Registro RCV ya existía con ID: {sales_rec_id}")
            
        conn.commit()
        
        # Ejecutar centralización contable usando centralize_dte_accounting
        import asyncio
        from core.dte.dte_centralizer import centralize_dte_accounting
        
        print("   -> Centralizando contabilidad para Factura Folio 2...")
        loop = asyncio.get_event_loop()
        res = loop.run_until_complete(centralize_dte_accounting(fact_id, org_id))
        print(f"   -> Resultado de Centralización: {res}")
    else:
        print("\n[!] No se encontró el DTE de la Factura Folio 2 en dte_issued.")

    # ==========================================
    # REPARACIÓN 2: Boleta Folio 3 (DTE 39)
    # ==========================================
    # 1. Obtener detalles de dte_issued para Boleta Folio 3
    cur.execute("""
        SELECT id, fecha_emision, receptor_rut, receptor_razon_social, monto_neto, monto_iva, monto_total
        FROM dte_issued
        WHERE organization_id = %s AND tipo_dte = 39 AND folio = 3;
    """, (org_id,))
    boleta_dte = cur.fetchone()
    
    if boleta_dte:
        bol_id, fecha, rut, razon_social, neto, iva, total = boleta_dte
        print(f"\n2. Reparando Boleta Folio 3 (DTE ID: {bol_id})...")
        
        # Insertar en sales_records (RCV) enlazado al asiento existente
        periodo = fecha.strftime("%Y-%m-%d")[:7] + "-01"
        journal_id = "21461eae-a846-4b7d-98d9-f0ef5e1def6b" # ID del asiento existente
        
        cur.execute("""
            INSERT INTO sales_records (
                organization_id, periodo, tipo_documento, folio, rut_receptor, 
                razon_social_receptor, fecha_docto, monto_neto, monto_exento, 
                monto_iva, monto_total, monto_calculado, es_suma, journal_entry_id, payment_status
            ) VALUES (%s, %s, '39', %s, %s, %s, %s, %s, 0, %s, %s, %s, true, %s, 'pending')
            ON CONFLICT (organization_id, folio, rut_receptor, periodo, tipo_documento) DO NOTHING
            RETURNING id;
        """, (org_id, periodo, 3, rut, razon_social, fecha, neto, iva, total, total, journal_id))
        bol_sales = cur.fetchone()
        
        if bol_sales:
            bol_sales_rec_id = bol_sales[0]
            print(f"   -> Registro RCV insertado con ID: {bol_sales_rec_id}")
        else:
            cur.execute("""
                SELECT id FROM sales_records 
                WHERE organization_id = %s AND tipo_documento = '39' AND folio = 3;
            """, (org_id,))
            bol_sales_rec_id = cur.fetchone()[0]
            print(f"   -> Registro RCV ya existía con ID: {bol_sales_rec_id}")
            
        # Buscar el cobro de tesorería existente para enlazarlo
        cur.execute("""
            SELECT id FROM treasury_payments 
            WHERE organization_id = %s AND referencia = 'Boleta 3';
        """, (org_id,))
        payment = cur.fetchone()
        
        if payment:
            payment_id = payment[0]
            print(f"   -> Pago de Tesorería encontrado con ID: {payment_id}")
            
            # Insert el enlace en treasury_payment_documents
            cur.execute("""
                INSERT INTO treasury_payment_documents (
                    organization_id, payment_id, document_type, document_id, monto_aplicado
                ) VALUES (%s, %s, 'sales_record', %s, %s)
                ON CONFLICT DO NOTHING;
            """, (org_id, payment_id, bol_sales_rec_id, total))
            print("   -> Enlace insertado en treasury_payment_documents.")
        else:
            print("   -> [!] No se encontró el cobro en treasury_payments para 'Boleta 3'.")
            
        conn.commit()
    else:
        print("\n[!] No se encontró el DTE de la Boleta Folio 3 en dte_issued.")

    print("\n=== REPARACIÓN COMPLETADA EXITOSAMENTE ===")

except Exception as e:
    conn.rollback()
    print(f"\n[❌] Error al realizar la reparación: {e}")
finally:
    cur.close()
    conn.close()
