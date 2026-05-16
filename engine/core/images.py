import os
import uuid
import logging
import httpx
from urllib.parse import quote

from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

# Imágenes de stock por categoría para noticias sin foto original
CATEGORY_FALLBACKS = {
    "SII / LEGAL": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1024&h=768&fit=crop&q=80",
    "FINANZAS": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1024&h=768&fit=crop&q=80",
    "ECONOMÍA": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1024&h=768&fit=crop&q=80",
    "INVERSIONES": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1024&h=768&fit=crop&q=80",
    "MAGALLANES ACTUAL": "https://images.unsplash.com/photo-1548625361-1adaa91fa9ba?w=1024&h=768&fit=crop&q=80",
    "DEPORTES REGIONALES": "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=1024&h=768&fit=crop&q=80",
}
DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=1024&h=768&fit=crop&q=80"


async def download_and_upload_image(image_url: str, news_id: str = None) -> str:
    """
    Descarga la imagen original de la noticia y la sube a Supabase Storage
    para garantizar persistencia (las URLs de RSS pueden expirar).
    """
    if not image_url or image_url.startswith("/"):
        return None

    try:
        logger.info(f"[Images] 📸 Descargando imagen original: {image_url[:80]}...")

        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(image_url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })

            if response.status_code == 200 and len(response.content) > 1000:
                image_data = response.content

                # Detectar formato por content-type
                content_type = response.headers.get("content-type", "image/jpeg")
                ext = "jpg"
                if "png" in content_type:
                    ext = "png"
                elif "webp" in content_type:
                    ext = "webp"

                db = get_supabase()
                filename = f"{news_id or uuid.uuid4()}.{ext}"

                try:
                    db.storage.from_("news_images").upload(
                        path=filename,
                        file=image_data,
                        file_options={"content-type": content_type, "upsert": "true"}
                    )
                    public_url = db.storage.from_("news_images").get_public_url(filename)
                    logger.info(f"[Images] ✅ Imagen persistida en Supabase: {filename}")
                    return public_url
                except Exception as upload_err:
                    logger.warning(f"[Images] Error subiendo a Supabase: {upload_err}")
                    # Si falla la subida, retornar la URL original (puede funcionar temporalmente)
                    return image_url
            else:
                logger.warning(f"[Images] No se pudo descargar: status={response.status_code}")
                return image_url  # Devolver original como fallback

    except Exception as e:
        logger.warning(f"[Images] ⚠️ Error descargando imagen: {e}")
        return image_url  # Devolver original como fallback


def get_category_fallback(category: str = "") -> str:
    """Retorna una imagen de stock profesional según la categoría de la noticia."""
    return CATEGORY_FALLBACKS.get(category.upper().strip(), DEFAULT_FALLBACK)


async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """
    Legacy: Mantiene compatibilidad con el código existente.
    Retorna placeholder ya que los servicios gratuitos no están disponibles.
    """
    logger.info("[Images] ℹ️ Generación de imágenes IA desactivada. Usando imágenes originales/stock.")
    return "/news-placeholder.png"
