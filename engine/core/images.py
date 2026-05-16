import os
import uuid
import logging
import httpx
from io import BytesIO
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

# Configuración Hugging Face Inference API (v8.7 Smart Cloud)
HF_API_URL = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"
HF_TOKEN = os.getenv("HF_TOKEN", "")

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """
    Genera una imagen artística para la noticia usando el API de Hugging Face
    y la sube a Supabase Storage.
    """
    if not HF_TOKEN:
        logger.error("[Images] ⚠️ Falta HF_TOKEN. Usando placeholder.")
        return "/news-placeholder.png"

    try:
        logger.info(f"[Images] 🖌️ Generando imagen vía API para: {prompt[:50]}...")
        
        headers = {"Authorization": f"Bearer {HF_TOKEN}"}
        payload = {
            "inputs": prompt,
            "parameters": {
                "negative_prompt": "blurry, low quality, distorted, ugly, text, watermark",
                "guidance_scale": 7.5,
                "num_inference_steps": 30
            }
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(HF_API_URL, headers=headers, json=payload)
            
            if response.status_code == 200:
                image_data = response.content
                
                # Subir a Supabase Storage
                db = get_supabase()
                filename = f"{news_id or uuid.uuid4()}.webp"
                
                try:
                    res = db.storage.from_("news_images").upload(
                        path=filename,
                        file=image_data,
                        file_options={"content-type": "image/webp", "upsert": "true"}
                    )
                    return db.storage.from_("news_images").get_public_url(filename)
                except Exception as upload_err:
                    logger.error(f"[Images] Error subiendo a Supabase: {upload_err}")
                    return "/news-placeholder.png"
            else:
                logger.error(f"[Images] Error en HF API: {response.status_code} - {response.text}")
                return "/news-placeholder.png"

    except Exception as e:
        logger.error(f"[Images] ❌ Fallo en la generación: {e}")
        return "/news-placeholder.png"
