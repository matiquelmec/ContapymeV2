import os
import psycopg2
import re
from dotenv import load_dotenv

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

migration_sql = """
-- 1. Agregar columna payment_status a dte_issued si no existe
ALTER TABLE public.dte_issued 
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'partial', 'paid'));

-- 2. Crear índice para optimizar consultas por estado de pago
CREATE INDEX IF NOT EXISTS idx_dte_issued_payment_status 
  ON public.dte_issued(organization_id, payment_status);

-- 3. Poblar el estado de pago de los DTEs existentes basándose en sales_records
UPDATE public.dte_issued d
SET payment_status = COALESCE(s.payment_status, 'pending')
FROM public.sales_records s
WHERE d.organization_id = s.organization_id
  AND d.folio = s.folio
  AND d.tipo_dte::text = s.tipo_documento::text;

-- 4. Función de trigger para sincronizar cambios de sales_records a dte_issued
CREATE OR REPLACE FUNCTION public.sync_sales_record_payment_status_to_dte()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.dte_issued
  SET payment_status = NEW.payment_status
  WHERE organization_id = NEW.organization_id
    AND folio = NEW.folio
    AND tipo_dte::text = NEW.tipo_documento::text;
  RETURN NEW;
END;
$$;

-- 5. Crear el trigger en sales_records
DROP TRIGGER IF EXISTS trg_sync_sales_record_payment_status ON public.sales_records;
CREATE TRIGGER trg_sync_sales_record_payment_status
  AFTER UPDATE OF payment_status ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_sales_record_payment_status_to_dte();
"""

try:
    print("Aplicando migración de sincronización de estado de pago...")
    cur.execute(migration_sql)
    conn.commit()
    print("Migración aplicada exitosamente.")
except Exception as e:
    conn.rollback()
    print(f"Error al aplicar migración: {e}")
finally:
    cur.close()
    conn.close()
