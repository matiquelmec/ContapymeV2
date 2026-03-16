import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

# SQL para revertir el tipo de la columna 'tipo' a text y asegurar compatibilidad
sql = """
DO $$ 
BEGIN
    -- 1. Intentar cambiar el tipo de la columna a text
    -- Si ya es text, el comando no hará daño. Si es un enum, lo convertirá.
    BEGIN
        ALTER TABLE public.journal_entry_lines ALTER COLUMN tipo TYPE text;
        RAISE NOTICE 'Columna tipo convertida a text exitosamente.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No se pudo convertir con alter simple, intentando con casting...';
        ALTER TABLE public.journal_entry_lines ALTER COLUMN tipo TYPE text USING tipo::text;
    END;

    -- 2. Asegurar el constraint de validación
    ALTER TABLE public.journal_entry_lines DROP CONSTRAINT IF EXISTS journal_entry_lines_tipo_check;
    ALTER TABLE public.journal_entry_lines ADD CONSTRAINT journal_entry_lines_tipo_check CHECK (tipo IN ('debe', 'haber'));

    RAISE NOTICE 'Estructura contable sincronizada.';
END $$;

NOTIFY pgrst, 'reload schema';
"""

try:
    print(f"🚀 Corrigiendo incompatibilidad de tipos en journal_entry_lines...")
    res = supabase.rpc("exec_sql", {"query": sql}).execute()
    print("✅ Cambio aplicado correctamente.")
except Exception as e:
    print(f"❌ Error al ejecutar SQL: {e}")
