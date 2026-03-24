import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Usamos service role para DDL

if not url or not key:
    print("Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados.")
    exit(1)

supabase: Client = create_client(url, key)

migration_sql = """
-- 1. Enriquecer tabla de Activos Fijos con metadatos de Inventario
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS categoria character varying;
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS marca character varying;
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS modelo character varying;
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS ubicacion character varying;
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS responsable character varying;

-- 2. Link Contable en Journal Entries
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS fixed_asset_id uuid REFERENCES public.fixed_assets(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_fixed_asset ON public.journal_entries(fixed_asset_id);

-- 3. RPC: create_journal_entry_with_lines
CREATE OR REPLACE FUNCTION public.create_journal_entry_with_lines(
    p_organization_id uuid,
    p_fecha date,
    p_glosa text,
    p_lines jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_journal_id uuid;
    v_line jsonb;
BEGIN
    INSERT INTO public.journal_entries (
        organization_id,
        fecha,
        glosa
    ) VALUES (
        p_organization_id,
        p_fecha,
        p_glosa
    ) RETURNING id INTO v_journal_id;

    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        INSERT INTO public.journal_entry_lines (
            journal_entry_id,
            cuenta_codigo,
            cuenta_nombre,
            tipo,
            monto
        ) VALUES (
            v_journal_id,
            (v_line->>'cuenta_codigo'),
            (v_line->>'cuenta_nombre'),
            (v_line->>'tipo')::text,
            (v_line->>'monto')::numeric
        );
    END LOOP;

    RETURN v_journal_id;
END;
$$;

-- 4. Configuración Contable por Defecto
INSERT INTO public.centralized_account_config 
(organization_id, module_name, transaction_type, display_name, tax_account_code, tax_account_name, revenue_account_code, revenue_account_name, asset_account_code, asset_account_name)
SELECT 
    id as organization_id,
    'assets' as module_name,
    'depreciation' as transaction_type,
    'Depreciación Mensual' as display_name,
    '5.1.03.001' as tax_account_code, 
    'Gasto Depreciación' as tax_account_name,
    '1.1.05.001' as revenue_account_code, 
    'Depreciación Acumulada' as revenue_account_name,
    '1.1.05.000' as asset_account_code, 
    'Activo Fijo (Maq/Eq)' as asset_account_name
FROM public.organizations
ON CONFLICT DO NOTHING;
"""

print("Aplicando migración SQL...")
# Ejecutar SQL vía RPC 'exec_sql' si existe, si no, intentaremos directo
try:
    # Nota: Muchas veces Supabase tiene una RPC expuesta 'exec_sql' para administradores
    # Si no la tiene, usaremos el DATABASE_URL con psycopg2
    import psycopg2
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute(migration_sql)
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Migración aplicada exitosamente vía DATABASE_URL (psycopg2).")
    else:
        print("❌ DATABASE_URL no configurado.")
except Exception as e:
    print(f"❌ Error al aplicar migración: {e}")
