import requests
import json
from datetime import datetime

SUPABASE_URL = "https://mofkjgfrpfmtnktaepqi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"
ORG_ID = "2e9f634b-4087-448c-bfa6-244bfa1eec61" # Contapymepuq
YEAR = 2024

def run_audit():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"--- INICIANDO AUDITORÍA FINANCIERA: {ORG_ID} ({YEAR}) ---")
    
    # 1. Obtener Plan de Cuentas (Mapa Código -> Tipo)
    print("Fetching Chart of Accounts...")
    chart_url = f"{SUPABASE_URL}/rest/v1/chart_of_accounts?organization_id=eq.{ORG_ID}&select=codigo,tipo,naturaleza,acepta_movimiento"
    chart_res = requests.get(chart_url, headers=headers)
    chart_data = chart_res.json()
    account_map = {acc['codigo']: acc for acc in chart_data}
    
    # 2. Obtener Líneas de Diario
    # Nota: No filtramos por año aquí para simplificar, o podemos filtrar por fecha si la tabla tiene fecha.
    # Pero journal_entry_lines NO tiene fecha, journal_entries SÍ.
    # Necesitamos el JOIN o filtrar journal_entries primero.
    
    print("Fetching Journal Entries for year...")
    entries_url = f"{SUPABASE_URL}/rest/v1/journal_entries?organization_id=eq.{ORG_ID}&fecha=gte.{YEAR}-01-01&fecha=lte.{YEAR}-12-31&select=id"
    entries_res = requests.get(entries_url, headers=headers)
    entry_ids = [e['id'] for e in entries_res.json()]
    
    if not entry_ids:
        print("No se encontraron asientos para este periodo.")
        return

    print(f"Found {len(entry_ids)} entries. Fetching lines...")
    
    # Fetch lines in batches if needed, but for now we'll try all
    lines_url = f"{SUPABASE_URL}/rest/v1/journal_entry_lines?entry_id=in.({','.join(entry_ids)})&select=cuenta_codigo,tipo,monto"
    lines_res = requests.get(lines_url, headers=headers)
    lines_data = lines_res.json()
    
    # 3. Cálculo Manual (Fase de Auditoría)
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
            print(f"ALERTA: Cuenta {code} no encontrada en el Plan de Cuentas.")
            continue
            
        tipo_cuenta = acc_info['tipo']
        naturaleza = acc_info['naturaleza']
        tipo_mov = line['tipo'] # 'debe' o 'haber'
        
        # Lógica de Saldo Real:
        # Activo/Gasto: Debe (+) Haber (-)
        # Pasivo/Patrimonio/Ingreso: Haber (+) Debe (-)
        
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
        print("ERROR: Se detectaron inconsistencias entre el motor de reportes y las transacciones base.")

if __name__ == "__main__":
    run_audit()
