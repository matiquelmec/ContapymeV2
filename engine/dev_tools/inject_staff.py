from core.database import get_supabase
import uuid

def inject_clean_staff():
    db = get_supabase()
    USER_ID = "4369feb8-e9cd-4f7c-8446-cf5729e76147"

    print("💉 Inyectando personal profesional para las 2 empresas definitivas...")

    # 1. Obtener las IDs de las empresas actuales
    res = db.table("organizations").select("id, nombre, rut_empresa").execute()
    orgs = {o["nombre"]: o["id"] for o in res.data}

    org_a_id = orgs.get("Logística Patagonia SpA")
    org_b_id = orgs.get("Innovación Austral Ltda")

    if not org_a_id or not org_b_id:
        print("❌ Error: No se encontraron las empresas. Ejecuta primero la limpieza.")
        return

    print("🧹 Limpiando personal y configuraciones previas...")
    active_ids = [org_a_id, org_b_id]
    # Limpiamos tablas dependientes primero
    db.table("liquidations").delete().in_("organization_id", active_ids).execute()
    db.table("employment_contracts").delete().in_("organization_id", active_ids).execute()
    db.table("employees").delete().in_("organization_id", active_ids).execute()
    db.table("fixed_assets").delete().in_("organization_id", active_ids).execute()
    db.table("organization_payroll_settings").delete().in_("organization_id", active_ids).execute()

    # 2. Inyectar personal para Empresa A
    print(f"🚚 Cargando personal para {org_a_id} (Logística)...")
    db.table("employees").insert([
        {
            "organization_id": org_a_id,
            "nombres": "Andrés Felipe",
            "apellido_paterno": "Soto",
            "apellido_materno": "Vargas",
            "rut": "14.222.333-4",
            "fecha_ingreso": "2023-01-15",
            "cargo": "Chofer Camión Pesado",
            "sueldo_base": 1100000,
            "afp": "ProVida",
            "prevision_salud": "Fonasa",
            "activo": True
        },
        {
            "organization_id": org_a_id,
            "nombres": "María Ignacia",
            "apellido_paterno": "Torres",
            "apellido_materno": "Gómez",
            "rut": "16.777.888-5",
            "fecha_ingreso": "2024-02-01",
            "cargo": "Secretaria Administrativa",
            "sueldo_base": 750000,
            "afp": "Modelo",
            "prevision_salud": "Isapre Banmédica",
            "activo": True
        }
    ]).execute()

    # 3. Inyectar personal para Empresa B
    print(f"💻 Cargando personal para {org_b_id} (Tecnología)...")
    db.table("employees").insert([
        {
            "organization_id": org_b_id,
            "nombres": "Diego Alberto",
            "apellido_paterno": "Cárdenas",
            "apellido_materno": "Rojas",
            "rut": "18.333.222-1",
            "fecha_ingreso": "2022-11-01",
            "cargo": "Desarrollador Senior",
            "sueldo_base": 2200000,
            "afp": "Habitat",
            "prevision_salud": "Isapre Colmena",
            "activo": True
        }
    ]).execute()

    # 4. Inyectar Activos para que no se vea vacío
    print("🏭 Inyectando activos...")
    db.table("fixed_assets").insert([
        {
            "organization_id": org_a_id,
            "nombre": "Camión Scania R450",
            "numero_serie": "SC12345678",
            "fecha_adquisicion": "2023-06-15",
            "valor_adquisicion": 85000000,
            "vida_util_meses": 60,
            "valor_libro_actual": 85000000
        }
    ]).execute()

    # 5. Inyectar Settings de Payroll para evitar el aviso de "Configuración Incompleta"
    print("⚙️ Inyectando configuración de Remuneraciones...")
    db.table("organization_payroll_settings").insert([
        {
            "organization_id": org_a_id,
            "rep_legal_nombre": "Matías Riquelme",
            "rep_legal_rut": "12.345.678-9",
            "rep_legal_cargo": "Gerente General",
            "sueldo_minimo": 529000
        },
        {
            "organization_id": org_b_id,
            "rep_legal_nombre": "Paula Rivera",
            "rep_legal_rut": "15.987.654-2",
            "rep_legal_cargo": "Directora Ejecutiva",
            "sueldo_minimo": 529000
        }
    ]).execute()

    print("✨ PERSONAL E INFRAESTRUCTURA INYECTADA.")

if __name__ == "__main__":
    inject_clean_staff()
