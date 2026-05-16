from core.database import get_supabase

def list_orgs():
    supabase = get_supabase()
    res = supabase.table("organizations").select("id, nombre, rut_empresa").execute()
    print("--- ORGANIZACIONES DISPONIBLES ---")
    for org in res.data:
        print(f"ID: {org['id']} | Nombre: {org['nombre']} | RUT: {org['rut_empresa']}")

if __name__ == "__main__":
    list_orgs()
