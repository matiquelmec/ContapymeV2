import os
import uuid
import logging
import httpx
import asyncio
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

# Proveedores de IA Artística (Estrategia de redundancia)
PROVIDERS = [
    "https://image.pollinations.ai/prompt",
    "https://api.airforce/v1/imaging/default" # Proveedor de respaldo
]

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """
    Genera una imagen con el estilo artístico solicitado usando redundancia de proveedores.
    """
    # Prompt enriquecido para garantizar el estilo Contapyme (Ghibli + Cyberpunk)
    enhanced_prompt = (
        f"{prompt}, Studio Ghibli style, soft cyberpunk aesthetic, "
        "highly detailed, cinematic lighting, 8k resolution, professional digital art, "
        "vibrant colors, trending on artstation"
    )
    
    for url_base in PROVIDERS:
        try:
            seed = uuid.uuid4().int >> 64
            # Construir URL según el proveedor
            if "pollinations" in url_base:
                image_url = f"{url_base}/{enhanced_prompt.replace(' ', '%20')}?width=1024&height=768&seed={seed}&nologo=true"
            else:
                image_url = f"{url_base}?prompt={enhanced_prompt.replace(' ', '%20')}&seed={seed}"

            logger.info(f"[Images] 🎨 Intentando generación artística ({'Primario' if 'pollinations' in url_base else 'Respaldo'})...")

            async with httpx.AsyncClient(timeout=45.0, follow_redirects=True) as client:
                response = await client.get(image_url)
                
                # Una imagen válida de SD suele pesar más de 30KB
                if response.status_code == 200 and len(response.content) > 30000:
                    image_data = response.content
                    
                    db = get_supabase()
                    filename = f"art_{uuid.uuid4()}.png"
                    
                    # Subida a Supabase Storage
                    db.storage.from_("news_images").upload(
                        path=filename,
                        file=image_data,
                        file_options={"content-type": "image/png", "cache-control": "3600", "upsert": "true"}
                    )
                    
                    public_url = db.storage.from_("news_images").get_public_url(filename)
                    logger.info(f"[Images] ✅ ÉXITO: {public_url}")
                    return public_url
                
                logger.warning(f"[Images] Proveedor {url_base} devolvió respuesta inválida.")
                
        except Exception as e:
            logger.error(f"[Images] Error con proveedor {url_base}: {e}")
            continue # Probar el siguiente proveedor

    return None

async def download_and_upload_image(image_url: str, news_id: str = None) -> str:
    """Persiste la imagen original si la IA falla del todo."""
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
    """Imágenes de stock de alta gama (Unsplash) como último recurso."""
    fallbacks = {
        "SII / LEGAL": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80",
        "FINANZAS": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=80",
        "ECONOMÍA": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=80",
        "INVERSIONES": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1000&q=80",
        "MAGALLANES ACTUAL": "https://images.unsplash.com/photo-1548625361-1adaa91fa9ba?auto=format&fit=crop&w=1000&q=80"
    }
    return fallbacks.get(category.upper(), "https://images.unsplash.com/photo-1504711434969-e33886168d5c?auto=format&fit=crop&w=1000&q=80")
