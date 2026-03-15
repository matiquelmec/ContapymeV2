from core.database import get_supabase
import json

db = get_supabase()

def debug():
    res = db.table("chart_of_accounts").select("*").eq("codigo", "3456").execute()
    if res.data:
        acc = res.data[0]
        print(f"ID: {acc['id']}")
        print(f"Code: {acc['codigo']}")
        print(f"Name: {acc['nombre']}")
        print(f"Level: {acc['nivel']}")
        print(f"Type: {acc['tipo']}")
        print(f"Nature: {acc['naturaleza']}")
        print(f"Accepts Movement: {acc['acepta_movimiento']}")
    else:
        print("Account not found.")

if __name__ == "__main__":
    debug()
