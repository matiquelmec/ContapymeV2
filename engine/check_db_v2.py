
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

try:
    res = supabase.table("termination_causes").select("*").limit(1).execute()
    print("Tabla termination_causes existe.")
    print(res.data)
except Exception as e:
    print(f"Error o tabla no existe: {e}")

try:
    res = supabase.table("employee_terminations").select("*").limit(1).execute()
    print("Tabla employee_terminations existe.")
    # Check if new column exists
    columns = res.data[0].keys() if res.data else []
    print(f"Columnas detectadas: {list(columns)}")
except Exception as e:
    print(f"Error en employee_terminations: {e}")
