import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "engine"))
load_dotenv(ROOT / ".env")

from core.database import get_supabase
from core.images import generate_and_upload_image

async def main():
    print("Iniciando actualizacion de la imagen de H&M...")
    db = get_supabase()
    
    # 1. Buscar la noticia de H&M
    res = db.table("regional_news").select("id, title").ilike("title", "%H&M%").execute()
    if not res.data:
        res = db.table("regional_news").select("id, title").ilike("title", "%H M%").execute()
    
    if not res.data:
        print("No se encontro la noticia de H&M en la base de datos.")
        return
        
    article = res.data[0]
    article_id = article["id"]
    title = article["title"]
    print(f"Noticia encontrada: ID={article_id}, Titulo='{title}'")
    
    new_image_url = "https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg"
    print(f"Asignando URL de Wikimedia SVG: {new_image_url}")
        
    print(f"Nueva imagen generada con exito: {new_image_url}")
    
    # 3. Actualizar la base de datos
    update_res = db.table("regional_news").update({"image_url": new_image_url}).eq("id", article_id).execute()
    if update_res.data:
        print("Base de datos actualizada con exito!")
        print(f"Ver noticia en: http://localhost:3000/noticias/{update_res.data[0]['slug']}")
    else:
        print("Fallo al actualizar el registro en la base de datos.")

if __name__ == "__main__":
    asyncio.run(main())
