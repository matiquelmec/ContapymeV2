from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Dict, Any
from pydantic import BaseModel
from core.auth import verify_org_role
from core.dte.dte_logic import DTELogic

router = APIRouter()

class DTEItem(BaseModel):
    product_name: str
    quantity: float
    unit_price: int
    total_amount: int
    is_exempt: bool = False

class DTECreate(BaseModel):
    organization_id: str
    tipo_dte: int
    folio: int
    receptor_rut: str
    receptor_razon_social: str
    monto_neto: int
    monto_iva: int
    monto_total: int
    tasa_iva: float = 19.0
    items: List[DTEItem]

@router.post("/issue")
async def issue_dte(
    data: DTECreate,
    auth: dict = Depends(lambda data: verify_org_role(data.organization_id, required_roles=["owner", "admin", "accountant"]))
):
    """
    Emite un nuevo DTE, genera el XML firmado y lo registra en la base de datos.
    """
    try:
        logic = DTELogic(data.organization_id)
        
        # Convertir items Pydantic a dict
        items_dict = [item.dict() for item in data.items]
        
        # Datos del DTE
        dte_data = data.dict()
        del dte_data["items"]
        
        result = logic.create_and_sign_invoice(dte_data, items_dict)
        return result
        
    except Exception as e:
        print(f"Error issuing DTE: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/issued/{organization_id}")
async def list_issued_dtes(
    organization_id: str,
    auth: dict = Depends(lambda organization_id: verify_org_role(organization_id, required_roles=["owner", "admin", "accountant"]))
):
    """
    Lista los DTEs emitidos por la organización.
    """
    from core.database import get_supabase
    db = get_supabase()
    
    try:
        res = db.table("dte_issued")\
            .select("*")\
            .eq("organization_id", organization_id)\
            .order("created_at", descending=True)\
            .execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
