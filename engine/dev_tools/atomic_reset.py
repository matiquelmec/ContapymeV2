import os
import uuid
from datetime import date
from core.database import get_supabase

def atomic_reset():
    db = get_supabase()
    USER_ID = "4369feb8-e9cd-4f7c-8446-cf5729e76147" 

    print(f"🚀 Iniciando RESET ATÓMICO para el usuario {USER_ID}...")

    # 1. Obtener todas las membresías de este usuario
    try:
        memberships = db.table("organization_members").select("organization_id").eq("user_id", USER_ID).execute()
        org_ids = [m["organization_id"] for m in memberships.data]
        
        if org_ids:
            print(f"Encontradas {len(org_ids)} organizaciones vinculadas. Eliminando...")
            # Eliminamos las organizaciones. CASCADE debería limpiar todo.
            db.table("organizations").delete().in_("id", org_ids).execute()
            print("✅ Organizaciones antiguas eliminadas.")
        else:
            print("ℹ️ No se encontraron organizaciones vinculadas.")

        # 2. SEGUNDA PASADA: Limpieza por RUT para asegurar que no queden duplicados de nombres anteriores
        # (A veces hay orgs sin membresía que podrían molestar si se crearon mal)
        target_ruts = ["76.444.333-2", "77.555.222-K", "76.xxx.xxx-x", "77.111.111-1", "78.222.222-2"]
        db.table("organizations").delete().in_("rut_empresa", target_ruts).execute()

    except Exception as e:
        print(f"⚠️ Error durante limpieza: {e}")

    # 3. Datos Finales "Nivel Mundial"
    print("\n🏗️ Inyectando las 2 empresas definitivas...")
    
    # Empresa A
    org_a_id = str(uuid.uuid4())
    db.table("organizations").insert({
        "id": org_a_id,
        "nombre": "Logística Patagonia SpA",
        "rut_empresa": "76.444.333-2",
        "direccion": "O'Higgins 1540, Punta Arenas",
        "comuna": "Punta Arenas",
        "region": "Magallanes",
        "giro": "Transporte de carga y logística aérea"
    }).execute()

    # Empresa B
    org_b_id = str(uuid.uuid4())
    db.table("organizations").insert({
        "id": org_b_id,
        "nombre": "Innovación Austral Ltda",
        "rut_empresa": "77.555.222-K",
        "direccion": "Bories 620, Of 402, Punta Arenas",
        "comuna": "Punta Arenas",
        "region": "Magallanes",
        "giro": "Consultoría informática y desarrollo"
    }).execute()

    # Membresías
    db.table("organization_members").insert([
        {"organization_id": org_a_id, "user_id": USER_ID, "role": "owner"},
        {"organization_id": org_b_id, "user_id": USER_ID, "role": "owner"}
    ]).execute()

    # Configs base
    for oid in [org_a_id, org_b_id]:
        db.table("organization_payroll_settings").insert({
            "organization_id": oid,
            "sueldo_minimo": 529000,
            "rep_legal_nombre": "Matías Riquelme" if oid == org_a_id else "Paula Rivera"
        }).execute()

    print("\n✨ RESET COMPLETADO. Ahora solo deberían aparecer 2 empresas.")

if __name__ == "__main__":
    atomic_reset()
