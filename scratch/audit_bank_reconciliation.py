import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Cargar variables de entorno del backend
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "engine", ".env")
load_dotenv(dotenv_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: No se cargaron las variables de entorno de Supabase.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def audit_caf_status():
    org_id = "19b78bd1-6019-4329-bd8d-b75d5ae9049d"  # Inversiones Riquelme
    print(f"=== AUDITORÍA DE ESTADO DE CAF (dte_caf_folios) ===")
    try:
        res = supabase.table("dte_caf_folios")\
            .select("id, tipo_dte, range_start, range_end, last_used_folio, environment, is_active")\
            .eq("organization_id", org_id)\
            .order("tipo_dte")\
            .order("range_start")\
            .execute()
        
        cafs = res.data or []
        print(f"Total folios en base de datos: {len(cafs)}")
        
        # Agrupar por tipo DTE y mostrar estado
        current_type = None
        for c in cafs:
            if c["tipo_dte"] != current_type:
                current_type = c["tipo_dte"]
                print(f"\nTipo DTE: {current_type}")
            status = "ACTIVO" if c["is_active"] else "INACTIVO"
            print(f"  Rango: {c['range_start']}-{c['range_end']} | Ult. Usado: {c['last_used_folio']} | Amb: {c['environment']} | Estado: {status}")
            
    except Exception as e:
        print(f"Error al auditar dte_caf_folios: {e}")

if __name__ == "__main__":
    audit_caf_status()
