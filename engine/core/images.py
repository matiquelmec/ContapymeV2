import os
import uuid
import logging
import httpx
import random
import traceback
import urllib.parse
import asyncio
import io
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

# 📸 Constantes de Fotoperiodismo Editorial 2026 (Estándar Reuters / AFP / Leica Full-Frame)
EDITORIAL_PHOTOJOURNALISM_STYLE = (
    "authentic editorial press photography, shot on Leica SL2-S 35mm f/2.8 lens, ISO 400, "
    "natural subpolar Magallanes daylight, authentic Chilean Patagonia architecture and environment, "
    "subtle Kodak Portra 400 film grain, unretouched documentary realism, crisp optical micro-contrast, "
    "no close-up faces, no readable text or signage, 16:9 widescreen composition"
)

EDITORIAL_NEGATIVE_PROMPT = (
    "cartoon, 3d render, CGI, illustration, drawing, painting, anime, video game, "
    "plastic smooth skin, fake studio lighting, oversaturated neon, distorted anatomy, blurry, low resolution, watermark"
)

# Perfiles ópticos contextuales por categoría para maximizar realismo sin artefactos de IA
CATEGORY_OPTICAL_PROFILES = {
    "SII / LEGAL": (
        "architectural wide-angle shot of modern Chilean institutional stone and glass building facade, "
        "overcast austral sky, wet pavement reflections, formal documentary atmosphere, no text on signs"
    ),
    "ECONOMÍA": (
        "cinematic wide documentary shot of commercial port, cargo containers and industrial activity in Strait of Magellan, "
        "cold steel and ocean tones, natural overcast lighting, shot on 35mm lens"
    ),
    "FINANZAS": (
        "minimalist high-end corporate office interior overlooking misty southern ocean bay, "
        "architectural glass, natural northern window light, shallow depth of field, documentary style"
    ),
    "INVERSIONES": (
        "wide aerial-perspective documentary photo of wind turbines, energy infrastructure and maritime logistics in Patagonia, "
        "dramatic sub-antarctic clouds, golden hour horizon, crisp optical clarity"
    ),
    "MAGALLANES ACTUAL": (
        "authentic street-level documentary photograph in Punta Arenas Chile, colorful corrugated metal roofs, "
        "brick heritage buildings, Strait of Magellan in background, crisp cold air, natural daylight"
    ),
}

# 📚 Biblioteca Ampliada de Stock Editorial 16:9 de Magallanes y Patagonia (40+ URLs Únicas)
FALLBACK_POOLS = {
    "SII / LEGAL": [
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1423592782089-60e02ad5d7bb?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?w=1280&fit=crop&q=80",
    ],
    "ECONOMÍA": [
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1280&fit=crop&q=80",
    ],
    "INVERSIONES": [
        "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1280&fit=crop&q=80",
    ],
    "DEPORTES REGIONALES": [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1280&fit=crop&q=80",
    ],
    "MAGALLANES ACTUAL": [
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1280&fit=crop&q=80",
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1280&fit=crop&q=80",
    ]
}

def _sanitize_visual_prompt(prompt: str, category: str = "") -> str:
    """Sanitiza y enriquece el prompt con dirección de arte óptica anti-artefactos IA."""
    if not prompt:
        prompt = "Documentary press scene in Punta Arenas, Magallanes and Chilean Patagonia"
    cleaned = prompt.replace("\n", " ").replace("\r", " ").replace("\t", " ")
    cleaned = " ".join(cleaned.split())
    cat_key = (category or "").upper().strip()
    optical_addon = CATEGORY_OPTICAL_PROFILES.get(cat_key, "")
    if optical_addon and len(cleaned) < 280:
        cleaned = f"{cleaned}, {optical_addon}"
    return cleaned[:480]

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

def _apply_editorial_optical_grade(image: Image.Image, target_width: int = 1536, target_height: int = 864) -> Image.Image:
    """
    Revelado Digital Editorial (Anti-AI Look):
    1. Encuadre inteligente 16:9 (ImageOps.fit con Lanczos) sin deformar proporciones.
    2. Desaturación sutil (-6%) para eliminar colores neón/sintéticos típicos de IA.
    3. Micro-contraste (+5%) para profundidad de rango dinámico tipo prensa (Reuters/AFP).
    4. Máscara de enfoque óptica (UnsharpMask) que elimina la suavidad plástica ('AI softness').
    """
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    current_ratio = image.width / max(image.height, 1)
    target_ratio = target_width / target_height
    if abs(current_ratio - target_ratio) > 0.05:
        crop_w = min(image.width, target_width)
        crop_h = int(crop_w / target_ratio)
        if crop_h > image.height:
            crop_h = image.height
            crop_w = int(crop_h * target_ratio)
        if crop_w > 0 and crop_h > 0:
            image = ImageOps.fit(image, (crop_w, crop_h), method=Image.Resampling.LANCZOS, centering=(0.5, 0.45))

    if image.width > target_width:
        new_height = int(image.height * (target_width / image.width))
        image = image.resize((target_width, new_height), Image.Resampling.LANCZOS)

    # Colorimetría editorial sobria (-6% saturación cromática)
    image = ImageEnhance.Color(image).enhance(0.94)
    # Micro-contraste óptico (+5%)
    image = ImageEnhance.Contrast(image).enhance(1.05)
    # Nitidez de lente prime (UnsharpMask calibrado)
    image = image.filter(ImageFilter.UnsharpMask(radius=1.3, percent=125, threshold=3))
    return image

