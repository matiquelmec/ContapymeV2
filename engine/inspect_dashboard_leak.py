
from core.database import get_supabase

def inspect_org_data():
    db = get_supabase()
    
    # 1. Identificar a Innovación Austral
    org_res = db.table("organizations").select("id, name").ilike("name", "%Innovación Austral%").execute()
    if not org_res.data:
        print("No se encontró la organización 'Innovación Austral'.")
        # Listar todas para estar seguro
        all_orgs = db.table("organizations").select("id, name").execute()
        print("Organizaciones disponibles:", all_orgs.data)
        return
    
    org = org_res.data[0]
    org_id = org['id']
    print(f"--- Investigando Dashboard de: {org['name']} ({org_id}) ---")

    # 2. Buscar registros con periodo 2025 para esta organización
    p_2025_res = db.table("purchase_records").select("id").eq("organization_id", org_id).gte("periodo", "2025-01-01").lt("periodo", "2026-01-01").execute()
    s_2025_res = db.table("sales_records").select("id").eq("organization_id", org_id).gte("periodo", "2025-01-01").lt("periodo", "2026-01-01").execute()
    
    p_count = len(p_2025_res.data) if p_2025_res.data else 0
    s_count = len(s_2025_res.data) if s_2025_res.data else 0
    
    print(f"\nRegistros en 2025 para esta empresa ({org['name']}):")
    print(f"  > Compras: {p_count}")
    print(f"  > Ventas: {s_count}")

    # 3. VERIFICAR CRUCE DE DATOS (¿Hay datos de otras empresas?)
    print("\n--- Verificando posible cruce de datos (Multi-tenancy) ---")
    all_purchases = db.table("purchase_records").select("organization_id").limit(100).execute()
    org_ids_in_db = set([r['organization_id'] for r in all_purchases.data or []])
    print(f"IDs de empresas con datos en la tabla de compras: {org_ids_in_db}")
    
    if len(org_ids_in_db) > 1:
        print("ALERTA: Existen múltiples empresas en la base de datos. Verificando aislamiento...")
    else:
        print("Aislamiento OK: Solo se detecta una empresa con datos.")

    # 4. Ver si el Dashboard está "atrapado" en un cache
    all_p = db.table("purchase_records").select("periodo").eq("organization_id", org_id).execute()
    distinct_p = sorted(list(set([r['periodo'] for r in all_p.data or []])))
    print(f"\nPeriodos REALES en la base de datos para esta empresa: {distinct_p}")

if __name__ == "__main__":
    inspect_org_data()
