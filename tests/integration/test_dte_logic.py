import pytest
import asyncio
from uuid import UUID
from core.database import get_supabase
from core.dte.dte_logic import DTELogic

@pytest.mark.asyncio
async def test_list():
    org_id = "2e9f634b-4087-448c-bfa6-244bfa1eec61"
    logic = DTELogic(org_id)
    
    print(f"Listando DTEs para la organización {org_id}...")
    dtes = await logic.list_dtes(org_id)
    
    print(f"Se encontraron {len(dtes)} documentos.")
    for dte in dtes:
        print(f"Folio: {dte['folio']} | Tipo: {dte['tipo_dte']} | Receptor: {dte['receptor_razon_social']} | Hash: {dte['integrity_hash'][:10]}...")

if __name__ == "__main__":
    asyncio.run(test_list())
