import sys
import os
import asyncio
from unittest.mock import AsyncMock, patch

# Agregar la carpeta engine al PATH de Python
sys.path.append(os.path.abspath("engine"))

from dotenv import load_dotenv
load_dotenv(dotenv_path="engine/.env")

# Mock verify_org_role and verify_token before importing
with patch("core.auth.verify_org_role", new_callable=AsyncMock) as mock_role, \
     patch("core.auth.verify_token", new_callable=AsyncMock) as mock_token:
     
    mock_role.return_value = {"user_id": "mocked", "role": "admin"}
    mock_token.return_value = {"id": "mocked", "user_id": "mocked"}

    from api.routers.accounting import generate_from_payroll, GenerateFromPayrollRequest
    from core.database import get_supabase

    db = get_supabase()

    async def main():
        # 1. Obtener ID de Inversiones Riquelme
        org_res = db.table("organizations").select("id, nombre").eq("nombre", "Inversiones Riquelme").execute()
        if not org_res.data:
            print("❌ Organización 'Inversiones Riquelme' no encontrada.")
            return
            
        org_id = org_res.data[0]["id"]
        print(f"✅ Organización encontrada: {org_id}")

        # 2. Consultar asientos contables antes del test
        print("\n--- Asientos antes de re-centralizar ---")
        res_before = db.table("journal_entries").select("id, fecha, glosa, source_type").eq("organization_id", org_id).execute()
        for j in (res_before.data or []):
            if "Remuneraciones" in j.get("glosa", ""):
                print(f"  - [{j.get('source_type')}] {j.get('fecha')}: {j.get('glosa')} (ID: {j.get('id')})")

        # 3. Crear request
        req = GenerateFromPayrollRequest(organization_id=org_id, periodo="2026-05-01")
        
        # Mock current_user
        current_user = {"id": "mocked", "user_id": "mocked"}

        # 4. Ejecutar el endpoint
        print("\n⚡ Ejecutando generate_from_payroll (con lógica idempotente unificada)...")
        result = await generate_from_payroll(req, current_user=current_user)
        print(f"Result: {result}")

        # 5. Consultar asientos contables después del test
        print("\n--- Asientos después de re-centralizar ---")
        res_after = db.table("journal_entries").select("id, fecha, glosa, source_type").eq("organization_id", org_id).execute()
        payroll_entries = []
        for j in (res_after.data or []):
            if "Remuneraciones" in j.get("glosa", ""):
                print(f"  - [{j.get('source_type')}] {j.get('fecha')}: {j.get('glosa')} (ID: {j.get('id')})")
                payroll_entries.append(j)

        if len(payroll_entries) == 1:
            print("\n🎉 ÉXITO: Solo queda un asiento contable de remuneraciones en la base de datos.")
            print(f"Glosa: {payroll_entries[0]['glosa']}")
            print(f"Source Type: {payroll_entries[0]['source_type']}")
        else:
            print(f"\n❌ ERROR: Se encontraron {len(payroll_entries)} asientos (se esperaba exactamente 1).")

    if __name__ == "__main__":
        asyncio.run(main())
