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

    from api.routers.accounting import get_ledger
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

        # 2. Consultar mayor para Clientes Nacionales (cuenta 1.1.02.001)
        print("\n⚡ Consultando libro mayor para '1.1.02.001'...")
        try:
            result = await get_ledger(
                organization_id=org_id,
                account_code="1.1.02.001",
                start_date="2026-01-01",
                end_date="2026-05-31",
                current_user={"id": "mocked", "user_id": "mocked"}
            )
            print("🎉 ÉXITO: get_ledger se ejecutó sin errores.")
            print(f"Cuenta: {result['account_name']}")
            print(f"Naturaleza: {result['naturaleza']}")
            print(f"Saldo anterior: {result['saldo_anterior']}")
            print(f"Total movimientos: {len(result['movements'])}")
            for m in result['movements']:
                print(f"  - [{m.get('source_type')}] {m.get('fecha')}: {m.get('glosa')} (Debe: {m.get('debe')}, Haber: {m.get('haber')}, Saldo: {m.get('saldo')})")
        except Exception as e:
            print(f"❌ ERROR: Falló get_ledger: {e}")

    if __name__ == "__main__":
        asyncio.run(main())
