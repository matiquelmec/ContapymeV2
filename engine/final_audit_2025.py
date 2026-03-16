
from core.database import get_supabase

def final_audit():
    db = get_supabase()
    
    # Buscar Innovación Austral
    org = db.table("organizations").select("id, name").ilike("name", "%Innovación Austral%").execute().data[0]
    org_id = org['id']
    
    # Contar registros mal etiquetados persistentes
    p_2025 = db.table("purchase_records").select("id, periodo, fecha_docto").eq("organization_id", org_id).gte("periodo", "2025-01-01").execute()
    
    print(f"Empresa: {org['name']}")
    print(f"Registros persistentes en 2025: {len(p_2025.data)}")
    
    if p_2025.data:
        print("Muestra de los culpables:")
        for r in p_2025.data[:5]:
            print(f"  ID: {r['id']} | Periodo: {r['periodo']} | Fecha Docto: {r['fecha_docto']}")

if __name__ == "__main__":
    final_audit()
