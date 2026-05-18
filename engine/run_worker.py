"""
run_worker.py — Servicio de Procesos de Fondo (Schedulers)
==========================================================
Este proceso ejecuta los trabajadores de noticias con IA e indicadores
económicos de forma independiente a la API principal.
"""

import asyncio
import logging
import signal
from workers.indicators_scheduler import start_scheduler, stop_scheduler
from workers.news_worker import start_news_worker, stop_news_worker
from workers.track_id_worker import run_worker as start_dte_worker

# Configuración de Logging Profesional
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("contapyme.worker_service")

async def main():
    logger.info("==============================================")
    logger.info("  CONTAPYME V2 - TRABAJADOR DE FONDO (WORKER) ")
    logger.info("==============================================")
    
    # 1. Iniciar el motor de indicadores económicos
    await start_scheduler()
    
    # 2. Iniciar el motor de noticias regionales con IA
    await start_news_worker()
    
    # 3. Iniciar vigilante de Track ID DTE (SII)
    dte_task = asyncio.create_task(start_dte_worker())
    
    logger.info("✅ Schedulers y DTE Worker activos y monitoreando (Pulsa Ctrl+C para detener)")
    
    try:
        # Mantener el proceso vivo indefinidamente
        while True:
            await asyncio.sleep(3600)
    except (asyncio.CancelledError, KeyboardInterrupt):
        logger.info("🛑 Deteniendo servicios de fondo...")
    finally:
        await stop_scheduler()
        await stop_news_worker()
        logger.info("✨ Trabajador cerrado limpiamente.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
