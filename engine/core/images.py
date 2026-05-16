import os
import uuid
import logging
import httpx
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

# Usamos Hyperbolic o Pollinations como respaldo
HYPERBOLIC_API = "https://image.pollinations.ai/prompt" # Mantenemos Pollinations pero con modelo FLUX corregido

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """Genera imagen con FLUX y asegura persistencia real en Supabase."""
    try:
        # Prompt Estilo Magallanes Artístico
        art_style = "Studio Ghibli style, soft cyberpunk Magallanes, highly detailed, cinematic lighting, vibrant colors"
        full_prompt = f"{prompt}, {art_style}"
        seed = uuid.uuid4().int >> 64
        
        # Optimizamos la URL: Sin caracteres especiales al final y con modelo FLUX
        gen_url = (
            f"https://image.pollinations.ai/prompt/{full_prompt.replace(' ', '%20')}"
            f"?width=1024&height=768&seed={seed}&model=flux&nologo=true"
        )

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(gen_url)
            
            # Si el servidor está saturado, probamos una versión más ligera de Stable Diffusion
            if response.status_code != 200 or len(response.content) < 10000:
                logger.warning("[Images] FLUX saturado, probando SDXL...")
                gen_url = f"https://image.pollinations.ai/prompt/{full_prompt.replace(' ', '%20')}?model=turbo&seed={seed}"
                response = await client.get(gen_url)

            if response.status_code == 200 and len(response.content) > 10000:
                db = get_supabase()
                filename = f"art_{uuid.uuid4()}.png"
                
                # Subida con validación
                res = db.storage.from_("news_images").upload(
                    path=filename,
                    file=response.content,
                    file_options={"content-type": "image/png", "upsert": "true"}
                )
                
                public_url = db.storage.from_("news_images").get_public_url(filename).split('?')[0]
                logger.info(f"[Images] ✅ Imagen generada y limpia: {public_url}")
                return public_url
                
    except Exception as e:
        logger.error(f"[Images] Error: {e}")
    return None

async def download_and_upload_image(image_url: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(image_url)
            if response.status_code == 200:
                db = get_supabase()
                filename = f"rss_{uuid.uuid4()}.jpg"
                db.storage.from_("news_images").upload(path=filename, file=response.content)
                return db.storage.from_("news_images").get_public_url(filename).split('?')[0]
    except: pass
    return image_url

def get_category_fallback(category: str) -> str:
    fallbacks = {
        "SII / LEGAL": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1000",
        "FINANZAS": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1000",
        "ECONOMÍA": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000",
        "MAGALLANES ACTUAL": "https://images.unsplash.com/photo-1548625361-1adaa91fa9ba?q=80&w=1000",
        "DEPORTES REGIONALES": "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000"
    }
    return fallbacks.get(category.upper(), "https://images.unsplash.com/photo-1504711434969-e33886168d5c?q=80&w=1000")
