import requests
import json

SUPABASE_URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"

def full_database_repair():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    print("--- INICIANDO REPARACION MASIVA ---")
    
    # 1. Obtener todas las organizaciones (usando 'nombre' en vez de 'name')
    orgs_res = requests.get(f"{SUPABASE_URL}/rest/v1/organizations?select=id,nombre", headers=headers)
    orgs = orgs_res.json()
    
    if 'code' in orgs:
        print(f"Error fetching orgs: {orgs['message']}")
        return

    for org in orgs:
        org_id = org['id']
        org_name = org['nombre']
        print(f"Org: {org_name}")
        
        chart_res = requests.get(f"{SUPABASE_URL}/rest/v1/chart_of_accounts?organization_id=eq.{org_id}&select=id,codigo", headers=headers)
        chart_map = {acc['codigo']: acc['id'] for acc in chart_res.json()}
        
        lines_res = requests.get(f"{SUPABASE_URL}/rest/v1/journal_entry_lines?organization_id=eq.{org_id}&account_id=is.null&select=id,cuenta_codigo", headers=headers)
        lines_to_fix = lines_res.json()
        
        if not lines_to_fix:
            print("  Status: OK")
            continue
            
        print(f"  Fixing {len(lines_to_fix)} lines...")
        fixed_count = 0
        for line in lines_to_fix:
            acc_id = chart_map.get(line['cuenta_codigo'])
            if acc_id:
                patch_res = requests.patch(
                    f"{SUPABASE_URL}/rest/v1/journal_entry_lines?id=eq.{line['id']}", 
                    headers=headers, 
                    json={"account_id": acc_id, "organization_id": org_id}
                )
                if patch_res.ok:
                    fixed_count += 1
        print(f"  Done: {fixed_count} fixed.")

if __name__ == "__main__":
    full_database_repair()
