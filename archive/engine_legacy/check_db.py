import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_images():
    print("--- Auditoría de Imágenes Recientes ---")
    res = supabase.table("regional_news").select("title, image_url, category").order("created_at", desc=True).limit(10).execute()
    
    for row in res.data:
        status = "OK" if row['image_url'] and row['image_url'].startswith("http") else "ERROR (VACÍO O INVÁLIDO)"
        print(f"Título: {row['title'][:40]}...")
        print(f"URL: {row['image_url']}")
        print(f"Estado: {status}")
        print("-" * 30)

if __name__ == "__main__":
    check_images()
