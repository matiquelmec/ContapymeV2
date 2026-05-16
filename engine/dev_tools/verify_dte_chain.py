import asyncio
from core.database import get_supabase

async def verify_chain():
    supabase = get_supabase()
    org_id = "2e9f634b-4087-448c-bfa6-244bfa1eec61"
    
    # Obtener documentos ordenados por folio
    res = supabase.table("dte_issued")\
        .select("folio, integrity_hash, previous_hash")\
        .eq("organization_id", org_id)\
        .eq("tipo_dte", 33)\
        .order("folio")\
        .execute()
        
    print("--- VERIFICACIÓN DE CADENA DE HASHES ---")
    prev_calculated = "ORIGIN"
    for dte in res.data:
        print(f"Folio: {dte['folio']}")
        print(f"  Previous Hash (DB): {dte['previous_hash'][:20]}...")
        print(f"  Integrity Hash (DB): {dte['integrity_hash'][:20]}...")
        if dte['previous_hash'] == prev_calculated:
            print("  [OK] Enlace verificado.")
        else:
            print(f"  [ERROR] Ruptura en la cadena! Esperado: {prev_calculated[:20]}...")
        prev_calculated = dte['integrity_hash']

if __name__ == "__main__":
    asyncio.run(verify_chain())
