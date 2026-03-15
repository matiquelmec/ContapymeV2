
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

def check_world_class_schema():
    print(f"🔍 Iniciando verificación de Esquema V2 en {url}...")
    
    checks = {
        "Tabla profiles": "profiles",
        "Tabla account_mapping_rules": "account_mapping_rules",
        "Tabla f29_box_details": "f29_box_details",
        "Tabla employee_terminations": "employee_terminations"
    }
    
    errors = 0
    
    for label, table in checks.items():
        try:
            # Intentamos una consulta simple que falle si la tabla no existe
            supabase.table(table).select("count", count="exact").limit(1).execute()
            print(f"✅ {label}: EXISTE")
        except Exception as e:
            print(f"❌ {label}: NO ENCONTRADA o error: {e}")
            errors += 1
            
    # Verificar columnas específicas vía RPC o intentando un select de esas columnas
    try:
        # Probamos liquidations con las nuevas columnas
        supabase.table("liquidations").select("id, calculation_snapshot, account_id_neto").limit(1).execute()
        print("✅ Columnas en 'liquidations': CORRECTAS")
    except Exception as e:
        print(f"❌ Columnas en 'liquidations': ERROR (Posiblemente faltan campos)")
        errors += 1

    try:
        # Probamos employment_contracts con las nuevas columnas
        supabase.table("employment_contracts").select("id, version, parent_contract_id").limit(1).execute()
        print("✅ Columnas en 'employment_contracts': CORRECTAS")
    except Exception as e:
        print(f"❌ Columnas en 'employment_contracts': ERROR (Posiblemente faltan campos)")
        errors += 1

    try:
        # Probamos employee_terminations con las nuevas columnas
        supabase.table("employee_terminations").select("id, notice_indemnification_amount, worked_days_last_month").limit(1).execute()
        print("✅ Columnas en 'employee_terminations': CORRECTAS")
    except Exception as e:
        print(f"❌ Columnas en 'employee_terminations': ERROR (Faltan campos como notice_indemnification_amount)")
        errors += 1

    if errors == 0:
        print("\n🏆 ¡VERIFICACIÓN EXITOSA! Tu base de datos ahora es de Nivel Mundial.")
    else:
        print(f"\n⚠️ Se encontraron {errors} discrepancias en el esquema.")

if __name__ == "__main__":
    check_world_class_schema()
