import os
import uuid
from datetime import date
from core.database import get_supabase

def seed_database_stable():
    db = get_supabase()
    
    # ID real del usuario según auditoría
    CURRENT_USER_ID = "4369feb8-e9cd-4f7c-8446-cf5729e76147"
    
    print("🧹 Iniciando limpieza selectiva...")
    # No podemos usar TRUNCATE sin SQL directo, así que borramos por FKs
    try:
        db.table("lre_registrations").delete().neq("id", str(uuid.uuid4())).execute()
        db.table("payroll_config").delete().neq("id", str(uuid.uuid4())).execute()
        db.table("organization_payroll_settings").delete().neq("organization_id", str(uuid.uuid4())).execute()
        db.table("organization_members").delete().neq("id", str(uuid.uuid4())).execute()
        db.table("employees").delete().neq("id", str(uuid.uuid4())).execute()
        db.table("organizations").delete().neq("id", str(uuid.uuid4())).execute()
        print("✨ Tablas vaciadas.")
    except Exception as e:
        print(f"⚠️ Nota: Algunos registros pueden persistir, pero intentaremos insertar nuevos: {e}")

    # EMPRESA 1 (NUEVOS RUTS PARA EVITAR ERRORES)
    org1_id = str(uuid.uuid4())
    print(f"🏢 Creando Empresa 1: SERVICIOS AUSTRALES ({org1_id})")
    db.table("organizations").insert({
        "id": org1_id,
        "nombre": "SERVICIOS AUSTRALES SpA",
        "rut_empresa": "77.555.555-1",
        "direccion": "AV. ESPAÑA 1240",
        "comuna": "PUNTA ARENAS",
        "region": "MAGALLANES",
        "giro": "SERVICIOS INTEGRALES"
    }).execute()
    
    db.table("organization_members").insert({
        "organization_id": org1_id,
        "user_id": CURRENT_USER_ID,
        "role": "owner"
    }).execute()

    db.table("organization_payroll_settings").insert({
        "organization_id": org1_id,
        "rep_legal_nombre": "JUAN PABLO RIQUELME",
        "rep_legal_rut": "12.345.678-9",
        "rep_legal_cargo": "GERENTE GENERAL"
    }).execute()

    db.table("employees").insert([
        {
            "id": str(uuid.uuid4()),
            "organization_id": org1_id,
            "nombres": "RODRIGO",
            "apellido_paterno": "VARGAS",
            "rut": "15.777.888-9",
            "cargo": "CONTADOR",
            "sueldo_base": 1500000,
            "activo": True
        },
        {
            "id": str(uuid.uuid4()),
            "organization_id": org1_id,
            "nombres": "CARLA",
            "apellido_paterno": "PAREDES",
            "rut": "18.333.444-5",
            "cargo": "SECRETARIA",
            "sueldo_base": 850000,
            "activo": True
        }
    ]).execute()

    # EMPRESA 2
    org2_id = str(uuid.uuid4())
    print(f"🏢 Creando Empresa 2: CONSTRUCTORA DEL ESTRECHO ({org2_id})")
    db.table("organizations").insert({
        "id": org2_id,
        "nombre": "CONSTRUCTORA DEL ESTRECHO",
        "rut_empresa": "78.444.444-2",
        "direccion": "AV. INDEPENDENCIA 450",
        "comuna": "PUNTA ARENAS",
        "region": "MAGALLANES",
        "giro": "CONSTRUCCION"
    }).execute()
    
    db.table("organization_members").insert({
        "organization_id": org2_id,
        "user_id": CURRENT_USER_ID,
        "role": "owner"
    }).execute()

    db.table("organization_payroll_settings").insert({
        "organization_id": org2_id,
        "rep_legal_nombre": "MARIA JOSE CONTRERAS",
        "rep_legal_rut": "14.222.333-K",
        "rep_legal_cargo": "ADMINISTRADORA"
    }).execute()

    db.table("employees").insert([
        {
            "id": str(uuid.uuid4()),
            "organization_id": org2_id,
            "nombres": "ESTEBAN",
            "apellido_paterno": "DEL REAL",
            "rut": "17.111.999-0",
            "cargo": "MAESTRO MAYOR",
            "sueldo_base": 950000,
            "activo": True
        },
        {
            "id": str(uuid.uuid4()),
            "organization_id": org2_id,
            "nombres": "VALENTINA",
            "apellido_paterno": "VILLAGRA",
            "rut": "19.888.777-6",
            "cargo": "PREVENCIONISTA",
            "sueldo_base": 1100000,
            "activo": True
        }
    ]).execute()

    print("\n🚀 SEEDING PROFESIONAL COMPLETADO.")
    print(f"Usuario {CURRENT_USER_ID} ahora es dueño de 2 empresas.")

if __name__ == "__main__":
    seed_database_stable()
