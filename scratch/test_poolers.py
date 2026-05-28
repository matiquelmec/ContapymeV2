import psycopg2
import sys

# Lista de todas las regiones de Supabase en AWS
REGIONS = [
    "sa-east-1",     # São Paulo (Muy probable para Chile)
    "us-east-1",     # N. Virginia
    "us-east-2",     # Ohio
    "us-west-1",     # N. California
    "us-west-2",     # Oregon
    "ca-central-1",  # Canada
    "eu-west-1",     # Ireland
    "eu-west-2",     # London
    "eu-west-3",     # Paris
    "eu-central-1",  # Frankfurt
    "ap-southeast-1",# Singapore
    "ap-southeast-2",# Sydney
    "ap-northeast-1",# Tokyo
    "ap-northeast-2",# Seoul
]

TENANT = "mofkjgfrpfmtnktaepqi"
PASSWORD = "Matigol1234."

def scan():
    for region in REGIONS:
        host = f"aws-0-{region}.pooler.supabase.com"
        # Usamos el puerto 6543 (Transaction mode) o 5432 (Session mode)
        url = f"postgresql://postgres.{TENANT}:{PASSWORD}@{host}:6543/postgres?sslmode=require"
        
        print(f"[*] Probando region: {region} ({host})...")
        try:
            conn = psycopg2.connect(url, connect_timeout=3)
            print(f"[+++] CONEXIÓN EXITOSA EN LA REGION: {region}!")
            conn.close()
            return region
        except psycopg2.OperationalError as e:
            err_msg = str(e)
            if "Tenant or user not found" in err_msg or "not found" in err_msg:
                # El host respondió pero el tenant no existe en esta región
                print(f"  [-] Tenant no encontrado en {region}")
            elif "timeout expired" in err_msg or "could not connect" in err_msg:
                print(f"  [-] Timeout o inalcanzable en {region}")
            else:
                # Otro error (ej. contraseña incorrecta, pero el tenant sí existe)
                print(f"  [?] Error en {region}: {err_msg}")
    print("[-] No se encontró ninguna región compatible.")
    return None

if __name__ == "__main__":
    scan()
