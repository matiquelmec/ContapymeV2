import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "engine"))
load_dotenv(ROOT / ".env")

from core.brand_scrapper import fetch_brand_logo_url
from core.images import download_and_upload_image

async def run_test():
    print("Iniciando prueba de scraping de marca y subida a Supabase...")
    brand_name = "H&M"
    
    # 1. Obtener la URL del logo de Clearbit
    logo_url = await fetch_brand_logo_url(brand_name)
    print(f"URL de logo resuelta: {logo_url}")
    
    if not logo_url:
        print("Fallo al resolver la URL del logo.")
        return
        
    # 2. Descargar y subir a Supabase
    uploaded_url = await download_and_upload_image(logo_url)
    if uploaded_url:
        print(f"EXITO! El logotipo de {brand_name} fue descargado y subido correctamente.")
        print(f"URL en Supabase Storage: {uploaded_url}")
    else:
        print("Fallo al descargar o subir la imagen a Supabase.")

if __name__ == "__main__":
    asyncio.run(run_test())
