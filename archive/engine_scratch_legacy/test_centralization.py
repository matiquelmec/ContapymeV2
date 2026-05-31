import asyncio
import os
import re
import psycopg2
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

# Agregar la ruta del engine al path de python
import sys
sys.path.append(r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine")

from core.dte.dte_centralizer import centralize_dte_accounting

async def run_test():
    # ID del DTE Folio 1 que enviamos y actualizamos a 'sent'
    dte_id = "b568fc8a-dfce-49af-8ac3-06bbc01b75fa"
    org_id = "be168b8e-8906-49e5-86e1-6a75919024ba"
    
    db = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    
    # 1. Asegurar que esté en estado 'sent'
    print(f"--- 1. Preparando DTE {dte_id} en la BD ---")
    db.table("dte_issued").update({"status": "sent"}).eq("id", dte_id).execute()
    print("DTE estado establecido a 'sent'.")
    
    # Eliminar cualquier asiento anterior para esta prueba
    db.table("journal_entries").delete().eq("organization_id", org_id).eq("source_type", "dte_issued").eq("source_id", dte_id).execute()
    print("Asientos previos de prueba eliminados.")

    # 2. Ejecutar centralización
    print(f"\n--- 2. Ejecutando centralize_dte_accounting por primera vez ---")
    res = await centralize_dte_accounting(dte_id, org_id)
    print(f"Resultado: {res}")
    
    # 3. Consultar asiento y líneas en la BD
    if res.get("status") == "centralized":
        je_id = res["journal_entry_id"]
        print(f"\n--- 3. Verificando Asiento Creado (ID: {je_id}) ---")
        
        je_res = db.table("journal_entries").select("*").eq("id", je_id).single().execute()
        je = je_res.data
        print(f"Asiento:")
        print(f"  - Fecha:            {je['fecha']}")
        print(f"  - Glosa:            {je['glosa']}")
        print(f"  - Número Asiento:   {je['numero_asiento']}")
        print(f"  - Tipo Comprobante: {je['tipo_comprobante']}")
        print(f"  - Source Type:      {je['source_type']}")
        print(f"  - Source ID:        {je['source_id']}")
        
        lines_res = db.table("journal_entry_lines").select("*").eq("entry_id", je_id).execute()
        lines = lines_res.data
        print(f"\nLíneas del Asiento:")
        debe_sum = 0
        haber_sum = 0
        for line in lines:
            tipo = line['tipo'].lower()
            monto = int(line['monto'])
            print(f"  * [{tipo.upper()}] Cuenta: {line['cuenta_codigo']} ({line['cuenta_nombre']}) | Monto: ${monto}")
            if tipo == "debe":
                debe_sum += monto
            else:
                haber_sum += monto
                
        print(f"\nResumen:")
        print(f"  - Total DEBE:  ${debe_sum}")
        print(f"  - Total HABER: ${haber_sum}")
        if debe_sum == haber_sum:
            print("  SUCCESS: BALANCE CORRECTO! (Debe == Haber)")
        else:
            print("  ERROR: DESBALANCE EN EL ASIENTO CONTABLE!")
            
    # 4. Probar idempotencia
    print(f"\n--- 4. Probando Idempotencia (ejecución duplicada) ---")
    res_dup = await centralize_dte_accounting(dte_id, org_id)
    print(f"Resultado ejecución duplicada: {res_dup}")
    if res_dup.get("status") == "already_centralized":
        print("  SUCCESS: IDEMPOTENCIA CORRECTA! (Evita duplicados)")
    else:
        print("  ERROR: FALLO DE IDEMPOTENCIA!")

if __name__ == "__main__":
    asyncio.run(run_test())
