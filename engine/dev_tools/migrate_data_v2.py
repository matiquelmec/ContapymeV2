import os
import psycopg2
from dotenv import load_dotenv

# Cargar .env de engine
load_dotenv(dotenv_path="engine/.env")

# URL de pooler de base de datos
DATABASE_URL = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

def migrate_historical_data():
    print("[*] Conectando a Supabase PostgreSQL via Pooler IPv4...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False  # Usaremos transacciones para seguridad
        cursor = conn.cursor()
        
        # 1. Migrar jerarquía en chart_of_accounts (parent_id)
        print("[*] Migrando jerarquía en chart_of_accounts (poblando parent_id)...")
        update_coa_query = """
        UPDATE public.chart_of_accounts child
        SET parent_id = parent.id
        FROM public.chart_of_accounts parent
        WHERE child.organization_id = parent.organization_id
          AND child.parent_codigo = parent.codigo
          AND child.parent_id IS NULL;
        """
        cursor.execute(update_coa_query)
        rows_updated_coa = cursor.rowcount
        print(f"[+] Se actualizaron {rows_updated_coa} registros con parent_id en chart_of_accounts.")
        
        # 2. Migrar configuraciones de cuentas (centralized_account_config)
        # Haremos un UPDATE dummy en la tabla para disparar el trigger trg_sync_legacy_config
        # que migrará automáticamente todos los datos a account_config_entries.
        print("[*] Disparando trigger de sincronización en centralized_account_config...")
        update_config_query = """
        UPDATE public.centralized_account_config
        SET updated_at = now();
        """
        cursor.execute(update_config_query)
        rows_updated_config = cursor.rowcount
        print(f"[+] Se actualizaron/procesaron {rows_updated_config} organizaciones en centralized_account_config.")
        
        # Confirmar cambios
        conn.commit()
        print("[+] ¡Migración completada y transaccion confirmada con éxito!")
        
        # 3. Verificación de conteos
        cursor.execute("SELECT COUNT(*) FROM public.chart_of_accounts WHERE parent_id IS NOT NULL;")
        coa_with_parent = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM public.chart_of_accounts WHERE parent_codigo IS NOT NULL;")
        coa_with_parent_code = cursor.fetchone()[0]
        print(f"[Verificación] Cuentas con parent_id: {coa_with_parent} (con parent_codigo: {coa_with_parent_code})")
        
        cursor.execute("SELECT COUNT(*) FROM public.account_config_entries;")
        entries_count = cursor.fetchone()[0]
        print(f"[Verificación] Entradas normalizadas en account_config_entries: {entries_count}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"[-] Error durante la migración: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    migrate_historical_data()