def _optimize_to_webp(
    content: bytes,
    max_width: int = 1536,
    quality: int = 90,
    apply_optical_grade: bool = True
) -> bytes:
    """Convierte, revela ópticamente y optimiza el buffer de imagen a formato WebP HD."""
    try:
        image = Image.open(io.BytesIO(content))
        if apply_optical_grade:
            image = _apply_editorial_optical_grade(image, target_width=max_width, target_height=int(max_width * 9 / 16))
        else:
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            if image.width > max_width:
                new_height = int(image.height * (max_width / image.width))
                image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        image.save(output, format="WEBP", quality=quality, method=6)
        return output.getvalue()
    except Exception as e:
        logger.warning(f"[Images] No se pudo optimizar a WebP ({e}). Usando buffer original.")
        return content

async def generate_and_upload_image(
    prompt: str,
    news_id: str = None,
    exclude_urls: list[str] = None,
    category: str = ""
) -> str:
    """
    Genera imagen con motor multi-capa de alta definición:
    1. Google Imagen 3 / 4 (si existe GOOGLE_API_KEY / GEMINI_API_KEY).
    2. Hugging Face Serverless Free Tier (`black-forest-labs/FLUX.1-dev` 28 pasos reales, si existe HF_TOKEN).
    3. Pollinations `flux-realism` / `flux` HD (`1536x864`, `enhance=false` para preservar prompt técnico Leica).
    4. Pollinations SDXL Turbo con revelado óptico Pillow.
    """
    try:
        clean_prompt = _sanitize_visual_prompt(prompt, category=category)
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
                            webp_bytes = _optimize_to_webp(img_bytes, max_width=1536, quality=90)
                            return await _upload_to_supabase(webp_bytes, "imagen3")
                    logger.warning(f"[Images] Google Imagen 3 falló (status={resp.status_code}). Pasando a siguiente motor...")
                except Exception as ie:
                    logger.warning(f"[Images] Google Imagen 3 no disponible ({ie}). Pasando a siguiente motor...")

            # ─── MOTOR 2: Hugging Face Serverless Inference Free (`FLUX.1-dev` 28-step / `FLUX.1-schnell`) ───
            hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY")
            if hf_token:
                for hf_model in ("black-forest-labs/FLUX.1-dev", "black-forest-labs/FLUX.1-schnell"):
                    try:
                        logger.info(f"[Images] Intentando generar con Hugging Face ({hf_model})...")
                        hf_url = f"https://api-inference.huggingface.co/models/{hf_model}"
                        hf_headers = {"Authorization": f"Bearer {hf_token}"}
                        hf_payload = {
                            "inputs": full_prompt,
                            "parameters": {"width": 1344, "height": 768, "num_inference_steps": 28 if "dev" in hf_model else 4}
                        }
                        hf_resp = await client.post(hf_url, json=hf_payload, headers=hf_headers, timeout=35.0)
                        if hf_resp.status_code == 200:
                            valid, _ = _validate_image_bytes(hf_resp.content)
                            if valid:
                                logger.info(f"[Images] ✅ Éxito con Hugging Face {hf_model}!")
                                webp_bytes = _optimize_to_webp(hf_resp.content, max_width=1536, quality=90)
                                return await _upload_to_supabase(webp_bytes, "fluxdev")
                    except Exception as hfe:
                        logger.warning(f"[Images] Hugging Face ({hf_model}) no disponible: {hfe}")

            # ─── MOTOR 3: Pollinations FLUX Realism / FLUX HD (16:9 Full HD 1536x864 + Revelado Óptico) ───
            pollinations_models = ["flux-realism", "flux", "flux"]
            for attempt, model_name in enumerate(pollinations_models, start=1):
                seed = random.randint(10000, 999999)
                try:
                    logger.info(f"[Images] Generando con Pollinations {model_name} HD 1536x864 (Intento {attempt}/{len(pollinations_models)})...")
                    gen_url = (
                        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                        f"?width=1536&height=864&seed={seed}&model={model_name}&nologo=true&enhance=false&safe=true"
                    )
                    response = await client.get(gen_url, timeout=35.0)
                    content_type = response.headers.get("content-type", "")
                    
                    if response.status_code == 200 and content_type.startswith("image/"):
                        valid, _ = _validate_image_bytes(response.content)
                        if valid:
                            logger.info(f"[Images] ✅ Éxito con Pollinations {model_name} HD en intento {attempt}!")
                            webp_bytes = _optimize_to_webp(response.content, max_width=1536, quality=90)
                            return await _upload_to_supabase(webp_bytes, "fluxhd")
                    elif response.status_code == 429:
                        logger.warning(f"[Images] Pollinations Rate Limit (429) en intento {attempt}. Pausando...")
                        await asyncio.sleep(attempt * 2)
                    else:
                        logger.warning(f"[Images] Pollinations {model_name} intento {attempt} status={response.status_code}")
                except Exception as pe:
                    logger.warning(f"[Images] Pollinations {model_name} intento {attempt} fallo: {pe}")
                
                if attempt < len(pollinations_models):
                    await asyncio.sleep(2)
            
            # ─── MOTOR 4: Pollinations SDXL Turbo (Respaldo 16:9 con Revelado Óptico) ───
            try:
                logger.info("[Images] Recurriendo a Motor 4 (SDXL Turbo 16:9)...")
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
                        webp_bytes = _optimize_to_webp(response.content, max_width=1536, quality=90)
                        return await _upload_to_supabase(webp_bytes, "turbo")
            except Exception as te:
                logger.warning(f"[Images] Motor 4 (Turbo) no disponible: {te}")

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

