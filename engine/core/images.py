import os
import uuid
import logging
import httpx
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

AI_IMAGE_API = "https://image.pollinations.ai/prompt" 

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """Genera imagen y la sube a Supabase (Dominio Seguro)."""
    try:
        art_style = "Studio Ghibli aesthetic, soft cyberpunk, Magallanes, vibrant colors, masterpiece"
        full_prompt = f"{prompt}, {art_style}"
        seed = uuid.uuid4().int >> 64
        
        gen_url = f"{AI_IMAGE_API}/{full_prompt.replace(' ', '%20')}?width=1024&height=768&seed={seed}&model=flux&nologo=true"

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(gen_url)
            if response.status_code == 200 and len(response.content) > 10000:
                return await _upload_to_supabase(response.content, "flux")
    except Exception as e:
        logger.error(f"[Images] Fallo IA: {e}")
    return None

async def download_and_upload_image(image_url: str) -> str:
    """Descarga cualquier imagen externa y la sube a Supabase para evitar bloqueos de CORS/NextJS."""
    if not image_url or not image_url.startswith("http"):
        return None
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(image_url)
            if response.status_code == 200:
                return await _upload_to_supabase(response.content, "proxy")
    except Exception as e:
        logger.error(f"[Images] Fallo Proxy: {e}")
    return None

async def _upload_to_supabase(content: bytes, prefix: str) -> str:
    """Helper para centralizar todas las imágenes en el dominio permitido."""
    try:
        db = get_supabase()
        filename = f"{prefix}_{uuid.uuid4()}.webp" # Usamos webp para ligereza
        
        db.storage.from_("news_images").upload(
            path=filename,
            file=content,
            file_options={"content-type": "image/webp", "upsert": "true"}
        )
        
        url = db.storage.from_("news_images").get_public_url(filename)
        return url.split('?')[0] # Limpieza total de URL
    except Exception as e:
        logger.error(f"[Images] Error Storage: {e}")
        return None

async def get_category_fallback_url(category: str) -> str:
    """Obtiene una imagen de stock pero la sube a Supabase para que sea visible."""
    fallbacks = {
        "SII / LEGAL": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000",
        "FINANZAS": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1000",
        "ECONOMÍA": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000",
        "MAGALLANES ACTUAL": "https://images.unsplash.com/photo-1548625361-1adaa91fa9ba?w=1000"
    }
    external_url = fallbacks.get(category.upper(), "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=1000")
    # CRÍTICO: La descargamos y subimos a NUESTRO dominio para que no salga negra
    return await download_and_upload_image(external_url)
