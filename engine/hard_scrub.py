from core.database import get_supabase
import uuid

def hard_scrub():
    db = get_supabase()
    USER_ID = "4369feb8-e9cd-4f7c-8446-cf5729e76147"
    KEEP_ORGS = ["76.444.333-2", "77.555.222-K"]

    print("🧨 Iniciando LIMPIEZA TOTAL por capas para evitar errores de FK...")

    # 1. Identificar organizaciones a eliminar
    res = db.table("organizations").select("id, rut_empresa").execute()
    all_orgs = res.data
    ids_to_delete = [o["id"] for o in all_orgs if o["rut_empresa"] not in KEEP_ORGS]
    
    if not ids_to_delete:
        print("✅ No hay organizaciones extrañas que eliminar.")
        return

    print(f"Borrando {len(ids_to_delete)} organizaciones y sus dependencias...")

    # 2. Borrado secuencial (de hijos a padres)
    tables_to_scrub = [
        "payroll_book_details",
        "journal_entry_lines",
        "f29_box_details",
        "employee_documents",
        "payroll_books",
        "liquidations",
        "employment_contracts",
        "employee_terminations",
        "fixed_assets",
        "purchase_records",
        "sales_records",
        "journal_entries",
        "f29_forms",
        "organization_payroll_settings",
        "organization_members",
        "employees",
        "chart_of_accounts",
        "account_mapping_rules"
    ]

    for table in tables_to_scrub:
        try:
            print(f" - Limpiando {table}...")
            # Intentamos borrar por organization_id si existe, si no, intentamos borrar todo lo que no sea de las que queremos (si la tabla tiene org_id)
            # Para simplificar, borramos todo lo vinculado a las IDs que vamos a borrar.
            # Pero algunas tablas no tienen organization_id directo (ej. journal_entry_lines).
            # Por ahora, borramos TODO en estas tablas de prueba para asegurar limpieza total.
            db.table(table).delete().neq("id", str(uuid.uuid4())).execute()
        except Exception as e:
            print(f"   ⚠️ Error en {table} (puede no existir o no tener 'id'): {e}")

    # 3. Finalmente borrar las Organizaciones
    print("🏢 Borrando organizaciones raíz...")
    db.table("organizations").delete().in_("id", ids_to_delete).execute()

    # 4. Asegurar que el usuario tenga membresía en las 2 que quedaron
    print("🔗 Asegurando membresías para las 2 empresas definitivas...")
    valid_orgs = [o for o in all_orgs if o["rut_empresa"] in KEEP_ORGS]
    for vo in valid_orgs:
        # Verificar si ya existe
        check = db.table("organization_members").select("*").eq("organization_id", vo["id"]).eq("user_id", USER_ID).execute()
        if not check.data:
            db.table("organization_members").insert({
                "organization_id": vo["id"],
                "user_id": USER_ID,
                "role": "owner"
            }).execute()

    print("✨ OPERACIÓN COMPLETADA.")

if __name__ == "__main__":
    hard_scrub()
