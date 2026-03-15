import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Faltan variables de entorno.")
    sys.exit(1)

supabase: Client = create_client(url, key)

# Obtenemos la org de nuestro usuario de pruebas
orgs = supabase.table("organizations").select("id").limit(1).execute()
if not orgs.data:
    print("No hay organizaciones")
    sys.exit(1)

org_id = orgs.data[0]['id']

# Insertar empleado de prueba
employee_data = {
    "organization_id": org_id,
    "rut": "15123456-5",
    "nombres": "Ana",
    "apellido_paterno": "Pérez",
    "apellido_materno": "Gómez",
    "cargo": "Gerente de Finanzas",
    "tipo_contrato": "indefinido",
    "sueldo_base": 1500000,
    "fecha_ingreso": "2024-01-01",
    "activo": True
}

try:
    res = supabase.table("employees").insert(employee_data).execute()
    print(f"[OK] Empleado insertado: {res.data[0]['nombres']} {res.data[0]['apellido_paterno']}")
except Exception as e:
    print(f"Error insertando empleado: {e}")
