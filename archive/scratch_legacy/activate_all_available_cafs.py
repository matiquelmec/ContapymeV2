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

ORGANIZATION_ID = "19b78bd1-6019-4329-bd8d-b75d5ae9049d"  # Inversiones Riquelme

def activate_cafs():
    print("=== ACTIVANDO CAFs CON FOLIOS DISPONIBLES ===")
    try:
        # Obtener todos los CAFs de la organización
        res = supabase.table("dte_caf_folios")\
            .select("id, tipo_dte, range_start, range_end, last_used_folio, environment, is_active")\
            .eq("organization_id", ORGANIZATION_ID)\
            .execute()
        
        cafs = res.data or []
        print(f"Total folios auditados: {len(cafs)}")
        
        activated_count = 0
        deactivated_count = 0
        
        for c in cafs:
            range_end = c["range_end"]
            last_used = c["last_used_folio"]
            
            # Si el último folio usado es menor que el rango final, aún quedan folios disponibles
            if last_used < range_end:
                if not c["is_active"]:
                    supabase.table("dte_caf_folios").update({"is_active": True}).eq("id", c["id"]).execute()
                    print(f"Activado -> Tipo {c['tipo_dte']} | Rango: {c['range_start']}-{range_end} | Usado: {last_used} | Amb: {c['environment']}")
                    activated_count += 1
            else:
                # Si ya se usaron todos los folios, debe estar inactivo
                if c["is_active"]:
                    supabase.table("dte_caf_folios").update({"is_active": False}).eq("id", c["id"]).execute()
                    print(f"Desactivado (Agotado) -> Tipo {c['tipo_dte']} | Rango: {c['range_start']}-{range_end} | Usado: {last_used} | Amb: {c['environment']}")
                    deactivated_count += 1
                    
        print(f"\nProceso finalizado.")
        print(f"  CAFs activados (tienen folios libres): {activated_count}")
        print(f"  CAFs desactivados (ya agotados): {deactivated_count}")
        
    except Exception as e:
        print(f"Error al activar CAFs: {e}")

if __name__ == "__main__":
    activate_cafs()
