import os
import sys
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar .env
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase: Client = create_client(url, key)

email = "matiquelme.inversiones@gmail.com"
password = "Contapyme2026."

try:
    # 1. Crear usuario en Auth bypassing email confirmation usando el Admin API
    response = supabase.auth.admin.create_user({
        "email": email,
        "password": password,
        "email_confirm": True
    })
    
    user_id = response.user.id
    print(f"[OK] Usuario creado exitosamente:")
    print(f"     Email: {email}")
    print(f"     Clave: {password}")
    print(f"     UUID:  {user_id}")
    
    # 2. Crear una organización base para este usuario
    org_res = supabase.table("organizations").insert({
        "rut_empresa": "76123456-9",
        "nombre": "Inversiones Riquelme SPA",
        "giro": "Servicios de Inversión y Contabilidad"
    }).execute()
    
    org_id = org_res.data[0]['id']
    print(f"[OK] Organización 'Inversiones Riquelme SPA' creada. UUID: {org_id}")
    
    # 3. Vincular el usuario como 'owner' de la organización
    supabase.table("organization_members").insert({
        "organization_id": org_id,
        "user_id": user_id,
        "role": "owner"
    }).execute()
    
    print(f"[OK] Usuario vinculado como OWNER de la organización.")
    print("Ya puedes iniciar sesión en http://localhost:3000/login")
    
except Exception as e:
    print(f"[ERROR] No se pudo crear el usuario o la organización: {str(e)}")
