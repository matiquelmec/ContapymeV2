import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/.env")

def try_connect_and_run(dsn_or_params, name):
    print(f"Intentando conectar vía {name}...")
    try:
        if isinstance(dsn_or_params, dict):
            conn = psycopg2.connect(**dsn_or_params)
        else:
            conn = psycopg2.connect(dsn_or_params)
        
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Conectado exitosamente. Verificando valores actuales de liquidation_status...")
        cur.execute("""
            SELECT enumlabel 
            FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'liquidation_status';
        """)
        rows = cur.fetchall()
        print("Valores actuales del enum:")
        for r in rows:
            print(f"  - {r[0]}")
            
        print("Intentando agregar 'finalizada' al enum liquidation_status...")
        try:
            cur.execute("ALTER TYPE liquidation_status ADD VALUE 'finalizada';")
            print("  - 'finalizada' agregado con éxito.")
        except Exception as e:
            if "already exists" in str(e) or "duplicate" in str(e).lower():
                print("  - 'finalizada' ya existía.")
            else:
                print(f"  - Error al agregar 'finalizada': {e}")
                
        print("Intentando agregar 'pagada' al enum liquidation_status...")
        try:
            cur.execute("ALTER TYPE liquidation_status ADD VALUE 'pagada';")
            print("  - 'pagada' agregado con éxito.")
        except Exception as e:
            if "already exists" in str(e) or "duplicate" in str(e).lower():
                print("  - 'pagada' ya existía.")
            else:
                print(f"  - Error al agregar 'pagada': {e}")
                
        cur.close()
        conn.close()
        print(f"Proceso completado con éxito vía {name}.")
        return True
    except Exception as e:
        print(f"Fallo de conexión/ejecución vía {name}: {e}")
        return False

def main():
    database_url = os.getenv("DATABASE_URL")
    
    # Intento 1: Conexión directa desde DATABASE_URL del .env
    if database_url:
        if try_connect_and_run(database_url, "DATABASE_URL directa (.env)"):
            return
        
        # Intento 2: DATABASE_URL con sslmode=require
        db_url_ssl = database_url
        if "sslmode=" not in db_url_ssl:
            if "?" in db_url_ssl:
                db_url_ssl += "&sslmode=require"
            else:
                db_url_ssl += "?sslmode=require"
        if try_connect_and_run(db_url_ssl, "DATABASE_URL con sslmode=require"):
            return

    # Intento 3: Pooler con sslmode=require y parámetros detallados
    pooler_params_ssl = {
        "host": "aws-1-us-east-2.pooler.supabase.com",
        "database": "postgres",
        "user": "postgres.mofkjgfrpfmtnktaepqi",
        "password": "Matigol1234.",
        "port": 6543,
        "sslmode": "require",
        "connect_timeout": 10
    }
    if try_connect_and_run(pooler_params_ssl, "Pooler SSL"):
        return

    # Intento 4: Pooler normal
    pooler_params = {
        "host": "aws-1-us-east-2.pooler.supabase.com",
        "database": "postgres",
        "user": "postgres.mofkjgfrpfmtnktaepqi",
        "password": "Matigol1234.",
        "port": 6543,
        "connect_timeout": 10
    }
    if try_connect_and_run(pooler_params, "Pooler sin SSL"):
        return

    print("❌ No se pudo conectar de ninguna manera.")

if __name__ == "__main__":
    main()