async def download_and_upload_image(image_url: str, min_width: int = 0, min_height: int = 0) -> str:
    """
    Descarga una imagen externa (ej. og:image de prensa o logo de marca), verifica que cumpla
    dimensiones mínimas si se especifican, aplica revelado óptico editorial y la sube en WebP HD.
    """
    if not image_url or not image_url.startswith("http"):
        return None
    lower_url = image_url.lower()
    if any(b in lower_url for b in ("placeholder", "default-share", "avatar", "favicon.ico", "logo-default", "1x1", "pixel")):
        return None
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
        }
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
            response = await client.get(image_url)
            if response.status_code == 200:
                valid, _ = _validate_image_bytes(response.content)
                if valid:
                    is_brand_logo = "clearbit" in lower_url or "google.com/s2/favicons" in lower_url
                    if min_width > 0 or min_height > 0:
                        try:
                            img_check = Image.open(io.BytesIO(response.content))
                            if img_check.width < min_width or img_check.height < min_height:
                                logger.info(f"[Images] Imagen descartada por baja resolución ({img_check.width}x{img_check.height} < {min_width}x{min_height}): {image_url}")
                                return None
                        except Exception:
                            return None
                    prefix = "brand" if is_brand_logo else "presshd"
                    webp_bytes = _optimize_to_webp(
                        response.content,
                        max_width=1536,
                        quality=90,
                        apply_optical_grade=not is_brand_logo
                    )
                    return await _upload_to_supabase(webp_bytes, prefix)
            else:
                logger.warning(f"[Images] Fallo al descargar de {image_url}: status={response.status_code}")
    except Exception as e:
        logger.warning(f"[Images] No se pudo descargar imagen externa ({image_url}): {e}")
    return None

async def get_category_fallback_url(category: str, title: str = "", exclude_urls: list[str] = None) -> str:
    """
    Selecciona una imagen de stock profesional 16:9 garantizando CERO COLISIONES
    con las imágenes recientemente utilizadas o excluidas.
    """
    cat_normalized = category.upper()
    matching_pool = FALLBACK_POOLS.get("MAGALLANES ACTUAL")
    
    for k, pool in FALLBACK_POOLS.items():
        if k in cat_normalized:
            matching_pool = pool
            break

    exclude_set = set(exclude_urls or [])
    
    # 1. Filtrar las imágenes del pool que NO estén en la lista de exclusión
    available_pool = [url for url in matching_pool if url not in exclude_set]
    
    # 2. Si se agotó el pool de la categoría, usar el pool global de Magallanes excluyendo las usadas
    if not available_pool:
        all_images = [url for pool in FALLBACK_POOLS.values() for url in pool]
        available_pool = [url for url in all_images if url not in exclude_set]
    
    # 3. Si aún así no hay disponibles (caso extremo), usar todo el pool
    if not available_pool:
        available_pool = matching_pool
        
    # Selección determinista pero única
    idx = abs(hash(title + str(len(exclude_set)))) % len(available_pool)
    return available_pool[idx]
