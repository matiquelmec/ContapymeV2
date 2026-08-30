import os
import uuid
import logging
import httpx
import random
import traceback
import urllib.parse
import asyncio
import io
from PIL import Image
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

# 📸 Constantes de Fotoperiodismo Editorial 2026
EDITORIAL_PHOTOJOURNALISM_STYLE = (
    "authentic documentary press photo, editorial photojournalism, shot on 35mm lens at f/2.8, "
    "natural overcast Magallanes daylight, realistic Chilean regional context, 16:9 cinematic aspect ratio, "
    "high resolution, crisp details, natural skin textures, award-winning editorial journalism photography"
)

EDITORIAL_NEGATIVE_PROMPT = (
    "cartoon, 3d render, CGI, illustration, drawing, painting, anime, video game, "
    "plastic smooth skin, fake studio lighting, oversaturated neon, distorted anatomy, blurry, low resolution, watermark"
)

def _sanitize_visual_prompt(prompt: str) -> str:
    """Sanitiza el prompt eliminando caracteres de control, saltos de línea peligrosos o inyecciones."""
    if not prompt:
        return "Noticia de actualidad en Magallanes y la Patagonia Chilena"
    cleaned = prompt.replace("\n", " ").replace("\r", " ").replace("\t", " ")
    cleaned = " ".join(cleaned.split())
    # Limitar longitud para evitar overflow en URLs
    return cleaned[:400]

def _validate_image_bytes(content: bytes) -> tuple[bool, str]:
    """Inspecciona las cabeceras binarias (Magic Numbers) para asegurar que sea una imagen válida."""
    if not content or len(content) < 100:
        return False, "Buffer vacío o corrupto"
    
    if content.startswith(b"\xff\xd8\xff"):
        return True, "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return True, "image/png"
    if content.startswith(b"RIFF") and b"WEBP" in content[:16]:
        return True, "image/webp"
    
    return False, "Formato binario no reconocido"

