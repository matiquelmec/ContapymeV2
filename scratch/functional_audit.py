import requests
import json

SUPABASE_URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"

def audit_functional_integrity(organization_id):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"--- AUDITORIA DE FUNCIONALIDAD: {organization_id} ---")
    
    res = requests.get(f"{SUPABASE_URL}/rest/v1/journal_entry_lines?organization_id=eq.{organization_id}&account_id=is.null&select=id,entry_id,cuenta_codigo,monto,tipo", headers=headers)
    huerfanas = res.json()
    
    if huerfanas:
        print(f"Found {len(huerfanas)} orphaned lines (no account_id).")
        for h in huerfanas:
            print(f"  - Line: {h['id']} | Entry: {h['entry_id']} | Code: {h['cuenta_codigo']} | Amount: {h['monto']} ({h['tipo']})")
    else:
        print("  Status: All lines have accounts.")

    res_lines = requests.get(f"{SUPABASE_URL}/rest/v1/journal_entry_lines?organization_id=eq.{organization_id}&select=entry_id,tipo,monto", headers=headers)
    all_lines = res_lines.json()
    
    entries = {}
    for l in all_lines:
        eid = l['entry_id']
        if eid not in entries: entries[eid] = 0.0
        val = float(l['monto'])
        if l['tipo'] == 'debe': entries[eid] += val
        else: entries[eid] -= val
        
    unbalanced = {k: v for k, v in entries.items() if abs(v) > 0.01}
    
    if unbalanced:
        print(f"Found {len(unbalanced)} unbalanced entries (Debts != Credits).")
        for eid, diff in unbalanced.items():
            res_entry = requests.get(f"{SUPABASE_URL}/rest/v1/journal_entries?id=eq.{eid}&select=glosa,fecha", headers=headers)
            e_info = res_entry.json()[0] if res_entry.json() else {"glosa": "Unknown", "fecha": "S/N"}
            print(f"  - Entry {eid} | Date: {e_info['fecha']} | Diff: ${diff:.2f} | Info: {e_info['glosa']}")
    else:
        print("  Status: All entries are balanced.")

if __name__ == "__main__":
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    orgs = requests.get(f"{SUPABASE_URL}/rest/v1/organizations?select=id,nombre", headers=headers).json()
    if orgs:
        for o in orgs:
            audit_functional_integrity(o['id'])
