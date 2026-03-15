from core.database import get_supabase

def check_terminations_schema():
    db = get_supabase()
    try:
        res = db.table("employee_terminations").select("*").limit(1).execute()
        if res.data:
            cols = list(res.data[0].keys())
            print(f"COLUMNAS REALES EN employee_terminations: {cols}")
        else:
            print("No hay datos en employee_terminations para inferir columnas.")
            # Intentar obtener info de la API si es posible o simplemente fallar
    except Exception as e:
        print(f"Error al obtener esquema: {e}")

if __name__ == "__main__":
    check_terminations_schema()
