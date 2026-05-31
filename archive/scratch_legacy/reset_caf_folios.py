import os
from dotenv import load_dotenv
from supabase import create_client

env_path = r"c:\Users\Matías Riquelme\Desktop\Proyectos documentados\Contapymepuq\engine\.env"
load_dotenv(env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
db = create_client(url, key)

ORG_ID = "be168b8e-8906-49e5-86e1-6a75919024ba"

def reset_caf_folios():
    print(f"=== Reiniciando folios consumidos para la organización {ORG_ID} ===")
    
    # 1. Boletas (tipo 39): Ajustar last_used_folio a 0 para que la siguiente sea el folio 1 (o al folio anterior si quieres mantener una correlación).
    # Como borramos todas las boletas de la BD, queremos que parta en Folio 1.
    # Así que el last_used_folio debe quedar en 0.
    try:
        # Actualizamos el CAF de boletas (rango 1-1000)
        res_39 = db.table("dte_caf_folios")\
            .update({"last_used_folio": 0})\
            .eq("organization_id", ORG_ID)\
            .eq("tipo_dte", 39)\
            .eq("range_start", 1)\
            .execute()
            
        if res_39.data:
            print("[OK] CAF Boletas (Tipo 39, 1-1000) reiniciado. Siguiente folio será el 1.")
        else:
            print("[WARN] No se encontró el CAF de Boletas Tipo 39 (1-1000) para reiniciar.")
            
        # 2. Facturas (tipo 33): Tenías emitidos los folios hasta el 3 (usando el CAF de rango 1-5).
        # Para reiniciar a folio 1 en facturas para este rango:
        res_33_1 = db.table("dte_caf_folios")\
            .update({"last_used_folio": 0})\
            .eq("organization_id", ORG_ID)\
            .eq("tipo_dte", 33)\
            .eq("range_start", 1)\
            .execute()
            
        if res_33_1.data:
            print("[OK] CAF Facturas (Tipo 33, 1-5) reiniciado. Siguiente folio será el 1.")
            
        # También el otro CAF de facturas (53-56) que estaba en 53, lo dejamos en 52 por si se usa:
        res_33_2 = db.table("dte_caf_folios")\
            .update({"last_used_folio": 52})\
            .eq("organization_id", ORG_ID)\
            .eq("tipo_dte", 33)\
            .eq("range_start", 53)\
            .execute()
            
        if res_33_2.data:
            print("[OK] CAF Facturas (Tipo 33, 53-56) restablecido. Siguiente folio será el 53.")
            
    except Exception as e:
        print("Error al reiniciar los folios de CAF:", e)

if __name__ == "__main__":
    reset_caf_folios()
