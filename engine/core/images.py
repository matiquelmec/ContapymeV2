import os
import uuid
import logging
import httpx
import traceback
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

AI_IMAGE_API = "https://image.pollinations.ai/prompt" 

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """Genera imagen con FLUX (Lento pero Pro) o Turbo (Rápido) como fallback."""
    try:
        art_style = "Studio Ghibli style, soft cyberpunk, Magallanes, vibrant colors, cinematic lighting"
        full_prompt = f"{prompt}, {art_style}"
        seed = uuid.uuid4().int >> 64
        
        # Primero intentamos con FLUX (Paciencia de 120s)
        gen_url = f"{AI_IMAGE_API}/{full_prompt.replace(' ', '%20')}?width=1024&height=768&seed={seed}&model=flux&nologo=true"

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.get(gen_url)
                if response.status_code == 200 and len(response.content) > 15000:
                    url = await _upload_to_supabase(response.content, "flux")
                    if url: return url
            except httpx.ReadTimeout:
                logger.warning("[Images] Timeout en FLUX, saltando a modo TURBO...")
                # FALLBACK INMEDIATO: Modelo Turbo (mucho más rápido)
                turbo_url = f"{AI_IMAGE_API}/{full_prompt.replace(' ', '%20')}?model=turbo&seed={seed}&nologo=true"
                response = await client.get(turbo_url, timeout=30.0)
                if response.status_code == 200:
                    url = await _upload_to_supabase(response.content, "turbo")
                    if url: return url

    except Exception:
        logger.error(f"[Images] Error Crítico IA: {traceback.format_exc()}")
    return None

async def download_and_upload_image(image_url: str) -> str:
    if not image_url or not image_url.startswith("http"):
        return None
    try:
        async with httpx.AsyncClient(timeout=40.0, follow_redirects=True) as client:
            response = await client.get(image_url)
            if response.status_code == 200:
                url = await _upload_to_supabase(response.content, "proxy")
                if url: return url
    except Exception:
        logger.error(f"[Images] Error Proxy: {traceback.format_exc()}")
    return None

async def _upload_to_supabase(content: bytes, prefix: str) -> str:
    try:
        db = get_supabase()
        filename = f"{prefix}_{uuid.uuid4()}.webp"
        
        db.storage.from_("news_images").upload(
            path=filename,
            file=content,
            file_options={"content-type": "image/webp", "upsert": "true"}
        )
        
        url_obj = db.storage.from_("news_images").get_public_url(filename)
        return str(url_obj).split('?')[0]
    except Exception:
        logger.error(f"[Images] ERROR STORAGE: {traceback.format_exc()}")
        return None

async def get_category_fallback_url(category: str) -> str:
    fallbacks = {
        "SII / LEGAL": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000",
        "FINANZAS": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1000",
        "ECONOMÍA": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000",
        "MAGALLANES ACTUAL": "https://images.unsplash.com/photo-1548625361-1adaa91fa9ba?w=1000",
        "DEPORTES REGIONALES": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1000"
    }
    ext_url = fallbacks.get(category.upper(), "https://mofkjgfrpfmtnktaepqi.supabase.co/storage/v1/object/public/news_images/7de9589e-c248-46c9-891b-78e0f843d3df.webp")
    
    url = await download_and_upload_image(ext_url)
    if not url:
        return "https://mofkjgfrpfmtnktaepqi.supabase.co/storage/v1/object/public/news_images/7de9589e-c248-46c9-891b-78e0f843d3df.webp"
    return url
