import requests
import json
from datetime import datetime

SUPABASE_URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"
ORG_ID = "f8758d56-0675-41e4-bc31-e3013052292a" # Logística Patagonia SpA
YEAR = 2026

def run_audit():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"--- INICIANDO AUDITORÍA FINANCIERA: {ORG_ID} ({YEAR}) ---")
    
    # 1. Obtener Plan de Cuentas
    print("Fetching Chart of Accounts...")
    chart_url = f"{SUPABASE_URL}/rest/v1/chart_of_accounts?organization_id=eq.{ORG_ID}&select=codigo,tipo,naturaleza,acepta_movimiento"
    chart_res = requests.get(chart_url, headers=headers)
    chart_data = chart_res.json()
    account_map = {acc['codigo']: acc for acc in chart_data}
    
    # 2. Obtener Líneas de Diario
    print("Fetching Journal Entries for year...")
    entries_url = f"{SUPABASE_URL}/rest/v1/journal_entries?organization_id=eq.{ORG_ID}&fecha=gte.{YEAR}-01-01&fecha=lte.{YEAR}-12-31&select=id"
    entries_res = requests.get(entries_url, headers=headers)
    entry_ids = [e['id'] for e in entries_res.json()]
    
    if not entry_ids:
        print("No se encontraron asientos para este periodo.")
        return

    print(f"Found {len(entry_ids)} entries. Fetching lines...")
    
    # Batch processing for line IDs
    lines_data = []
    batch_size = 50
    for i in range(0, len(entry_ids), batch_size):
        batch_ids = entry_ids[i:i+batch_size]
        ids_str = ",".join(batch_ids)
        lines_url = f"{SUPABASE_URL}/rest/v1/journal_entry_lines?entry_id=in.({ids_str})&select=cuenta_codigo,tipo,monto"
        lines_res = requests.get(lines_url, headers=headers)
        lines_data.extend(lines_res.json())
    
    # 3. Cálculo Manual
    totals = {
        "ingreso": 0,
        "gasto": 0,
        "activo": 0,
        "pasivo": 0,
        "patrimonio": 0
    }
    
    for line in lines_data:
        code = line['cuenta_codigo']
        monto = float(line['monto'] or 0)
        acc_info = account_map.get(code)
        
        if not acc_info:
            continue
            
        tipo_cuenta = acc_info['tipo']
        tipo_mov = line['tipo']
        
        if tipo_cuenta in ['activo', 'gasto']:
            val = monto if tipo_mov == 'debe' else -monto
        else:
            val = monto if tipo_mov == 'haber' else -monto
            
        if tipo_cuenta in totals:
            totals[tipo_cuenta] += val
            
    print("\n--- RESULTADOS CÁLCULO MANUAL (JOURNAL LINES) ---")
    for k, v in totals.items():
        print(f"{k.upper()}: ${v:,.0f}")
        
    # 4. Obtener Datos de Inteligencia (RPC)
    print("\nFetching Intelligence Data (RPC)...")
    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/rpc_get_recursive_trial_balance"
    rpc_payload = {
        "p_organization_id": ORG_ID,
        "p_end_date": f"{YEAR}-12-31"
    }
    rpc_res = requests.post(rpc_url, headers=headers, json=rpc_payload)
    rpc_data = rpc_res.json()
    
    rpc_totals = {
        "ingreso": 0,
        "gasto": 0,
        "activo": 0,
        "pasivo": 0,
        "patrimonio": 0
    }
    
    for item in rpc_data:
        if item.get('acepta_movimiento'):
            t = item.get('tipo')
            if t in rpc_totals:
                rpc_totals[t] += float(item.get('saldo', 0))
                
    print("--- RESULTADOS MOTOR INTELIGENCIA (RPC) ---")
    for k, v in rpc_totals.items():
        print(f"{k.upper()}: ${v:,.0f}")
        
    # 5. Comparación Final
    print("\n--- AUDITORÍA DE DISCREPANCIAS ---")
    match = True
    for k in totals:
        diff = totals[k] - rpc_totals[k]
        if abs(diff) > 0.01:
            print(f"DISCREPANCIA en {k.upper()}: Diff = ${diff:,.2f}")
            match = False
            
    if match:
        print("ÉXITO: Los datos de Inteligencia Financiera son 100% consistentes con el Libro Diario.")
    else:
        print("ALERTA: Se detectaron inconsistencias.")

if __name__ == "__main__":
    run_audit()
