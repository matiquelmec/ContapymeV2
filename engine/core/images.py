import os
import uuid
import logging
import httpx
import random
import traceback
import urllib.parse
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """Genera imagen con motor dual (Pollinations + Airforce) para evitar fallos."""
    try:
        art_style = "hyperrealistic photorealistic news photography, highly detailed, cinematic lighting, shot on 35mm lens, authentic documentary style"
        full_prompt = f"{prompt}, {art_style}"
        encoded_prompt = urllib.parse.quote(full_prompt)
        seed = random.randint(1, 999999)
        
        # MOTOR 1: Pollinations (FLUX)
        async with httpx.AsyncClient(timeout=45.0, follow_redirects=True) as client:
            try:
                gen_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=768&seed={seed}&model=flux&nologo=true"
                response = await client.get(gen_url)
                if response.status_code == 200 and len(response.content) > 15000:
                    return await _upload_to_supabase(response.content, "flux")
            except Exception as pe:
                logger.warning(f"[Images] Pollinations falló ({pe}), intentando MOTOR 2 (Airforce)...")
                
                # MOTOR 2: Airforce (SDXL) - Basado en tu repo de recursos gratuitos
                af_url = f"https://api.airforce/v1/imagine2?prompt={encoded_prompt}&seed={seed}"
                response = await client.get(af_url, timeout=30.0, follow_redirects=True)
                if response.status_code == 200 and len(response.content) > 10000:
                    return await _upload_to_supabase(response.content, "airforce")

    except Exception:
        logger.error(f"[Images] Fallo en motores IA: {traceback.format_exc()}")
    return None

async def _upload_to_supabase(content: bytes, prefix: str) -> str:
    try:
        db = get_supabase()
        filename = f"{prefix}_{uuid.uuid4()}.webp"
        db.storage.from_("news_images").upload(path=filename, file=content, file_options={"content-type": "image/webp"})
        return str(db.storage.from_("news_images").get_public_url(filename)).split('?')[0]
    except: return None

async def download_and_upload_image(image_url: str) -> str:
    if not image_url or not image_url.startswith("http"): return None
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(image_url)
            if response.status_code == 200:
                return await _upload_to_supabase(response.content, "stock")
    except: pass
    return None

async def get_category_fallback_url(category: str) -> str:
    """Pool aleatorio por categoría para evitar duplicados en el feed."""
    POOLS = {
        "SII / LEGAL": [
            "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1000",
            "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000",
            "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1000"
        ],
        "ECONOMÍA": [
            "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1000",
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1000",
            "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000",
            "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1000"
        ],
        "FINANZAS": [
            "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1000",
            "https://images.unsplash.com/photo-1551288049-bbbda536339a?w=1000",
            "https://images.unsplash.com/photo-1534951009808-dfd0061397bc?w=1000"
        ],
        "MAGALLANES ACTUAL": [
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000",
            "https://images.unsplash.com/photo-1548625361-1adaa91fa9ba?w=1000",
            "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1000"
        ],
        "DEPORTES REGIONALES": [
            "https://images.unsplash.com/photo-1551214012-84f95e060dee?w=1000",
            "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1000"
        ]
    }
    
    category_list = POOLS.get(category.upper(), POOLS["MAGALLANES ACTUAL"])
    ext_url = random.choice(category_list)
    
    url = await download_and_upload_image(ext_url)
    return url or "https://mofkjgfrpfmtnktaepqi.supabase.co/storage/v1/object/public/news_images/7de9589e-c248-46c9-891b-78e0f843d3df.webp"
