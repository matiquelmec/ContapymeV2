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

@router.post("/upload-caf")
async def upload_caf(
    organization_id: str = Body(...),
    xml_content: str = Body(...),
    environment: str = Body("certification"),
    auth: dict = Depends(verify_token)
):
    """
    Sube y procesa un archivo CAF (Folios) del SII.
    """
    await verify_org_role(organization_id, required_roles=["owner", "admin"], auth=auth)
    
    from lxml import etree
    from core.database import get_supabase
    db = get_supabase()
    
    try:
        # Parsear XML
        parser = etree.XMLParser(remove_blank_text=True)
        root = etree.fromstring(xml_content.encode('utf-8'), parser)
        
        # El CAF real está en <CAF> o es el root si solo se subió el fragmento
        caf_node = root.find(".//CAF")
        if caf_node is None and root.tag == "CAF":
            caf_node = root
        
        if caf_node is None:
            raise Exception("No se encontró el nodo <CAF> en el XML provisto.")
            
        da_node = caf_node.find("DA")
        rut_emisor = da_node.find("RE").text
        tipo_dte = int(da_node.find("TD").text)
        range_start = int(da_node.find(".//D").text)
        range_end = int(da_node.find(".//H").text)
        fecha_auth = da_node.find("FA").text
        
        # Buscar el company_id en dte_companies
        comp_res = db.table("dte_companies")\
            .select("id")\
            .eq("organization_id", organization_id)\
            .eq("rut", rut_emisor)\
            .execute()
            
        if not comp_res.data:
            raise Exception(f"Emisor No Encontrado: El RUT {rut_emisor} presente en el archivo CAF no coincide con la empresa configurada en esta organización. Por favor, verifique que el RUT en 'Configuración de Empresa > Facturación' sea el correcto antes de subir el archivo.")
            
        company_id = comp_res.data[0]["id"]
        
        # Guardar en dte_caf_folios
        caf_data = {
            "organization_id": organization_id,
            "company_id": company_id,
            "tipo_dte": tipo_dte,
            "range_start": range_start,
            "range_end": range_end,
            "last_used_folio": range_start - 1,
            "environment": environment,
            "caf_xml": xml_content,
            "authorized_at": fecha_auth,
            "is_active": True
        }
        
        # Desactivar otros CAFs del mismo tipo y ambiente para esta empresa
        db.table("dte_caf_folios")\
            .update({"is_active": False})\
            .eq("organization_id", organization_id)\
            .eq("company_id", company_id)\
            .eq("tipo_dte", tipo_dte)\
            .eq("environment", environment)\
            .execute()
            
        # Insertar nuevo
        db.table("dte_caf_folios").insert(caf_data).execute()
        
        return {
            "success": True, 
            "message": f"CAF Procesado: Tipo {tipo_dte}, Folios {range_start}-{range_end}",
            "details": {
                "tipo_dte": tipo_dte,
                "range": f"{range_start}-{range_end}",
                "rut": rut_emisor
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
