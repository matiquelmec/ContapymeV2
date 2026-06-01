import os
import sys
import psycopg2

sys.path.append(os.path.join(os.getcwd(), 'engine'))

# Configuración de credenciales de Supabase
project_ref = "mofkjgfrpfmtnktaepqi"
password = "Matigol1234."
user = f"postgres.{project_ref}"
db_name = "postgres"
port = 6543

# IPs del Pooler en us-east-2 (Ohio)
ips = ["13.59.95.192", "3.139.14.59", "3.13.175.194"]
pooler_host = "aws-0-us-east-2.pooler.supabase.com"

migration_path = "supabase/migrations/20260531220000_plan_maestro_integridad_supa.sql"

if not os.path.exists(migration_path):
    print(f"Error: No se encontró la migración en {migration_path}")
    sys.exit(1)

with open(migration_path, "r", encoding="utf-8") as f:
    sql = f.read()

conn = None
connected_ip = None

print("Intentando conectar al pooler de Supabase en us-east-2 usando hostaddr (SNI habilitado)...")
for ip in ips:
    try:
        print(f"Conectando a {pooler_host} (usando IP {ip}:{port})...")
        conn = psycopg2.connect(
            host=pooler_host,
            hostaddr=ip,
            database=db_name,
            user=user,
            password=password,
            port=port,
            connect_timeout=10
        )
        connected_ip = ip
        print(f"¡Conexión exitosa establecida con {pooler_host} en la IP {ip}!")
        break
    except Exception as e:
        print(f"Fallo al conectar con {ip}: {e}")

if conn is None:
    print("Error: No se pudo conectar a ninguna IP del pooler usando SNI.")
    sys.exit(1)

try:
    conn.autocommit = False
    cur = conn.cursor()
    print("Aplicando migración SQL de forma transaccional...")
    cur.execute(sql)
    conn.commit()
    print("¡Migración del Plan Maestro aplicada exitosamente en Supabase!")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error aplicando el SQL: {e}")
    if conn:
        conn.rollback()
        conn.close()
    sys.exit(1)