def _optimize_to_webp(content: bytes, max_width: int = 1280, quality: int = 85) -> bytes:
    """Convierte y optimiza cualquier buffer de imagen a formato WebP ligero (<150KB)."""
    try:
        image = Image.open(io.BytesIO(content))
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        # Redimensionar manteniendo proporción 16:9 si excede el ancho máximo
        if image.width > max_width:
            new_height = int(image.height * (max_width / image.width))
            image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        image.save(output, format="WEBP", quality=quality, method=6)
        return output.getvalue()
    except Exception as e:
        logger.warning(f"[Images] No se pudo optimizar a WebP ({e}). Usando buffer original.")
        return content

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """
    Genera imagen con motor multi-capa (Google Imagen 3 -> Pollinations FLUX.1 -> SDXL Turbo -> Stock)
    con proporción nativa 16:9 y compresión WebP en el servidor.
    """
    try:
        clean_prompt = _sanitize_visual_prompt(prompt)
        full_prompt = f"{clean_prompt}, {EDITORIAL_PHOTOJOURNALISM_STYLE}"
        encoded_prompt = urllib.parse.quote(full_prompt)
        
        async with httpx.AsyncClient(timeout=45.0, follow_redirects=True) as client:
            
            # ─── MOTOR 1: Google Imagen 3 / Gemini Image (Si existe GOOGLE_API_KEY) ───
            google_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
            if google_key:
                try:
                    logger.info("[Images] Intentando generar con Google Imagen 3...")
                    imagen_url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={google_key}"
                    payload = {
                        "instances": [{"prompt": full_prompt}],
                        "parameters": {
                            "sampleCount": 1,
                            "aspectRatio": "16:9",
                            "personGeneration": "ALLOW_ADULT",
                            "safetySetting": "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    }
                    resp = await client.post(imagen_url, json=payload, timeout=25.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        predictions = data.get("predictions", [])
                        if predictions and "bytesBase64Encoded" in predictions[0]:
                            import base64
                            img_bytes = base64.b64decode(predictions[0]["bytesBase64Encoded"])
                            logger.info("[Images] ✅ Éxito con Google Imagen 3!")
                            webp_bytes = _optimize_to_webp(img_bytes, max_width=1280)
                            return await _upload_to_supabase(webp_bytes, "imagen3")
                    logger.warning(f"[Images] Google Imagen 3 falló (status={resp.status_code}). Pasando a FLUX.1...")
                except Exception as ie:
                    logger.warning(f"[Images] Google Imagen 3 no disponible ({ie}). Pasando a FLUX.1...")

            # ─── MOTOR 2: Pollinations FLUX.1 [schnell] (16:9 Nativo - 1280x720) ───
            max_retries = 2
            for attempt in range(1, max_retries + 1):
                seed = random.randint(1, 999999)
                try:
                    logger.info(f"[Images] Generando con Pollinations FLUX.1 16:9 (Intento {attempt}/{max_retries})...")
                    gen_url = (
                        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                        f"?width=1280&height=720&seed={seed}&model=flux&nologo=true"
                    )
                    response = await client.get(gen_url, timeout=30.0)
                    content_type = response.headers.get("content-type", "")
                    
                    if response.status_code == 200 and content_type.startswith("image/"):
                        valid, mime = _validate_image_bytes(response.content)
                        if valid:
                            logger.info(f"[Images] ✅ Éxito con Pollinations FLUX.1 en intento {attempt}!")
                            webp_bytes = _optimize_to_webp(response.content, max_width=1280)
                            return await _upload_to_supabase(webp_bytes, "flux")
                    else:
                        logger.warning(f"[Images] FLUX.1 intento {attempt} status={response.status_code}")
                except Exception as pe:
                    logger.warning(f"[Images] FLUX.1 intento {attempt} fallo: {pe}")
                
                if attempt < max_retries:
                    await asyncio.sleep(2)
            
            # ─── MOTOR 3: Pollinations SDXL Turbo (Respaldo 16:9 Ultrarrápido) ───
            try:
                logger.info("[Images] Recurriendo a Motor 3 (SDXL Turbo 16:9)...")
                seed = random.randint(1, 999999)
                turbo_url = (
                    f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                    f"?width=1280&height=720&seed={seed}&model=turbo&nologo=true"
                )
                response = await client.get(turbo_url, timeout=20.0)
                if response.status_code == 200:
                    valid, _ = _validate_image_bytes(response.content)
                    if valid:
                        logger.info("[Images] ✅ Éxito con Pollinations SDXL Turbo!")
                        webp_bytes = _optimize_to_webp(response.content, max_width=1280)
                        return await _upload_to_supabase(webp_bytes, "turbo")
            except Exception as te:
                logger.warning(f"[Images] Motor 3 (Turbo) no disponible: {te}")

    except Exception as ex:
        logger.error(f"[Images] Fallo general en generador de imágenes: {ex}")
    return None

async def _upload_to_supabase(content: bytes, prefix: str) -> str:
    try:
        db = get_supabase()
        filename = f"{prefix}_{uuid.uuid4()}.webp"
        db.storage.from_("news_images").upload(path=filename, file=content, file_options={"content-type": "image/webp"})
        return str(db.storage.from_("news_images").get_public_url(filename)).split('?')[0]
    except Exception as e:
        logger.error(f"[Images] Error al subir a Supabase Storage: {e}")
        return None

async def download_and_upload_image(image_url: str) -> str:
    if not image_url or not image_url.startswith("http"): return None
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(image_url)
            if response.status_code == 200:
                valid, _ = _validate_image_bytes(response.content)
                if valid:
                    prefix = "brand" if ("clearbit" in image_url or "google.com/s2/favicons" in image_url) else "stock"
                    webp_bytes = _optimize_to_webp(response.content, max_width=1280)
                    return await _upload_to_supabase(webp_bytes, prefix)
            else:
                logger.warning(f"[Images] Fallo al descargar de {image_url}: status={response.status_code}")
    except Exception as e:
        logger.warning(f"[Images] No se pudo descargar imagen externa ({image_url}): {e}")
    return None

async def get_category_fallback_url(category: str, title: str = "") -> str:
    """Selecciona una imagen de stock profesional de forma determinista usando el hash del título
    para evitar duplicados en el feed de noticias."""
    POOLS = {
        "SII / LEGAL": [
            "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1423592782089-60e02ad5d7bb?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1280&fit=crop&q=80",
        ],
        "ECONOMÍA Y FINANZAS": [
            "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1280&fit=crop&q=80",
        ],
        "PYMES Y EMPLEABILIDAD": [
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=1280&fit=crop&q=80",
        ],
        "MAGALLANES ACTUAL": [
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&fit=crop&q=80",
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&fit=crop&q=80",
        ]
    }
    
    cat_pool = POOLS.get(category, POOLS["MAGALLANES ACTUAL"])
    idx = abs(hash(title)) % len(cat_pool)
    return cat_pool[idx]
