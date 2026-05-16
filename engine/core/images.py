import os
import uuid
import logging
import httpx
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

# Proveedor de IA Artística (Estilo Ghibli/Cyberpunk)
# Usamos un mirror de SDXL que es gratuito y robusto
AI_IMAGE_API = "https://image.pollinations.ai/prompt" 

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """
    Genera una imagen con el estilo artístico solicitado y la guarda en Supabase.
    """
    try:
        # Optimizamos el prompt para el modelo
        full_prompt = f"{prompt}, masterpiece, highly detailed, 8k, professional lighting"
        
        # Pollinations a veces da 402 si se usa mucha frecuencia, 
        # añadimos un seed aleatorio para evitar cache y bloqueos
        seed = uuid.uuid4().int >> 64
        image_url = f"{AI_IMAGE_API}/{full_prompt.replace(' ', '%20')}?width=1024&height=768&seed={seed}&nologo=true"

        logger.info(f"[Images] 🎨 Generando estilo artístico: {prompt[:50]}...")

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            response = await client.get(image_url)
            
            if response.status_code == 200 and len(response.content) > 5000:
                image_data = response.content
                
                # PERSISTENCIA EN SUPABASE (Para que no desaparezcan)
                db = get_supabase()
                filename = f"art_{uuid.uuid4()}.png"
                
                db.storage.from_("news_images").upload(
                    path=filename,
                    file=image_data,
                    file_options={"content-type": "image/png", "upsert": "true"}
                )
                
                # Obtener la URL pública real
                public_url = db.storage.from_("news_images").get_public_url(filename)
                logger.info(f"[Images] ✅ Imagen artística lista: {public_url}")
                return public_url
            else:
                logger.error(f"[Images] Error del proveedor: {response.status_code}")
                return None

    except Exception as e:
        logger.error(f"[Images] ❌ Fallo en generación artística: {e}")
        return None

async def download_and_upload_image(image_url: str, news_id: str = None) -> str:
    """Fallback para cuando la IA falla: usamos la original pero la guardamos en nuestro storage."""
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
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
    # Mantenemos las fotos de stock profesionales como último recurso
    fallbacks = {
        "SII / LEGAL": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000",
        "FINANZAS": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000",
        "ECONOMÍA": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000",
        "MAGALLANES ACTUAL": "https://images.unsplash.com/photo-1548625361-1adaa91fa9ba?auto=format&fit=crop&w=1000"
    }
    return fallbacks.get(category.upper(), "https://images.unsplash.com/photo-1504711434969-e33886168d5c?auto=format&fit=crop&w=1000")
