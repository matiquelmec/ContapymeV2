import os
import uuid
from datetime import date
from core.database import get_supabase

def seed_database():
    db = get_supabase()
    
    print("🧹 Vaciando tablas para limpieza profesional...")
    try:
        # Limpiar dependencias en orden
        db.table("lre_registrations").delete().neq("id", str(uuid.uuid4())).execute()
        db.table("payroll_config").delete().neq("id", str(uuid.uuid4())).execute()
        db.table("organization_payroll_settings").delete().neq("organization_id", str(uuid.uuid4())).execute()
        db.table("organization_members").delete().neq("id", str(uuid.uuid4())).execute()
        db.table("employees").delete().neq("id", str(uuid.uuid4())).execute()
        db.table("organizations").delete().neq("id", str(uuid.uuid4())).execute()
        print("✨ Base de Datos limpia.")
    except Exception as e:
        print(f"⚠️ Error limpiando: {e}")

    CURRENT_USER_ID = "4369feb8-e9cd-4f7c-8446-cf5729e76147"

    # --- EMPRESA 1: SERVICIOS AUSTRALES SpA ---
    print("\n🏢 Creando Empresa 1...")
    org1_id = str(uuid.uuid4())
    org1 = {
        "id": org1_id,
        "nombre": "SERVICIOS AUSTRALES SpA",
        "rut_empresa": "77.111.111-1",
        "direccion": "AV. ESPAÑA 1240",
        "comuna": "PUNTA ARENAS",
        "region": "MAGALLANES",
        "giro": "SERVICIOS GENERALES"
    }
    db.table("organizations").insert(org1).execute()

    # Vincular usuario a Empresa 1
    db.table("organization_members").insert({
        "organization_id": org1_id,
        "user_id": CURRENT_USER_ID,
        "role": "owner"
    }).execute()

    # Rep Legal Empresa 1
    db.table("organization_payroll_settings").insert({
        "organization_id": org1_id,
        "rep_legal_nombre": "JUAN PABLO RIQUELME",
        "rep_legal_rut": "12.345.678-9",
        "rep_legal_cargo": "GERENTE GENERAL"
    }).execute()

    # Empleados Empresa 1
    print("👥 Creando Empleados Empresa 1...")
    db.table("employees").insert([
        {
            "id": str(uuid.uuid4()),
            "organization_id": org1_id,
            "nombres": "RODRIGO ALEJANDRO",
            "apellido_paterno": "VARGAS",
            "apellido_materno": "SOTO",
            "rut": "15.777.888-9",
            "fecha_ingreso": "2023-05-10",
            "cargo": "CONTADOR AUDITOR",
            "sueldo_base": 1500000,
            "activo": True
        },
        {
            "id": str(uuid.uuid4()),
            "organization_id": org1_id,
            "nombres": "CARLA ANDREA",
            "apellido_paterno": "PAREDES",
            "apellido_materno": "MUÑOZ",
            "rut": "18.333.444-5",
            "fecha_ingreso": "2024-01-01",
            "cargo": "SECRETARIA",
            "sueldo_base": 850000,
            "activo": True
        }
    ]).execute()

    # --- EMPRESA 2: CONSTRUCTORA DEL ESTRECHO ---
    print("\n🏢 Creando Empresa 2...")
    org2_id = str(uuid.uuid4())
    org2 = {
        "id": org2_id,
        "nombre": "CONSTRUCTORA DEL ESTRECHO",
        "rut_empresa": "78.222.222-2",
        "direccion": "AV. INDEPENDENCIA 450",
        "comuna": "PUNTA ARENAS",
        "region": "MAGALLANES",
        "giro": "CONSTRUCCION"
    }
    db.table("organizations").insert(org2).execute()

    # Vincular usuario a Empresa 2
    db.table("organization_members").insert({
        "organization_id": org2_id,
        "user_id": CURRENT_USER_ID,
        "role": "owner"
    }).execute()

    # Rep Legal Empresa 2
    db.table("organization_payroll_settings").insert({
        "organization_id": org2_id,
        "rep_legal_nombre": "MARIA JOSE CONTRERAS",
        "rep_legal_rut": "14.222.333-K",
        "rep_legal_cargo": "SOCIA ADMINISTRADORA"
    }).execute()

    # Empleados Empresa 2
    print("👥 Creando Empleados Empresa 2...")
    db.table("employees").insert([
        {
            "id": str(uuid.uuid4()),
            "organization_id": org2_id,
            "nombres": "ESTEBAN QUITO",
            "apellido_paterno": "DEL REAL",
            "apellido_materno": "ARAYA",
            "rut": "17.111.999-0",
            "fecha_ingreso": "2022-10-15",
            "cargo": "JORNAL",
            "sueldo_base": 650000,
            "activo": True
        },
        {
            "id": str(uuid.uuid4()),
            "organization_id": org2_id,
            "nombres": "VALENTINA",
            "apellido_paterno": "VILLAGRA",
            "apellido_materno": "REYES",
            "rut": "19.888.777-6",
            "fecha_ingreso": "2024-11-20",
            "cargo": "PREVENCIONISTA",
            "sueldo_base": 1100000,
            "activo": True
        }
    ]).execute()

    print("\n🚀 DATOS FICTICIOS INYECTADOS!")
    print("Resumen:")
    print("- 2 Empresas de Punta Arenas.")
    print("- 4 Trabajadores con cargos y sueldos reales.")
    print("- Listos para generar contratos inteligentes.")

if __name__ == "__main__":
    seed_database()
