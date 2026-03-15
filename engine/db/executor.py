import sys
import os
import argparse

# Añadir el path raíz del motor para importar core.database
# El script está en engine/db, la raíz es engine/
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import get_supabase

def apply_sql(file_path):
    print(f"Aplicando {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        sql = f.read()
    
    db = get_supabase()
    
    # Intentar ejecutar vía rpc exec_sql
    try:
        # Nota: La función exec_sql debe existir en Postgres
        # Si no existe, este script fallará.
        # En Supabase local usualmente no viene por defecto, pero nosotros la solemos crear.
        db.rpc("exec_sql", {"query": sql}).execute()
        print("✅ SQL aplicado exitosamente.")
    except Exception as e:
        print(f"❌ Error al aplicar SQL: {e}")
        print("Probablemente la función 'exec_sql' no existe en la base de datos.")
        print("Intenta ejecutar el SQL manualmente en el Dashboard de Supabase.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Ruta al archivo SQL")
    args = parser.parse_args()
    apply_sql(args.file)
