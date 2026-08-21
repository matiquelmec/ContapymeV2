import os
import uuid
import logging
import httpx
import random
import traceback
import urllib.parse
import asyncio
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """Genera imagen con motor multi-capa (Hugging Face SDXL -> Pollinations FLUX -> Pollinations SDXL Turbo)
    para máxima estabilidad y calidad tanto en local como en producción."""
    try:
        art_style = "hyperrealistic photorealistic news photography, highly detailed, cinematic lighting, shot on 35mm lens, authentic documentary style"
        full_prompt = f"{prompt}, {art_style}"
        encoded_prompt = urllib.parse.quote(full_prompt)
        
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            # MOTOR 1: Hugging Face Inference API (SDXL) - Ultra estable y libre de rate limits por IP en producción
            hf_token = os.getenv("HF_TOKEN")
            if hf_token:
                try:
                    logger.info("[Images] Intentando generar imagen con Hugging Face (SDXL)...")
                    model_id = "stabilityai/stable-diffusion-xl-base-1.0"
                    api_url = f"https://api-inference.huggingface.co/models/{model_id}"
                    headers = {
                        "Authorization": f"Bearer {hf_token}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "inputs": full_prompt,
                        "parameters": {
                            "negative_prompt": "cartoon, 3d, video game, anime, drawing, painting, sketch, low quality, blurry"
                        }
                    }
                    response = await client.post(api_url, headers=headers, json=payload, timeout=40.0)
                    
                    if response.status_code == 200:
                        logger.info("[Images] Éxito con Hugging Face (SDXL)!")
                        return await _upload_to_supabase(response.content, "hf")
                    elif response.status_code == 503:
                        # El modelo se está cargando (cold start) en Hugging Face
                        try:
                            data = response.json()
                            estimated_time = min(float(data.get("estimated_time", 15.0)), 25.0)
                        except:
                            estimated_time = 15.0
                        logger.info(f"[Images] Modelo HF cargándose. Esperando {estimated_time}s antes de reintentar...")
                        await asyncio.sleep(estimated_time)
                        
                        response = await client.post(api_url, headers=headers, json=payload, timeout=40.0)
                        if response.status_code == 200:
                            logger.info("[Images] Éxito con Hugging Face (SDXL) tras reintento de carga!")
                            return await _upload_to_supabase(response.content, "hf")
                    
                    logger.warning(f"[Images] Hugging Face falló con status={response.status_code}. Pasando a Pollinations...")
                except Exception as hfe:
                    logger.warning(f"[Images] Hugging Face no disponible ({hfe}). Pasando directamente a Pollinations FLUX...")
            else:
                logger.info("[Images] HF_TOKEN no configurado. Pasando directamente a Pollinations FLUX...")

            # MOTOR 2: Pollinations (FLUX - Alta Calidad)
            max_retries = 2
            for attempt in range(1, max_retries + 1):
                seed = random.randint(1, 999999)
                try:
                    logger.info(f"[Images] Generando con Pollinations FLUX (Intento {attempt}/{max_retries})...")
                    gen_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=768&seed={seed}&model=flux&nologo=true"
                    response = await client.get(gen_url, timeout=45.0)
                    content_type = response.headers.get("content-type", "")
                    
                    if response.status_code == 200 and content_type.startswith("image/"):
                        logger.info(f"[Images] Éxito con Pollinations FLUX en intento {attempt}!")
                        return await _upload_to_supabase(response.content, "flux")
                    else:
                        logger.warning(
                            f"[Images] Pollinations FLUX intento {attempt} fallido: status={response.status_code}, type={content_type}"
                        )
                except Exception as pe:
                    logger.warning(f"[Images] Pollinations FLUX intento {attempt} no respondió: {pe}")
                
                if attempt < max_retries:
                    await asyncio.sleep(3)
            
            # MOTOR 3: Pollinations (SDXL Turbo - Respaldo Rápido y Estable)
            try:
                logger.info("[Images] Recurriendo a Motor 3 (SDXL Turbo)...")
                seed = random.randint(1, 999999)
                turbo_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=768&seed={seed}&model=turbo&nologo=true"
                response = await client.get(turbo_url, timeout=25.0)
                content_type = response.headers.get("content-type", "")
                if response.status_code == 200 and content_type.startswith("image/"):
                    logger.info("[Images] Éxito con Pollinations SDXL Turbo!")
                    return await _upload_to_supabase(response.content, "turbo")
            except Exception as te:
                logger.warning(f"[Images] Motor 3 (Turbo) no disponible: {te}")

    except Exception as ex:
        logger.error(f"[Images] Fallo general en generador: {ex}")
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
                prefix = "brand" if ("clearbit" in image_url or "google.com/s2/favicons" in image_url) else "stock"
                return await _upload_to_supabase(response.content, prefix)
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
            "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000",
            "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1000",
            "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1000",
            "https://images.unsplash.com/photo-1423592782089-60e02ad5d7bb?w=1000",
            "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1000",
            "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1000",
            "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=1000",
            "https://images.unsplash.com/photo-1554224155-6726b3fc858f?w=1000",
            "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000",
            "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=1000"
        ],
        "ECONOMÍA": [
            "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000",
            "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1000",
            "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1000",
            "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000",
            "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=1000",
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000",
            "https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=1000",
            "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1000",
            "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1000",
            "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1000"
        ],
        "FINANZAS": [
            "https://images.unsplash.com/photo-1551288049-bbbda536339a?w=1000",
            "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1000",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000",
            "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1000",
            "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1000",
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1000",
            "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1000",
            "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1000",
            "https://images.unsplash.com/photo-1534951009808-766178b47a4f?w=1000",
            "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1000"
        ],
        "MAGALLANES ACTUAL": [
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000",
            "https://images.unsplash.com/photo-1570158268183-d296b289020b?w=1000",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
            "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000",
            "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1000",
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000",
            "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1000",
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000",
            "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1000",
            "https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?w=1000"
        ],
        "DEPORTES REGIONALES": [
            "https://images.unsplash.com/photo-1551214012-84f95e060dee?w=1000",
            "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1000",
            "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000",
            "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1000",
            "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1000",
            "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1000",
            "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=1000",
            "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000",
            "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000",
            "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1000"
        ]
    }
    
    category_list = POOLS.get(category.upper(), POOLS["MAGALLANES ACTUAL"])
    
    if title:
        import hashlib
        # Hashing determinista del título para elegir una imagen fija y representativa
        h = int(hashlib.md5(title.encode('utf-8')).hexdigest(), 16)
        idx = h % len(category_list)
        ext_url = category_list[idx]
    else:
        ext_url = random.choice(category_list)
        
    url = await download_and_upload_image(ext_url)
    return url or "https://mofkjgfrpfmtnktaepqi.supabase.co/storage/v1/object/public/news_images/7de9589e-c248-46c9-891b-78e0f843d3df.webp"
