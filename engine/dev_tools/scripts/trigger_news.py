import asyncio
import logging
import sys
import os

# Añadir el directorio raíz al path para poder importar core.*
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from workers.news_worker import _fetch_and_process_news

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trigger")

async def main():
    logger.info("🚀 Iniciando disparo manual de noticias...")
    result = await _fetch_and_process_news()
    logger.info(f"✨ Ciclo completado. Resultado: {result}")

if __name__ == "__main__":
    asyncio.run(main())
