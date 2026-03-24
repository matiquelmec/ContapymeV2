from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from core.database import get_supabase
from core.auth import verify_token, verify_org_role
from core.logger import log_activity

router = APIRouter()

class AuditLogCreate(BaseModel):
    action: str
    organization_id: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None

@router.get("/")
async def get_audit_logs(
    organization_id: str,
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    auth: dict = Depends(lambda organization_id: verify_org_role(organization_id, required_roles=["owner", "admin"]))
):
    """
    Obtiene los registros de auditoría para una organización específica.
    Permite filtrado por acción y paginación.
    """
    db = get_supabase()
    
    try:
        query = db.table("audit_logs") \
            .select("*, profiles!inner(full_name)") \
            .eq("organization_id", organization_id) \
            .order("created_at", descending=True) \
            .range(offset, offset + limit - 1)
        
        if action:
            query = query.eq("action", action)
        if user_id:
            query = query.eq("user_id", user_id)
            
        res = query.execute()
        
        return res.data or []
        
    except Exception as e:
        print(f"Error fetching audit logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al recuperar logs de auditoría.")

@router.get("/actions")
async def get_distinct_audit_actions(
    organization_id: str, 
    auth: dict = Depends(lambda organization_id: verify_org_role(organization_id, required_roles=["owner", "admin"]))
):
    """
    Lista las acciones únicas registradas para el filtrado en el frontend.
    """
    db = get_supabase()
    try:
        res = db.table("audit_logs") \
            .select("action") \
            .eq("organization_id", organization_id) \
            .limit(200) \
            .execute()
        
        actions = sorted(list(set(item["action"] for item in res.data)))
        return actions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def record_audit_log(
    log_data: AuditLogCreate,
    auth: dict = Depends(verify_token)
):
    """
    Registra una acción de auditoría enviada desde el frontend.
    """
    success = log_activity(
        action=log_data.action,
        organization_id=log_data.organization_id,
        user_id=auth.get("user_id"),
        entity_type=log_data.entity_type,
        entity_id=log_data.entity_id,
        details=log_data.details,
        ip_address=log_data.ip_address
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="No se pudo registrar la actividad en la auditoría.")
        
    return {"status": "success"}
