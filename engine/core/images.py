import os
import torch
import uuid
import logging
import asyncio
from PIL import Image
from io import BytesIO
from diffusers import StableDiffusionXLPipeline, UNet2DConditionModel, EulerDiscreteScheduler
from huggingface_hub import hf_hub_download
from safetensors.torch import load_file
from core.database import get_supabase

logger = logging.getLogger("contapyme.images")

# Configuración SDXL Lightning (4 Steps)
BASE_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
REPO_ID = "ByteDance/SDXL-Lightning"
CKPT = "sdxl_lightning_4step_unet.safetensors"

# Singleton para el Pipeline
_pipe = None

def get_pipe():
    """Carga el modelo en la GPU (Solo una vez)"""
    global _pipe
    if _pipe is None:
        try:
            logger.info("[Images] 🎨 Cargando SDXL Lightning en la RTX 3060...")
            
            # 1. Cargar UNet con los pesos de Lightning (vía safetensors)
            unet = UNet2DConditionModel.from_config(BASE_MODEL, subfolder="unet").to("cuda", torch.float16)
            unet.load_state_dict(load_file(hf_hub_download(REPO_ID, CKPT), device="cuda"))
            
            # 2. Cargar Pipeline completo usando la UNet modificada
            _pipe = StableDiffusionXLPipeline.from_pretrained(
                BASE_MODEL, 
                unet=unet, 
                torch_dtype=torch.float16, 
                variant="fp16",
                use_safetensors=True
            ).to("cuda")
            
            # Configuración para Lightning
            _pipe.scheduler = EulerDiscreteScheduler.from_config(
                _pipe.scheduler.config, 
                timestep_spacing="trailing"
            )
            logger.info("[Images] ✅ Modelo cargado correctamente.")
        except Exception as e:
            logger.error(f"[Images] ❌ Error cargando modelo: {e}")
            return None
    return _pipe

async def generate_and_upload_image(prompt: str, news_id: str = None) -> str:
    """
    Genera una imagen artística para la noticia y la sube a Supabase Storage.
    """
    pipe = get_pipe()
    if not pipe:
        return "/news-placeholder.png"

    try:
        logger.info(f"[Images] 🖌️ Generando imagen para: {prompt[:50]}...")
        
        # Generar (4 pasos = ~2-4 segundos en una 3060)
        image = pipe(prompt, num_inference_steps=4, guidance_scale=0).images[0]
        
        # Convertir a Bytes (WebP para optimización)
        buffer = BytesIO()
        image.save(buffer, format="WEBP", quality=85)
        buffer.seek(0)
        
        # Subir a Supabase Storage
        db = get_supabase()
        filename = f"{news_id or uuid.uuid4()}.webp"
        
        # Subimos al bucket 'news_images' (Debe existir en Supabase)
        try:
            res = db.storage.from_("news_images").upload(
                path=filename,
                file=buffer.getvalue(),
                file_options={"content-type": "image/webp", "upsert": "true"}
            )
            # Retornar URL pública
            return db.storage.from_("news_images").get_public_url(filename)
        except Exception as upload_err:
            logger.error(f"[Images] Error subiendo a Supabase: {upload_err}")
            # Fallback local si falla el storage (para dev)
            os.makedirs("output_images", exist_ok=True)
            image.save(f"output_images/{filename}")
            return f"/news-placeholder.png"

    except Exception as e:
        logger.error(f"[Images] ❌ Fallo en la generación: {e}")
        return "/news-placeholder.png"
