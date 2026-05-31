import sys
import os

# Agregar la carpeta engine al PATH de Python
sys.path.append(os.path.abspath("engine"))

from dotenv import load_dotenv
load_dotenv(dotenv_path="engine/.env")

from core.database import get_supabase

db = get_supabase()

def run():
    print("Checking database schema objects via REST API...")
    
    # 1. Verificar si existe la tabla national_payroll_params intentando una consulta simple
    try:
        res = db.table("national_payroll_params").select("count").limit(1).execute()
        print("✅ La tabla 'national_payroll_params' existe y es accesible.")
    except Exception as e:
        print(f"❌ La tabla 'national_payroll_params' no existe o falló: {e}")
        
    # 2. Verificar si el trigger de contratos está activo en pg_trigger
    # No podemos ejecutar SQL directo por REST para pg_trigger, pero podemos intentar consultar contracts
    try:
        res = db.table("employment_contracts").select("id").limit(1).execute()
        print("✅ La tabla 'employment_contracts' existe y es accesible.")
    except Exception as e:
        print(f"❌ La tabla 'employment_contracts' falló: {e}")

if __name__ == "__main__":
    run()
