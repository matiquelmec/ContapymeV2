import asyncio
import os
import sys
import logging
import time

# Añadir el directorio engine al path
sys.path.append(os.path.join(os.getcwd(), "engine"))

from core.database import get_supabase
from core.ai import process_news_with_local_llm
from core.images import generate_and_upload_image
from workers.news_worker import _fetch_from_magallanes_rss

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("diag")

async def run_diagnostics():
    logger.info("🧪 [DIAG] Iniciando Diagnóstico de Noticiero...")
    
    # 1. Probar RSS
    logger.info("📡 [DIAG] Probando Fuentes RSS (Con Stealth Headers)...")
    try:
        news_pool = await _fetch_from_magallanes_rss()
        logger.info(f"✅ [DIAG] RSS OK. Encontradas {len(news_pool)} noticias potenciales.")
        if not news_pool:
            logger.error("❌ [DIAG] No se encontraron noticias en ninguna fuente.")
            return
    except Exception as e:
        logger.error(f"❌ [DIAG] Error en RSS: {e}")
        return

    # 2. Probar IA (Redacción) con la primera noticia
    sample = news_pool[0]
    logger.info(f"🤖 [DIAG] Probando Redacción IA para: {sample['headline'][:50]}...")
    try:
        start_time = time.time()
        ai_data = await process_news_with_local_llm(sample["headline"], sample["content"])
        logger.info(f"✅ [DIAG] IA OK ({time.time() - start_time:.2f}s). Título reescrito: {ai_data['title']}")
    except Exception as e:
        logger.error(f"❌ [DIAG] Error en IA: {e}")
        return

    # 3. Probar Generación de Imagen (GPU)
    logger.info(f"🎨 [DIAG] Probando Generación de Imagen (SDXL Lightning)...")
    try:
        start_time = time.time()
        img_url = await generate_and_upload_image(ai_data["visual_prompt"])
        logger.info(f"✅ [DIAG] Imagen OK ({time.time() - start_time:.2f}s). URL: {img_url}")
    except Exception as e:
        logger.error(f"❌ [DIAG] Error en Imagen: {e}")
        return

    logger.info("🚀 [DIAG] DIAGNÓSTICO COMPLETADO. Todo parece funcionar individualmente.")

if __name__ == "__main__":
    asyncio.run(run_diagnostics())
