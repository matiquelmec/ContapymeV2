import os
from dotenv import load_dotenv
from supabase import create_client

# Cargar variables de entorno del archivo .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Credenciales de Supabase no encontradas en el archivo .env")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def audit_news():
    print("--- AUDITORIA DE NOTICIAS RECIENTES ---")
    print("Tabla: regional_news\n")
    try:
        res = supabase.table("regional_news").select("id, title, published_at, created_at").order("created_at", desc=True).limit(5).execute()
        
        if not res.data:
            print("ERROR: La base de datos esta vacia o no hay registros recientes.")
            return
            
        for row in res.data:
            print(f"Titulo: {row['title'][:60]}...")
            print(f"Fecha en BD (created_at): {row['created_at']}")
            print(f"Fecha Original (published_at): {row['published_at']}")
            print("-" * 50)
            
    except Exception as e:
        print(f"ERROR al conectar o consultar Supabase: {e}")

if __name__ == "__main__":
    audit_news()
