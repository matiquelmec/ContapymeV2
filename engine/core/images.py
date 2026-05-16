import os
import uuid
import logging
import httpx
from urllib.parse import quote

from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

# Pollinations.ai — Generación de imágenes gratuita y sin API key
POLLINATIONS_URL = "https://image.pollinations.ai/prompt"


async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """
    Genera una imagen artística para la noticia usando Pollinations.ai
    (gratuito, sin API key) y la sube a Supabase Storage.
    """
    try:
        # Construir URL de Pollinations con parámetros optimizados
        encoded_prompt = quote(prompt)
        url = f"{POLLINATIONS_URL}/{encoded_prompt}?width=1024&height=768&nologo=true&seed={hash(prompt) % 100000}"

        logger.info(f"[Images] 🖌️ Generando imagen vía Pollinations para: {prompt[:50]}...")

        async with httpx.AsyncClient(timeout=90.0, follow_redirects=True) as client:
            response = await client.get(url)

            if response.status_code == 200 and len(response.content) > 1000:
                image_data = response.content

                # Subir a Supabase Storage
                db = get_supabase()
                filename = f"{news_id or uuid.uuid4()}.png"

                try:
                    db.storage.from_("news_images").upload(
                        path=filename,
                        file=image_data,
                        file_options={"content-type": "image/png", "upsert": "true"}
                    )
                    public_url = db.storage.from_("news_images").get_public_url(filename)
                    logger.info(f"[Images] ✅ Imagen subida exitosamente: {filename}")
                    return public_url
                except Exception as upload_err:
                    logger.error(f"[Images] Error subiendo a Supabase: {upload_err}")
                    return "/news-placeholder.png"
            else:
                logger.error(f"[Images] Error en Pollinations: status={response.status_code}, size={len(response.content)}")
                return "/news-placeholder.png"

    except Exception as e:
        logger.error(f"[Images] ❌ Fallo en la generación: {e}")
        return "/news-placeholder.png"
