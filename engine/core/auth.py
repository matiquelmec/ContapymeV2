"""
engine/core/auth.py — Middleware de Seguridad y Validación de JWT
==============================================================
Valida el Supabase JWT recibido en las peticiones al motor.
Asegura que solo usuarios autenticados y autorizados accedan al motor de cómputo.
"""

import os
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

security = HTTPBearer()

_anon_client: Client | None = None

def get_anon_client() -> Client:
    global _anon_client
    if _anon_client is None:
        url = os.getenv("SUPABASE_URL")
        anon_key = os.getenv("SUPABASE_ANON_KEY")
        if not url or not anon_key:
            raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_ANON_KEY")
        _anon_client = create_client(url, anon_key)
    return _anon_client

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
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
            
        return {
            "user_id": res.user.id,
            "email": res.user.email,
            "token": token
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error crítico en validación de token Engine: {str(e)}")
        # Si hay un error de inicialización, intentamos limpiar el cliente para el próximo reintento
        global _anon_client
        _anon_client = None
        raise HTTPException(status_code=401, detail=f"Error de seguridad: {str(e)}")

from core.database import get_supabase

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
