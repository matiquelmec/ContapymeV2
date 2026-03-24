import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados.")
    exit(1)

supabase: Client = create_client(URL, KEY)

def run_test():
    print("--- TEST DE INTEGRACION: ACTIVOS FIJOS -> CONTABILIDAD ---")
    
    # 1. Obtener organización activa
    try:
        org_res = supabase.from_("organizations").select("id").limit(1).execute()
        if not org_res.data:
            print("X No hay organizaciones registradas.")
            return
        
        org_id = org_res.data[0]["id"]
        print(f"ok Usando Org ID: {org_id}")

        # 2. Limpiar tests previos
        supabase.from_("fixed_assets").delete().eq("nombre", "TEST_ASSET_IPAD").execute()

        # 3. Crear Activo de prueba (ADQUIRIDO HACE 1 MES PARA QUE DEPRECIE AHORA)
        from datetime import datetime, timedelta
        last_month = (datetime.now().date().replace(day=1) - timedelta(days=5)).replace(day=1).strftime("%Y-%m-%d")

        asset_data = {
            "organization_id": org_id,
            "nombre": "TEST_ASSET_IPAD",
            "descripcion": "iPad Pro para Pruebas de Integracion",
            "fecha_adquisicion": last_month,
            "valor_adquisicion": 1200000,
            "vida_util_meses": 12,
            "valor_residual": 0,
            "metodo_depreciacion": "lineal",
            "condicion": "activo",
            "categoria": "Electronica",
            "marca": "Apple"
        }
        
        engine_url = "http://localhost:8000/api/v1/assets/create"
        res_create = requests.post(engine_url, json=asset_data)
        if res_create.status_code != 200:
            print(f"X Error al crear activo via Engine: {res_create.json()}")
            return
        
        asset = res_create.json()["data"]
        asset_id = asset["id"]
        print(f"ok Activo creado exitosamente (ID: {asset_id})")

        # 4. LLAMAR A DEPRECIACION
        today_period = datetime.now().replace(day=1).strftime("%Y-%m-%d")
        print(f"Ejecutando depreciacion para periodo: {today_period}...")
        
        res_dep = requests.post("http://localhost:8000/api/v1/assets/depreciate", json={
            "org_id": org_id,
            "periodo": today_period
        })
        
        if res_dep.status_code != 200:
             print(f"X Error en motor de depreciacion: {res_dep.json()}")
             return
        
        dep_data = res_dep.json()
        print(f"ok Motor respondio: {dep_data['message']}")

        # 5. VERIFICAR ASIENTO CONTABLE
        journal_res = supabase.from_("journal_entries") \
            .select("*, journal_entry_lines(*)") \
            .eq("fixed_asset_id", asset_id) \
            .execute()
        
        if journal_res.data and len(journal_res.data) > 0:
            entry = journal_res.data[0]
            print(f"!!! EXITO !!! Se encontro el asiento contable vinculado (ID: {entry['id']})")
            print(f"Glosa: {entry['glosa']}")
            for line in entry["journal_entry_lines"]:
                print(f"-> {line['cuenta_nombre']} ({line['tipo']}): ${int(line['monto'])}")
        else:
            print("X No se encontro el asiento contable para este activo.")

    except Exception as e:
        import traceback
        print(f"X Fallo critico en el test: {e}\n{traceback.format_exc()}")

if __name__ == "__main__":
    run_test()
