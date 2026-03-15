import os
import json
import asyncio
from datetime import date
from supabase import create_client, Client
from dotenv import load_dotenv
import sys
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# Get an organization
orgs = supabase.table("organizations").select("id").limit(1).execute()
org_id = orgs.data[0]["id"]

# Get an employee
emps = supabase.table("employees").select("id").eq("organization_id", org_id).limit(1).execute()

if not emps.data:
    print("No hay empleados")
    exit(0)

employee_id = emps.data[0]["id"]

async def test():
    from api.routers.documents import generate_document
    # generate_document is an async function
    res = await generate_document(employee_id, "contrato")
    return res

try:
    asyncio.run(test())
    print("API Python completó la generación sin caerse!")
    
    # Check if contract was created
    conts = supabase.table("employment_contracts").select("*").eq("employee_id", employee_id).order("created_at", desc=True).limit(1).execute()
    if conts.data:
        print("CONTRATO GUARDADO EN BD EXITOSAMENTE!")
        print(conts.data[0])
    else:
        print("MALA NOTICIA: NO SE AGREGO A LA BASE DE DATOS.")
except Exception as e:
    import traceback
    traceback.print_exc()

