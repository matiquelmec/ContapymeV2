import os
import uuid
import logging
import httpx
import traceback
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

AI_IMAGE_API = "https://image.pollinations.ai/prompt" 

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """Genera imagen con FLUX o Turbo."""
    try:
        # Prompt más robusto y corto para evitar timeouts
        art_style = "Studio Ghibli aesthetic, anime style, soft cyberpunk, Magallanes"
        full_prompt = f"{prompt}, {art_style}"
        seed = uuid.uuid4().int >> 64
        
        # Intentamos FLUX con un timeout generoso
        gen_url = f"{AI_IMAGE_API}/{full_prompt.replace(' ', '%20')}?width=1024&height=768&seed={seed}&model=flux&nologo=true"

        async with httpx.AsyncClient(timeout=90.0) as client:
            try:
                response = await client.get(gen_url)
                if response.status_code == 200 and len(response.content) > 20000:
                    return await _upload_to_supabase(response.content, "flux")
            except:
                logger.warning("[Images] FLUX falló, intentando motor alternativo Turbo...")
                turbo_url = f"{AI_IMAGE_API}/{full_prompt.replace(' ', '%20')}?model=turbo&seed={seed}&nologo=true"
                response = await client.get(turbo_url, timeout=30.0)
                if response.status_code == 200:
                    return await _upload_to_supabase(response.content, "turbo")

    except Exception:
        logger.error(f"[Images] Error IA: {traceback.format_exc()}")
    return None

async def download_and_upload_image(image_url: str) -> str:
    if not image_url or not image_url.startswith("http"):
        return None
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(image_url)
            if response.status_code == 200:
                return await _upload_to_supabase(response.content, "stock")
    except: pass
    return None

async def _upload_to_supabase(content: bytes, prefix: str) -> str:
    try:
        db = get_supabase()
        filename = f"{prefix}_{uuid.uuid4()}.webp"
        db.storage.from_("news_images").upload(path=filename, file=content, file_options={"content-type": "image/webp"})
        url_obj = db.storage.from_("news_images").get_public_url(filename)
        return str(url_obj).split('?')[0]
    except: return None

async def get_category_fallback_url(category: str) -> str:
    """Fallbacks ARTÍSTICOS. Si la IA falla, usamos pinturas, no fotos."""
    # URLs de ilustraciones tipo anime/paisaje que encajan con el estilo
    fallbacks = {
        "SII / LEGAL": "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1000&q=80", # Ilustración justicia
        "FINANZAS": "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1000&q=80", # Gráficos abstractos neón
        "ECONOMÍA": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1000&q=80", # Ciudad futurista
        "MAGALLANES ACTUAL": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&q=80", # Paisaje épico patagonia
        "DEPORTES REGIONALES": "https://images.unsplash.com/photo-1551214012-84f95e060dee?w=1000&q=80" # Estadio dinámico
    }
    ext_url = fallbacks.get(category.upper(), "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000")
    
    url = await download_and_upload_image(ext_url)
    # Rescate final (La Van rosa es estilo arte, la dejamos como última opción)
    return url or "https://mofkjgfrpfmtnktaepqi.supabase.co/storage/v1/object/public/news_images/7de9589e-c248-46c9-891b-78e0f843d3df.webp"
