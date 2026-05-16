import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fix_and_clean():
    print("Iniciando mantenimiento de emergencia...")
    
    # 1. Borrar noticias de las últimas 3 horas
    try:
        # Usamos una fecha ISO para evitar problemas con now() - interval
        from datetime import datetime, timedelta
        three_hours_ago = (datetime.utcnow() - timedelta(hours=3)).isoformat()
        
        res = supabase.table("regional_news").delete().gt("created_at", three_hours_ago).execute()
        print(f"Noticias recientes eliminadas. Cantidad: {len(res.data) if res.data else 0}")
    except Exception as e:
        print(f"Error borrando noticias: {e}")

    # 2. Asegurar bucket publico
    try:
        # Intentamos crear el bucket por si no existe
        try:
            supabase.storage.create_bucket('news_images', options={'public': True})
            print("Bucket 'news_images' creado como PUBLICO.")
        except:
            # Si ya existe, intentamos forzar que sea publico (aunque la API de storage3 es limitada aqui)
            print("El bucket 'news_images' ya existe. Verifica manualmente en el panel de Supabase que sea PUBLICO.")
    except Exception as e:
        print(f"Error en Storage: {e}")

if __name__ == "__main__":
    fix_and_clean()
