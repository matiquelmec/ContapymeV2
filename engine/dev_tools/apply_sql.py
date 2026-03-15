import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get("DATABASE_URL")

sql_file = "db/migration_payroll_motor_real.sql"

try:
    with open(sql_file, "r", encoding="utf-8") as f:
        sql = f.read()

    print("Conectando a la base de datos...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("Ejecutando migración SQL...")
    cur.execute(sql)
    
    # Verificar columnas
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'liquidations';")
    print("Columnas actuales en 'liquidations':")
    for row in cur.fetchall():
        print(f" - {row[0]}: {row[1]}")
        
    cur.close()
    conn.close()
    print("¡Migración completada exitosamente!")
    
except Exception as e:
    print(f"Error: {e}")
