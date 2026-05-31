import os
import sys
from dotenv import load_dotenv
import psycopg2

def run_audit():
    load_dotenv('.env')
    db_url = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        print("=== AUDITORÍA DE SEGURIDAD (RLS) ===")
        # 1. Verificar si RLS está activo en las tablas del módulo
        tables = ['payment_methods', 'treasury_payments', 'treasury_payment_documents']
        for table in tables:
            cur.execute(f"""
                SELECT relrowsecurity 
                FROM pg_class 
                WHERE relname = '{table}' AND relnamespace = 'public'::regnamespace;
            """)
            res = cur.fetchone()
            status = "HABILITADO" if res and res[0] else "DESHABILITADO ⚠️"
            print(f"Tabla '{table}': RLS {status}")
            
        print("\n=== AUDITORÍA DE POLÍTICAS DE ACCESO ===")
        # 2. Listar políticas de seguridad
        cur.execute("""
            SELECT tablename, policyname, cmd, qual
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename IN ('payment_methods', 'treasury_payments', 'treasury_payment_documents');
        """)
        policies = cur.fetchall()
        for p in policies:
            print(f"Tabla: {p[0]} | Política: {p[1]} | Comando: {p[2]} | Restricción: {p[3]}")
            
    except Exception as e:
        print(f"Error en la auditoría: {e}")
        sys.exit(1)
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    run_audit()
