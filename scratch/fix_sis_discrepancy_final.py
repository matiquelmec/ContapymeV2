import requests

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"
headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json"
}

target_entries = [
    "f14c544b-33c7-45aa-93cd-6153cc8e62e5"  # Marzo 2026
]

def fix():
    for entry_id in target_entries:
        print(f"Reparando asiento {entry_id}...")
        
        # 1. Buscar la línea de AFP
        url_select = f"https://mofkjgfrpfmtnktaepqi.supabase.co/rest/v1/journal_entry_lines?entry_id=eq.{entry_id}&cuenta_nombre=ilike.*AFP*&tipo=eq.haber"
        res = requests.get(url_select, headers=headers)
        lines = res.json()
        
        if lines:
            line = lines[0]
            nuevo_monto = line['monto'] + 37389
            print(f"   Actualizando {line['cuenta_nombre']}: {line['monto']} -> {nuevo_monto}")
            
            # 2. Patch
            url_patch = f"https://mofkjgfrpfmtnktaepqi.supabase.co/rest/v1/journal_entry_lines?id=eq.{line['id']}"
            res_patch = requests.patch(url_patch, headers=headers, json={"monto": nuevo_monto})
            if res_patch.status_code in [200, 204]:
                print(f"   Success")
            else:
                print(f"   Error: {res_patch.text}")
        else:
            print(f"   No se encontró línea de AFP")

if __name__ == "__main__":
    fix()
