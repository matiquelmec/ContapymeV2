import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

import sys
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

orgs = supabase.table("organizations").select("id").limit(1).execute()
org_id = orgs.data[0]["id"]

from api.routers.payroll import process_payroll, PayrollRequest

import asyncio
req = PayrollRequest(org_id=org_id, periodo="2026-03-01")

async def test():
    try:
        res = await process_payroll(req)
        with open("error.log", "w", encoding="utf-8") as f:
            f.write(f"RESULTADO: {res}")
    except Exception as e:
        import traceback
        with open("error.log", "w", encoding="utf-8") as f:
            f.write(traceback.format_exc())

asyncio.run(test())
