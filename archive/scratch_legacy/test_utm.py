import sys
import os

# Agregar la carpeta engine al PATH de Python
sys.path.append(os.path.abspath("engine"))

from dotenv import load_dotenv
load_dotenv(dotenv_path="engine/.env")

from core.database import get_supabase

db = get_supabase()

def run():
    try:
        res = db.table("economic_indicators").select("*").execute()
        print("Indicadores Económicos:")
        for r in res.data:
            print(f"  {r['codigo']}: {r['valor']} ({r['fecha']})")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run()
