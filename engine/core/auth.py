"""
engine/core/auth.py — Middleware de Seguridad y Validación de JWT
==============================================================
Valida el Supabase JWT recibido en las peticiones al motor.
Asegura que solo usuarios autenticados y autorizados accedan al motor de cómputo.
"""

import json
import os
from typing import Any
from uuid import UUID

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

from core.database import get_supabase

security = HTTPBearer()

_anon_client: Client | None = None
ORG_ID_KEYS = {"organization_id", "org_id", "p_organization_id", "p_org_id"}

def get_anon_client() -> Client:
    global _anon_client
    if _anon_client is None:
        url = os.getenv("SUPABASE_URL")
        anon_key = os.getenv("SUPABASE_ANON_KEY")
        if not url or not anon_key:
            raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_ANON_KEY")
        _anon_client = create_client(url, anon_key)
    return _anon_client

def _normalize_uuid(value: Any) -> str | None:
    if not isinstance(value, str) or not value:
        return None

    try:
        return str(UUID(value))
    except ValueError:
        return None


def _collect_org_ids(payload: Any) -> set[str]:
    org_ids: set[str] = set()

    if isinstance(payload, dict):
        for key, value in payload.items():
            if key in ORG_ID_KEYS:
                normalized = _normalize_uuid(value)
                if normalized:
                    org_ids.add(normalized)
            elif isinstance(value, (dict, list)):
                org_ids.update(_collect_org_ids(value))
    elif isinstance(payload, list):
        for item in payload:
            org_ids.update(_collect_org_ids(item))

    return org_ids


async def _extract_org_ids_from_request(request: Request) -> set[str]:
    org_ids: set[str] = set()

    org_ids.update(_collect_org_ids(dict(request.path_params)))
    org_ids.update(_collect_org_ids(dict(request.query_params)))

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            raw_body = await request.body()
            if raw_body:
                org_ids.update(_collect_org_ids(json.loads(raw_body.decode("utf-8"))))
        except Exception:
            # Body parsing failures are handled by FastAPI/Pydantic at the route layer.
            pass

    return org_ids


def _assert_org_memberships(user_id: str, organization_ids: set[str]) -> None:
    if not organization_ids:
        return

    db = get_supabase()
    res = (
        db.table("organization_members")
        .select("organization_id")
        .eq("user_id", user_id)
        .in_("organization_id", list(organization_ids))
        .execute()
    )

    allowed = {row["organization_id"] for row in (res.data or [])}
    missing = organization_ids - allowed
    if missing:
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: el usuario no pertenece a la organizacion solicitada.",
        )


async def verify_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Valida el JWT con Supabase.
    """
    token = credentials.credentials
    try:
        # Usamos un cliente singleton para validar
        client = get_anon_client()
        
        # Validar el token obteniendo el usuario
        res = client.auth.get_user(token)
        
        if not res.user:
            raise HTTPException(status_code=401, detail="Sesión no válida o expirada")
            
        auth_data = {
            "user_id": res.user.id,
            "email": res.user.email,
            "token": token
        }

        organization_ids = await _extract_org_ids_from_request(request)
        _assert_org_memberships(res.user.id, organization_ids)

        return auth_data
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error crítico en validación de token Engine: {str(e)}")
        # Si hay un error de inicialización, intentamos limpiar el cliente para el próximo reintento
        global _anon_client
        _anon_client = None
        raise HTTPException(status_code=401, detail=f"Error de seguridad: {str(e)}")

async def verify_org_role(
    organization_id: str, 
    required_roles: list[str] = ["owner", "admin", "accountant"],
    auth: dict = Depends(verify_token)
) -> dict:
    """
    Verifica que el usuario pertenezca a la organización y tenga uno de los roles requeridos.
    """
    db = get_supabase()
    user_id = auth.get("user_id")
    
    try:
        res = db.table("organization_members") \
            .select("role") \
            .eq("organization_id", organization_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        if not res.data:
            raise HTTPException(status_code=403, detail="Acceso denegado: El usuario no es miembro de esta organización.")
            
        role = res.data.get("role")
        if role not in required_roles:
            raise HTTPException(status_code=403, detail=f"Privilegios insuficientes: Se requiere uno de los roles {required_roles}.")
            
        return {**auth, "role": role}
        
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Error en validación de roles: {str(e)}")
        raise HTTPException(status_code=403, detail="Error al verificar privilegios del usuario.")
