import requests
import json

URL = "https://mofkjgfrpfmtnktaepqi.supabase.co/rest/v1/liquidations"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZmtqZ2ZycGZtdG5rdGFlcHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMzg3MSwiZXhwIjoyMDg5MTA5ODcxfQ.4Dt6aFWe-0aDpY2LpeTC-CRkh2nh7YHFAGSr-M7uBvI"

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Range": "0-0"
}

def inspect():
    params = {
        "periodo": "eq.2026-03-01",
        "select": "total_haberes_brutos,salud_total,sueldo_liquido,afp,afp_comision,impuesto_unico,afc_trabajador,sis_empresa,afc_empresa,asignacion_familiar"
    }
    
    response = requests.get(URL, headers=headers, params=params)
    data = response.json()
    
    if not data:
        print("No se encontró liquidación para ese periodo.")
        return

    row = data[0]
    print("--- INSPECCIONANDO LIQUIDACION MARZO 2026 (REST) ---")
    print(f"Total Haberes Brutos: {row['total_haberes_brutos']}")
    print(f"Salud Total (H):      {row['salud_total']}")
    print(f"AFP + Comis (H):      {row['afp'] + row['afp_comision']}")
    print(f"AFC Trab (H):         {row['afc_trabajador']}")
    print(f"Impuesto (H):         {row['impuesto_unico']}")
    print(f"Líquido (H):          {row['sueldo_liquido']}")
    print(f"Asig Familiar (H?):   {row['asignacion_familiar']}")
    
    sum_haber = (row['salud_total'] + row['afp'] + row['afp_comision'] + 
                 row['afc_trabajador'] + row['impuesto_unico'] + row['sueldo_liquido'])
    
    print(f"Suma Haber (sin AsigFam): {sum_haber}")
    print(f"Diferencia (Bruto - SumHaber): {row['total_haberes_brutos'] - sum_haber}")
    
    print("\n--- CARGOS EMPRESA ---")
    print(f"SIS Empresa: {row['sis_empresa']}")
    print(f"AFC Empresa: {row['afc_empresa']}")

if __name__ == "__main__":
    inspect()
