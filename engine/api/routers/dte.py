from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from core.auth import verify_org_role, verify_token
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
    folio: Optional[int] = None
    receptor_rut: str
    receptor_razon_social: str
    monto_neto: int
    monto_iva: int
    monto_total: int
    tasa_iva: float = 19.0
    items: List[DTEItem]

@router.post("/issue")
async def issue_dte(
    data: DTECreate = Body(...),
    auth: dict = Depends(verify_token)
):
    """
    Emite un nuevo DTE, genera el XML firmado y lo registra en la base de datos.
    """
    # Verificación de rol manual para evitar conflictos de parámetros en Depends
    await verify_org_role(data.organization_id, required_roles=["owner", "admin", "accountant"], auth=auth)
    
    try:
        logic = DTELogic(data.organization_id)
        
        # Convertir items Pydantic a dict
        items_dict = [item.model_dump() for item in data.items]
        
        # Datos del DTE
        dte_data = data.model_dump()
        del dte_data["items"]
        
        result = await logic.create_and_sign_invoice(dte_data, items_dict)
        return result
        
    except Exception as e:
        print(f"Error issuing DTE: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/issued/{organization_id}")
async def list_issued_dtes(
    organization_id: str,
    auth: dict = Depends(verify_token)
):
    """
    Lista los DTEs emitidos por la organización.
    """
    await verify_org_role(organization_id, required_roles=["owner", "admin", "accountant"], auth=auth)
    
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
