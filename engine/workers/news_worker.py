import asyncio
import logging
import httpx
import xml.etree.ElementTree as ET
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from core.database import get_supabase
from core.ai import process_news_with_local_llm
from core.images import generate_and_upload_image

logger = logging.getLogger("contapyme.news")

# ─── Fuentes de noticias de Magallanes ─────────────────────────────────────────
NEWS_SOURCES = [
    {"name": "La Prensa Austral", "url": "https://laprensaaustral.cl/feed/"},
    {"name": "El Pingüino", "url": "https://elpinguino.com/rss"},
]

_scheduler: AsyncIOScheduler | None = None

async def _fetch_from_magallanes_rss():
    """Obtiene noticias reales de diarios locales vía RSS."""
    news = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
        for source in NEWS_SOURCES:
            try:
                resp = await client.get(source["url"], follow_redirects=True)
                if resp.status_code == 200 and len(resp.text) > 50:
                    root = ET.fromstring(resp.text)
                    items = root.findall('.//item')[:3]
                    for item in items:
                        title_el = item.find('title')
                        desc_el = item.find('description')
                        title = title_el.text if title_el is not None else "Sin Título"
                        desc = desc_el.text if desc_el is not None else ""
                        news.append({
                            "headline": title.strip() if title else "Sin Título",
                            "content": desc.strip() if desc else "Noticia regional.",
                            "img": "/news-placeholder.png"
                        })
                    logger.info(f"[News Worker] 📡 Capturadas {len(items)} noticias de {source['name']}")
            except Exception as e:
                logger.error(f"[News Worker] ❌ Fallo en {source['name']}: {e}")
    return news

async def _fetch_and_process_news():
    """
    Recolección de noticias regionales, procesamiento con LLM local 
    y persistencia en Supabase (regional_news).
    """
    db = get_supabase()
    processed_count = 0

    logger.info("[News Worker] Iniciando ciclo de recolección de noticias regionales...")

    # Noticas de RSS
    news_pool = await _fetch_from_magallanes_rss()
    
    # Fallback si RSS falla completamente
    if not news_pool:
        news_pool = [
            {"headline": "Inversión en Hidrógeno Verde en Magallanes supera expectativas", "content": "Proyectos en la región avanzan con fuerza...", "img": "/news-hydrogen.png"},
            {"headline": "Punta Arenas se prepara para el Carnaval de Invierno 2026", "content": "Se anunciaron fechas tentativas...", "img": "/news-horoscopo.png"}
        ]

    logger.info(f"[News Worker] Pool listo con {len(news_pool)} noticias candidate.")

    for raw_news in news_pool:
        try:
            logger.info(f"[News Worker] 🤖 Procesando texto con LLM Local: {raw_news['headline'][:50]}...")
            ai_data = await process_news_with_local_llm(raw_news["headline"], raw_news["content"])
            
            if not ai_data or not ai_data.get("title"):
                continue

            # Generar Imagen con GPU Local (Basado en el prompt de la IA)
            image_url = raw_news["img"] 
            if ai_data.get("visual_prompt"):
                logger.info(f"[News Worker] 🎨 Generando IMAGEN con GPU Local...")
                image_url = await generate_and_upload_image(ai_data["visual_prompt"])

            # Upsert por título mejorado (Requiere UNIQUE en DB)
            db.table("regional_news").upsert({
                "title": ai_data.get("title", raw_news["headline"]),
                "category": ai_data.get("category", "REGIONAL"),
                "content": ai_data.get("summary", raw_news["content"]),
                "image_url": image_url,
                "is_featured": ai_data.get("is_featured", False),
                "published_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }, on_conflict="title").execute()
            
            processed_count += 1
            logger.info(f"[News Worker] ✅ Noticia completa con imagen guardada: {ai_data['title']}")

        except Exception as e:
            logger.error(f"[News Worker] ❌ Error crítico: {e}")

    logger.info(f"[News Worker] Ciclo completado. Total noticias procesadas: {processed_count}")
    return {"total": processed_count}

def get_news_scheduler() -> AsyncIOScheduler:
    """Retorna el scheduler para el worker de noticias."""
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="America/Santiago")
        # Actualización cada 4 horas
        _scheduler.add_job(
            func=_fetch_and_process_news,
            trigger=CronTrigger(hour="*/4", timezone="America/Santiago"),
            id="news_update_job",
            name="Actualización Automática de Noticias con IA",
            replace_existing=True
        )
    return _scheduler

async def start_news_worker():
    """Arranca el worker y ejecuta una carga inicial en segundo plano."""
    scheduler = get_news_scheduler()
    if not scheduler.running:
        scheduler.start()
        logger.info("[News Worker] 🚀 Scheduler iniciado.")
        # Carga inicial inmediata en segundo plano (para no bloquear el arranque del motor)
        asyncio.create_task(_fetch_and_process_news())

async def stop_news_worker():
    """Detiene el worker limpiamente."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[News Worker] 🛑 Scheduler detenido.")
