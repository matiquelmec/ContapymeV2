import os
import sys
import psycopg2

sys.path.append(os.path.join(os.getcwd(), 'engine'))

project_ref = "mofkjgfrpfmtnktaepqi"
password = "Matigol1234."
user = f"postgres.{project_ref}"
db_name = "postgres"
port = 6543

pooler_hosts = [
    "aws-0-sa-east-1.pooler.supabase.com",
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-us-east-2.pooler.supabase.com",
    "aws-0-us-west-1.pooler.supabase.com",
    "aws-0-us-west-2.pooler.supabase.com",
    "aws-0-ca-central-1.pooler.supabase.com",
    "aws-0-eu-west-1.pooler.supabase.com",
    "aws-0-eu-west-2.pooler.supabase.com",
    "aws-0-eu-west-3.pooler.supabase.com",
    "aws-0-eu-central-1.pooler.supabase.com",
    "aws-0-ap-northeast-1.pooler.supabase.com",
    "aws-0-ap-northeast-2.pooler.supabase.com",
    "aws-0-ap-south-1.pooler.supabase.com",
    "aws-0-ap-southeast-1.pooler.supabase.com",
    "aws-0-ap-southeast-2.pooler.supabase.com"
]

migration_path = "supabase/migrations/20260531220000_plan_maestro_integridad_supa.sql"

if not os.path.exists(migration_path):
    print(f"Error: No se encontró la migración en {migration_path}")
    sys.exit(1)

with open(migration_path, "r", encoding="utf-8") as f:
    sql = f.read()

conn = None
active_host = None

print("Buscando región activa del proyecto a través del pooler...")
for host in pooler_hosts:
    try:
        # Intentar conectar con un timeout muy rápido
        conn = psycopg2.connect(
            host=host,
            database=db_name,
            user=user,
            password=password,
            port=port,
            connect_timeout=3
        )
        active_host = host
        print(f"¡Conexión exitosa establecida con el pooler en {host}!")
        break
    except Exception as e:
        err_msg = str(e)
        if "tenant/user" in err_msg or "Tenant or user not found" in err_msg:
            # El pooler rechazó el project ref porque no está en esta región
            pass
        else:
            # Otro tipo de error (ej: timeout, DNS, etc)
            print(f"Error en {host}: {err_msg[:120]}")

if conn is None:
    print("Error: No se pudo conectar a ningún pooler de Supabase en IPv4.")
    sys.exit(1)

try:
    conn.autocommit = False
    cur = conn.cursor()
    print("Aplicando migración SQL de forma transaccional...")
    cur.execute(sql)
    conn.commit()
    print(f"¡Migración del Plan Maestro aplicada exitosamente en Supabase a través del pooler de {active_host}!")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error aplicando el SQL: {e}")
    if conn:
        conn.rollback()
        conn.close()
    sys.exit(1)
