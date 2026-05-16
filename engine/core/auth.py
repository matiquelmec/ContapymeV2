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

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Valida el JWT con Supabase.
    Si el token es válido, devuelve el objeto usuario.
    Si no, lanza una excepción 401.
    """
    token = credentials.credentials
    try:
        url = os.getenv("SUPABASE_URL")
        anon_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not url or not anon_key:
            print("❌ ERROR: Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY en el servidor.")
            raise HTTPException(status_code=500, detail="Configuración del servidor incompleta (Variables de entorno)")

        # Creamos un cliente temporal solo para validar este JWT.
        temp_client = create_client(url, anon_key)
        
        # Validar el token obteniendo el usuario
        res = temp_client.auth.get_user(token)
        
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
        # Loguear más detalles si es posible
        raise HTTPException(status_code=401, detail="Error de autenticación: Protocolo de seguridad violado")

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
