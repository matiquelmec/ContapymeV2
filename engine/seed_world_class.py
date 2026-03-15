import os
import uuid
from datetime import date, timedelta
from core.database import get_supabase

def seed_world_class():
    db = get_supabase()
    USER_ID = "4369feb8-e9cd-4f7c-8446-cf5729e76147" # matiquelme.inversiones@gmail.com

    print(f"🧹 Limpiando datos previos para el usuario {USER_ID}...")
    
    # 1. Obtener IDs de organizaciones actuales del usuario para limpiar en cascada
    try:
        # Primero intentamos por RUTs específicos para evitar colisiones
        target_ruts = ["76.444.333-2", "77.555.222-K"]
        db.table("organizations").delete().in_("rut_empresa", target_ruts).execute()
        
        # Luego limpiamos lo que el usuario ya tenga vinculado
        user_memberships = db.table("organization_members").select("organization_id").eq("user_id", USER_ID).execute()
        org_ids_to_clean = [m["organization_id"] for m in user_memberships.data]
        
        if org_ids_to_clean:
            print(f"Eliminando {len(org_ids_to_clean)} organizaciones vinculadas...")
            db.table("organizations").delete().in_("id", org_ids_to_clean).execute()
        
        print("✨ Limpieza completada.")
    except Exception as e:
        print(f"⚠️ Aviso durante la limpieza: {e}")

    # --- EMPRESA A: LOGÍSTICA PATAGONIA SpA ---
    print("\n🏢 Inyectando Empresa A: Logística Patagonia SpA...")
    org_a_id = str(uuid.uuid4())
    db.table("organizations").insert({
        "id": org_a_id,
        "nombre": "Logística Patagonia SpA",
        "rut_empresa": "76.444.333-2",
        "direccion": "O'Higgins 1540, Punta Arenas",
        "comuna": "Punta Arenas",
        "region": "Magallanes",
        "giro": "Transporte de carga y logística aérea",
        "email": "contacto@logpatagonia.cl"
    }).execute()

    db.table("organization_members").insert({
        "organization_id": org_a_id,
        "user_id": USER_ID,
        "role": "owner"
    }).execute()

    db.table("organization_payroll_settings").insert({
        "organization_id": org_a_id,
        "sueldo_minimo": 529000,
        "rep_legal_nombre": "Matías Riquelme",
        "rep_legal_rut": "12.345.678-9",
        "rep_legal_cargo": "Gerente General"
    }).execute()

    # --- EMPRESA B: INNOVACIÓN AUSTRAL LTDA ---
    print("🏢 Inyectando Empresa B: Innovación Austral Ltda...")
    org_b_id = str(uuid.uuid4())
    db.table("organizations").insert({
        "id": org_b_id,
        "nombre": "Innovación Austral Ltda",
        "rut_empresa": "77.555.222-K",
        "direccion": "Bories 620, Of 402, Punta Arenas",
        "comuna": "Punta Arenas",
        "region": "Magallanes",
        "giro": "Consultoría informática y desarrollo de software",
        "email": "adm@innovaustral.cl"
    }).execute()

    db.table("organization_members").insert({
        "organization_id": org_b_id,
        "user_id": USER_ID,
        "role": "owner"
    }).execute()

    db.table("organization_payroll_settings").insert({
        "organization_id": org_b_id,
        "sueldo_minimo": 529000,
        "rep_legal_nombre": "Paula Rivera",
        "rep_legal_rut": "15.987.654-2",
        "rep_legal_cargo": "Directora Ejecutiva"
    }).execute()

    # --- DATOS PARA EMPRESA A ---
    print("🚚 Cargando personal y activos para Logística Patagonia...")
    # Empleados
    db.table("employees").insert([
        {
            "id": str(uuid.uuid4()),
            "organization_id": org_a_id,
            "nombres": "Andrés Felipe",
            "apellido_paterno": "Soto",
            "rut": "14.222.333-4",
            "fecha_ingreso": "2023-01-15",
            "cargo": "Chofer Camión Pesado",
            "sueldo_base": 1100000,
            "afp": "ProVida",
            "prevision_salud": "Fonasa"
        },
        {
            "id": str(uuid.uuid4()),
            "organization_id": org_a_id,
            "nombres": "María Ignacia",
            "apellido_paterno": "Torres",
            "rut": "16.777.888-5",
            "fecha_ingreso": "2024-02-01",
            "cargo": "Secretaria Administrativa",
            "sueldo_base": 750000,
            "afp": "Modelo",
            "prevision_salud": "Isapre Banmédica"
        }
    ]).execute()

    # Activos Fijos
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

    # --- DATOS PARA EMPRESA B ---
    print("💻 Cargando personal para Innovación Austral...")
    # Empleados
    db.table("employees").insert([
        {
            "id": str(uuid.uuid4()),
            "organization_id": org_b_id,
            "nombres": "Diego Alberto",
            "apellido_paterno": "Cárdenas",
            "rut": "18.333.222-1",
            "fecha_ingreso": "2022-11-01",
            "cargo": "Desarrollador Senior",
            "sueldo_base": 2200000,
            "afp": "Habitat",
            "prevision_salud": "Isapre Colmena"
        }
    ]).execute()
    
    # --- DATOS PARA EMPRESA B (CONTABILIDAD) ---
    print("💻 Generando asiento contable para Innovación Austral...")
    journal_id = str(uuid.uuid4())
    db.table("journal_entries").insert({
        "id": journal_id,
        "organization_id": org_b_id,
        "fecha": str(date.today()),
        "glosa": "Apertura de caja inicial y capital social"
    }).execute()

    # --- PLAN DE CUENTAS (COA) PARA AMBAS ---
    print("📈 Sembrando Plan de Cuentas básico...")
    for org_id in [org_a_id, org_b_id]:
        db.table("chart_of_accounts").insert([
            {"organization_id": org_id, "codigo": "1.1.01", "nombre": "Caja", "nivel": 3, "tipo": "Activo", "naturaleza": "deudora"},
            {"organization_id": org_id, "codigo": "1.1.02", "nombre": "Banco Santander", "nivel": 3, "tipo": "Activo", "naturaleza": "deudora"},
            {"organization_id": org_id, "codigo": "1.1.03", "nombre": "IVA Crédito Fiscal", "nivel": 3, "tipo": "Activo", "naturaleza": "deudora"},
            {"organization_id": org_id, "codigo": "4.1.01", "nombre": "Ventas de Servicios", "nivel": 3, "tipo": "Ingreso", "naturaleza": "acreedora"}
        ]).execute()

    # Líneas de diario ahora que tenemos cuentas
    db.table("journal_entry_lines").insert([
        {"entry_id": journal_id, "cuenta_codigo": "1.1.01", "cuenta_nombre": "Caja", "tipo": "debe", "monto": 5000000},
        {"entry_id": journal_id, "cuenta_codigo": "4.1.01", "cuenta_nombre": "Capital Social / Ventas", "tipo": "haber", "monto": 5000000}
    ]).execute()

    print("\n🚀 INYECCIÓN REALIZADA CON ÉXITO!")
    print("------------------------------------------")
    print(f"Usuario: {USER_ID}")
    print(f"Empresa A: Logística Patagonia SpA (Transporte)")
    print(f"Empresa B: Innovación Austral Ltda (Tecnología)")
    print("------------------------------------------")
    print("Los datos son visibles ahora en el Dashboard.")

if __name__ == "__main__":
    seed_world_class()
