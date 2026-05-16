import os
import uuid
import logging
import httpx
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

AI_IMAGE_API = "https://image.pollinations.ai/prompt" 

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """Genera imagen con FLUX y asegura persistencia real en Supabase."""
    try:
        art_style = "Studio Ghibli aesthetic, soft cyberpunk, cinematic lighting, vibrant colors, masterpiece"
        full_prompt = f"{prompt}, {art_style}"
        seed = uuid.uuid4().int >> 64
        
        # URL de generación
        gen_url = f"{AI_IMAGE_API}/{full_prompt.replace(' ', '%20')}?width=1024&height=768&seed={seed}&model=flux&nologo=true"

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(gen_url)
            if response.status_code == 200 and len(response.content) > 15000:
                db = get_supabase()
                filename = f"flux_{uuid.uuid4()}.png"
                
                # Intentar subida
                res = db.storage.from_("news_images").upload(
                    path=filename,
                    file=response.content,
                    file_options={"content-type": "image/png", "upsert": "true"}
                )
                
                # VERIFICACIÓN: Si la respuesta de supabase tiene error, no retornamos esta URL
                if hasattr(res, 'error') and res.error:
                    logger.error(f"[Images] Error subiendo a Supabase: {res.error}")
                    return None
                
                public_url = db.storage.from_("news_images").get_public_url(filename).split('?')[0]
                return public_url
    except Exception as e:
        logger.error(f"[Images] Error en generación: {e}")
    return None

async def download_and_upload_image(image_url: str) -> str:
    """Descarga imagen y la guarda. Si falla, devuelve la URL original para no perderla."""
    try:
        if not image_url or not image_url.startswith("http"):
            return None
            
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(image_url)
            if response.status_code == 200 and len(response.content) > 5000:
                db = get_supabase()
                filename = f"rss_{uuid.uuid4()}.jpg"
                db.storage.from_("news_images").upload(path=filename, file=response.content)
                return db.storage.from_("news_images").get_public_url(filename).split('?')[0]
    except:
        pass
    return image_url # Devolver original si el storage falla

def get_category_fallback(category: str) -> str:
    """URLs de Unsplash garantizadas."""
    fallbacks = {
        "SII / LEGAL": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1000&auto=format&fit=crop",
        "FINANZAS": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1000&auto=format&fit=crop",
        "ECONOMÍA": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop",
        "MAGALLANES ACTUAL": "https://images.unsplash.com/photo-1548625361-1adaa91fa9ba?q=80&w=1000&auto=format&fit=crop",
        "DEPORTES REGIONALES": "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000&auto=format&fit=crop"
    }
    # Backup absoluto si la categoría no existe o falla
    return fallbacks.get(category.upper(), "https://images.unsplash.com/photo-1504711434969-e33886168d5c?q=80&w=1000&auto=format&fit=crop")
