import requests
import json

SUPABASE_URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"

def fix_account_ids(org_id):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    print(f"--- Reparando Integridad de Datos para ORG: {org_id} ---")
    
    # 1. Obtener Mapa Código -> ID
    chart_url = f"{SUPABASE_URL}/rest/v1/chart_of_accounts?organization_id=eq.{org_id}&select=id,codigo"
    chart_res = requests.get(chart_url, headers=headers)
    chart_map = {acc['codigo']: acc['id'] for acc in chart_res.json()}
    
    # 2. Obtener Líneas con Account ID nulo
    lines_url = f"{SUPABASE_URL}/rest/v1/journal_entry_lines?organization_id=eq.{org_id}&account_id=is.null&select=id,cuenta_codigo"
    lines_res = requests.get(lines_url, headers=headers)
    lines_to_fix = lines_res.json()
    
    print(f"Encontradas {len(lines_to_fix)} líneas para reparar.")
    
    # 3. Reparar una por una (o en batches si es posible vía PATCH con filtros específicos, 
    # pero aquí cada una tiene un ID diferente, así que lo haremos simple)
    fixed_count = 0
    for line in lines_to_fix:
        acc_id = chart_map.get(line['cuenta_codigo'])
        if acc_id:
            patch_url = f"{SUPABASE_URL}/rest/v1/journal_entry_lines?id=eq.{line['id']}"
            patch_res = requests.patch(patch_url, headers=headers, json={"account_id": acc_id})
            if patch_res.ok:
                fixed_count += 1
            else:
                print(f"Error al reparar línea {line['id']}: {patch_res.text}")
        else:
            print(f"Aviso: No se encontró ID para el código {line['cuenta_codigo']}")
            
    print(f"Proceso completado. Líneas reparadas: {fixed_count}")

if __name__ == "__main__":
    # Reparamos para la organización de prueba primero
    fix_account_ids("f8758d56-0675-41e4-bc31-e3013052292a")
    # Y para Contapymepuq si tuviera (aunque vimos que no tenía asientos, por si acaso)
    fix_account_ids("2e9f634b-4087-448c-bfa6-244bfa1eec61")
