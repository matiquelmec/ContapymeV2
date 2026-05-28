import os
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
db = create_client(url, key)

def delete_all_dtes():
    print("Iniciando eliminación de todos los DTEs emitidos...")
    
    # 1. Obtener los DTEs actuales para mostrar lo que se va a borrar
    try:
        res = db.table("dte_issued").select("id, folio, tipo_dte, status").execute()
        dtes = res.data
        if not dtes:
            print("No hay DTEs en la tabla 'dte_issued' para eliminar.")
            return
            
        print(f"Se encontraron {len(dtes)} DTEs en la base de datos:")
        for d in dtes:
            print(f" - ID: {d['id']} | Folio: {d['folio']} | Tipo: {d['tipo_dte']} | Estado: {d['status']}")
            
        # 2. Proceder con la eliminación (filtramos sin condiciones para borrar todos los registros)
        # Nota: Al usar delete() en supabase-py sin filtros puede requerir una condición o permitir borrar todo.
        # Para estar seguros, borramos por IDs o usando un filtro amplio de created_at no nulo.
        ids_to_delete = [d['id'] for d in dtes]
        
        print("\nEliminando registros...")
        del_res = db.table("dte_issued").delete().in_("id", ids_to_delete).execute()
        
        print(f"¡Éxito! Registros eliminados de 'dte_issued': {len(del_res.data)}")
        
    except Exception as e:
        print("Ocurrió un error al intentar eliminar los DTEs:", e)

if __name__ == "__main__":
    delete_all_dtes()
