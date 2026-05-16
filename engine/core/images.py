import os
import uuid
import logging
import httpx
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

# Modelo FLUX: Lo último en IA (Calidad tipo Midjourney/DALL-E 3)
# Es gratuito a través de este endpoint
AI_IMAGE_API = "https://image.pollinations.ai/prompt" 

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """
    Genera una imagen con el modelo FLUX (Ultra Calidad) y la guarda en Supabase.
    """
    try:
        # Prompt optimizado para FLUX y el estilo regional
        # Inyectamos el estilo "Ghibli/Cyberpunk" directamente aquí
        art_style = "Studio Ghibli aesthetic, soft cyberpunk, cinematic lighting, highly detailed digital painting, vibrant colors"
        full_prompt = f"{prompt}, {art_style}"
        
        # Parámetros FLUX: model=flux garantiza la máxima calidad actual
        seed = uuid.uuid4().int >> 64
        image_url = (
            f"{AI_IMAGE_API}/{full_prompt.replace(' ', '%20')}"
            f"?width=1024&height=768&seed={seed}&model=flux&nologo=true"
        )

        logger.info(f"[Images] 🚀 Generando con FLUX: {prompt[:50]}...")

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            response = await client.get(image_url)
            
            if response.status_code == 200 and len(response.content) > 10000:
                image_data = response.content
                
                db = get_supabase()
                filename = f"flux_{uuid.uuid4()}.png"
                
                db.storage.from_("news_images").upload(
                    path=filename,
                    file=image_data,
                    file_options={"content-type": "image/png", "upsert": "true"}
                )
                
                public_url = db.storage.from_("news_images").get_public_url(filename)
                logger.info(f"[Images] ✅ Imagen FLUX lista: {public_url}")
                return public_url
            else:
                logger.error(f"[Images] Fallo FLUX: {response.status_code} (Size: {len(response.content)})")
                return None

    except Exception as e:
        logger.error(f"[Images] ❌ Error crítico FLUX: {e}")
        return None

async def download_and_upload_image(image_url: str, news_id: str = None) -> str:
    """Fallback: Imagen original del RSS."""
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(image_url)
            if response.status_code == 200:
                db = get_supabase()
                filename = f"rss_{uuid.uuid4()}.jpg"
                db.storage.from_("news_images").upload(path=filename, file=response.content)
                return db.storage.from_("news_images").get_public_url(filename)
    except:
        pass
    return image_url

def get_category_fallback(category: str) -> str:
    fallbacks = {
        "SII / LEGAL": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000",
        "FINANZAS": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000",
        "ECONOMÍA": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000",
        "MAGALLANES ACTUAL": "https://images.unsplash.com/photo-1548625361-1adaa91fa9ba?auto=format&fit=crop&w=1000"
    }
    return fallbacks.get(category.upper(), "https://images.unsplash.com/photo-1504711434969-e33886168d5c?auto=format&fit=crop&w=1000")
