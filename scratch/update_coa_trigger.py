import psycopg2

DATABASE_URL = "postgresql://postgres.mofkjgfrpfmtnktaepqi:Matigol1234.@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

def update_trigger_and_migrate():
    print("[*] Conectando a Supabase para actualizar trigger y migrar jerarquía...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()
    
    try:
        # 1. Crear o reemplazar la función con soporte de análisis por puntos
        print("[*] Reemplazando función sync_coa_parent_id...")
        cur.execute("""
        CREATE OR REPLACE FUNCTION sync_coa_parent_id()
        RETURNS TRIGGER AS $$
        DECLARE
            v_parent_code text;
        BEGIN
            IF NEW.parent_id IS NULL THEN
                IF NEW.parent_codigo IS NOT NULL AND NEW.parent_codigo <> '' THEN
                    SELECT id INTO NEW.parent_id 
                    FROM public.chart_of_accounts 
                    WHERE organization_id = NEW.organization_id AND codigo = NEW.parent_codigo
                    LIMIT 1;
                ELSE
                    -- Obtener el código del padre quitando el último segmento con puntos. E.g. '1.1.01.001' -> '1.1.01'
                    v_parent_code := substring(NEW.codigo from '^(.*)\.[^.]+$');
                    IF v_parent_code IS NOT NULL AND v_parent_code <> '' THEN
                        SELECT id INTO NEW.parent_id
                        FROM public.chart_of_accounts
                        WHERE organization_id = NEW.organization_id AND codigo = v_parent_code
                        LIMIT 1;
                        NEW.parent_codigo := v_parent_code;
                    END IF;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """)
        
        # Re-crear el trigger BEFORE INSERT OR UPDATE
        print("[*] Re-creando trigger trg_sync_coa_parent_id...")
        cur.execute("DROP TRIGGER IF EXISTS trg_sync_coa_parent_id ON public.chart_of_accounts;")
        cur.execute("""
        CREATE TRIGGER trg_sync_coa_parent_id
        BEFORE INSERT OR UPDATE OF codigo, parent_codigo, parent_id ON public.chart_of_accounts
        FOR EACH ROW
        EXECUTE FUNCTION sync_coa_parent_id();
        """)
        
        # 2. Migrar datos históricos resolviendo los parent_id y parent_codigo basados en el patrón de puntos
        print("[*] Ejecutando migración de datos históricos para la jerarquía...")
        # Primero, actualizamos parent_codigo y parent_id en lote usando la misma lógica
        cur.execute("""
        WITH parent_resolve AS (
            SELECT 
                child.id as child_id,
                parent.id as resolved_parent_id,
                parent.codigo as resolved_parent_code
            FROM public.chart_of_accounts child
            JOIN public.chart_of_accounts parent 
              ON child.organization_id = parent.organization_id 
             AND parent.codigo = substring(child.codigo from '^(.*)\.[^.]+$')
            WHERE child.parent_id IS NULL
        )
        UPDATE public.chart_of_accounts c
        SET parent_id = r.resolved_parent_id,
            parent_codigo = r.resolved_parent_code
        FROM parent_resolve r
        WHERE c.id = r.child_id;
        """)
        rows_updated = cur.rowcount
        print(f"[+] Se actualizaron {rows_updated} cuentas en chart_of_accounts con jerarquía parent_id y parent_codigo.")
        
        # 3. Disparar trigger de sincronización en centralized_account_config para poblar account_config_entries
        print("[*] Ejecutando sincronización de centralized_account_config...")
        cur.execute("""
        UPDATE public.centralized_account_config
        SET updated_at = now();
        """)
        rows_config = cur.rowcount
        print(f"[+] Se actualizaron/sincronizaron {rows_config} configuraciones organizacionales.")
        
        conn.commit()
        print("[+] Proceso completado con éxito en Supabase!")
        
        # Verificaciones
        cur.execute("SELECT COUNT(*) FROM public.chart_of_accounts WHERE parent_id IS NOT NULL;")
        print("Total cuentas con parent_id poblado:", cur.fetchone()[0])
        
        cur.execute("SELECT COUNT(*) FROM public.account_config_entries;")
        print("Total entradas en account_config_entries:", cur.fetchone()[0])
        
    except Exception as e:
        conn.rollback()
        print("[-] Error durante el proceso:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    update_trigger_and_migrate()
