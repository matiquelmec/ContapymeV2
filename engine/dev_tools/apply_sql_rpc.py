import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

sql = """
ALTER TABLE public.liquidations
  ADD COLUMN IF NOT EXISTS gratificacion          bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS asignacion_colacion    bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS asignacion_movilizacion bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_extra_monto      bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bono_extra             bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_imponible_afp     bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_imponible_salud   bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_imponible_impuesto bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS afp_comision           bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sis_empresa            bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS afp_code               varchar DEFAULT '',
  ADD COLUMN IF NOT EXISTS salud_code             varchar DEFAULT '',
  ADD COLUMN IF NOT EXISTS tipo_contrato          varchar DEFAULT 'indefinido',
  ADD COLUMN IF NOT EXISTS uf_valor_usado         numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dias_trabajados        integer DEFAULT 30;

NOTIFY pgrst, 'reload schema';
"""

try:
    print(f"🚀 Iniciando migración RPC para 'liquidations'...")
    res = supabase.rpc("exec_sql", {"query": sql}).execute()
    print("✅ ÉXITO: Esquema cache reloaded.")
except Exception as e:
    # PostgREST a veces lanza un error de schema cache al volver a ejecutar, pero
    # si usamos un try catch, veremos si al volver a consultar funciona.
    print(f"Error esperado del schema cache: {e}")

try:
    print("🔎 Verificando estructura...")
    data = supabase.table('liquidations').select('*').limit(1).execute()
    if data.data:
        keys = list(data.data[0].keys())
        if 'gratificacion' in keys:
            print("✅ Columnas nuevas detectadas en DB!")
        else:
            print("❌ Las columnas NO están (schema cache).")
    else:
        print("✅ DB Vacia pero conexion exitosa.")
except Exception as e:
     print(f"❌ Error consultando: {e}")
