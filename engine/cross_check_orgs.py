
from core.database import get_supabase

def cross_check():
    db = get_supabase()
    
    # 1. Listar todas las empresas con sus IDs
    orgs = db.table("organizations").select("id, name").execute().data or []
    print("--- Auditoría de Datos por Empresa ---")
    for o in orgs:
        # Contar sus compras
        p_count = db.table("purchase_records").select("id", count="exact").eq("organization_id", o['id']).execute().count
        # Contar sus ventas
        s_count = db.table("sales_records").select("id", count="exact").eq("organization_id", o['id']).execute().count
        print(f"Empresa: {o['name']} | ID: {o['id']} | Compras: {p_count} | Ventas: {s_count}")

if __name__ == "__main__":
    cross_check()
