import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Error: Faltan variables de entorno")
    exit(1)

supabase: Client = create_client(url, key)

def audit_and_clean():
    print("🔎 Auditando registros de importación RCV...")
    
    # 1. Buscar registros que no tienen documentos procesados (posibles fallos previos)
    res = supabase.table("rcv_imports").select("*").eq("total_docs", 0).execute()
    
    if res.data:
        print(f"⚠️ Se encontraron {len(res.data)} registros 'fantasma' (intentos fallidos).")
        for item in res.data:
            print(f"   - Eliminando intento fallido: {item['file_name']} periodo {item['periodo']}")
            supabase.table("rcv_imports").delete().eq("id", item["id"]).execute()
        print("✅ Limpieza completada.")
    else:
        print("✅ No se detectaron registros fantasma obvios.")

    # 2. Mostrar resumen actual
    res = supabase.table("rcv_imports").select("periodo, tipo, file_name, total_docs").order("periodo").execute()
    if res.data:
        print("\n📊 Estado Actual de Cargas en DB:")
        for r in res.data:
            status = "EXITOSA" if r["total_docs"] > 0 else "FALLIDA"
            print(f"   [{r['tipo'].upper()}] {r['periodo']} -> {r['file_name']} ({r['total_docs']} docs) | {status}")

if __name__ == "__main__":
    audit_and_clean()
