import os
import uuid
from datetime import date
from core.database import get_supabase

def seed_database_fixed():
    db = get_supabase()
    CURRENT_USER_ID = "4369feb8-e9cd-4f7c-8446-cf5729e76147"
    
    # 1. No borramos nada, solo insertamos con nuevos RUTs e IDs únicos
    # Generamos sufijos aleatorios para los RUTs para que SIEMPRE pase
    suffix = str(uuid.uuid4())[:4]
    rut1 = f"77.555.{suffix}-1"
    rut2 = f"78.444.{suffix}-2"

    print(f"🏢 Creando Empresa 1 con RUT: {rut1}")
    org1_id = str(uuid.uuid4())
    db.table("organizations").insert({
        "id": org1_id,
        "nombre": f"SERVICIOS AUSTRALES SpA ({suffix})",
        "rut_empresa": rut1,
        "comuna": "PUNTA ARENAS",
        "region": "MAGALLANES"
    }).execute()
    
    db.table("organization_members").insert({
        "organization_id": org1_id,
        "user_id": CURRENT_USER_ID,
        "role": "owner"
    }).execute()

    print(f"🏢 Creando Empresa 2 con RUT: {rut2}")
    org2_id = str(uuid.uuid4())
    db.table("organizations").insert({
        "id": org2_id,
        "nombre": f"CONSTRUCTORA DEL ESTRECHO ({suffix})",
        "rut_empresa": rut2,
        "comuna": "PUNTA ARENAS",
        "region": "MAGALLANES"
    }).execute()
    
    db.table("organization_members").insert({
        "organization_id": org2_id,
        "user_id": CURRENT_USER_ID,
        "role": "owner"
    }).execute()

    # Empleados para Org 1
    db.table("employees").insert([
        {"id": str(uuid.uuid4()), "organization_id": org1_id, "nombres": "RODRIGO", "apellido_paterno": "VARGAS", "rut": f"15.111.{suffix}-1", "cargo": "CONTADOR", "sueldo_base": 1500000},
        {"id": str(uuid.uuid4()), "organization_id": org1_id, "nombres": "CARLA", "apellido_paterno": "PAREDES", "rut": f"18.222.{suffix}-2", "cargo": "SECRETARIA", "sueldo_base": 850000}
    ]).execute()

    print("\n🚀 INYECCIÓN EXITOSA. Nuevas empresas vinculadas.")

if __name__ == "__main__":
    seed_database_fixed()
