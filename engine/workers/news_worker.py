import asyncio
import logging
import httpx
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from core.database import get_supabase
from core.ai import process_news_with_local_llm
from core.images import generate_and_upload_image

logger = logging.getLogger("contapyme.news")

# ─── Fuentes de noticias de Magallanes 🟢 (Mejorado con Google News Fallback) ──
NEWS_SOURCES = [
    {"name": "La Prensa Austral", "url": "https://laprensaaustral.cl/feed/"},
    {"name": "El Pingüino", "url": "https://elpinguino.com/rss"},
    {"name": "Ovejero Noticias", "url": "https://www.ovejeronoticias.cl/feed/"},
    {"name": "Google News Magallanes", "url": "https://news.google.com/rss/search?q=Punta+Arenas+Magallanes&hl=es-419&gl=CL&ceid=CL:es-419"},
]

# Cabeceras de Navegador Real (Stealth) para evitar bloqueos 403
STEALTH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
    "Accept-Language": "es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://www.google.com/",
    "Cache-Control": "max-age=0",
    "Connection": "keep-alive"
}

_scheduler: AsyncIOScheduler | None = None

def _clean_html(html: str) -> str:
    """Elimina etiquetas HTML, scripts y ruido publicitario/administrativo de diarios locales."""
    # 1. Eliminar etiquetas estructurales ruidosas
    html = re.sub(r'<(script|style|header|footer|nav|aside|form|search).*?>.*?</\1>', '', html, flags=re.DOTALL | re.IGNORECASE)
    # 2. Eliminar etiquetas HTML restantes
    text = re.sub(r'<[^>]+>', ' ', html)
    # 3. Eliminar frases de basura (Footers, Metadatos de diarios)
    junk_patterns = [
        r"Waldo Seguel \d+, Punta Arenas", r"Tel\.\s?\+\d+", r"©\s?\d+-\d+", r"Empresa de Publicaciones",
        r"La Prensa Austral", r"El Pingüino", r"Ovejero Noticias", r"Necrológicas", r"Waldo Seguel",
        r"Compartir esta noticia", r"Twittear", r"Visitas", r"IR ARRIBA", r"Waldo Seguel \d+",
        r"Nacional Internacional Tendencias Deportes", r"Crónica Editorial Espectaculos",
        r"Necrológicas .*? Pa' Callao Vida Social", r"Waldo Seguel .*? Chile",
        r"Facebook Twitter Google\+ LinkedIn Pinterest .*? Reddit VKontakte"
    ]
    for pattern in junk_patterns:
        text = re.sub(pattern, " ", text, flags=re.IGNORECASE)

    # 4. Colapsar espacios y limpiar entidades
    text = text.replace("&#8211;", "-").replace("&nbsp;", " ")
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def _slugify(text: str) -> str:
    """Convierte texto en un slug amigable para URL."""
    # Convertir a minúsculas
    text = text.lower()
    # Eliminar caracteres no alfanuméricos
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    # Reemplazar espacios por guiones
    text = re.sub(r'\s+', '-', text)
    # Eliminar guiones duplicados
    text = re.sub(r'-+', '-', text).strip('-')
    return text

async def _fetch_full_content(url: str, client: httpx.AsyncClient) -> str:
    """Extrae el texto completo de una noticia visitando su URL."""
    try:
        resp = await client.get(url, timeout=15.0, follow_redirects=True)
        if resp.status_code == 200:
            return _clean_html(resp.text)
    except Exception as e:
        logger.warning(f"[News Worker] ⚠️ No se pudo obtener contenido completo de {url}: {e}")
    return ""

async def _fetch_from_magallanes_rss():
    """Obtiene noticias reales de diarios locales vía RSS."""
    news = []
    async with httpx.AsyncClient(headers=STEALTH_HEADERS, follow_redirects=True, timeout=15.0) as client:
        for source in NEWS_SOURCES:
            try:
                logger.info(f"[News Worker] 🔍 Intentando capturar desde: {source['name']}")
                resp = await client.get(source["url"])
                
                if resp.status_code == 200 and len(resp.text) > 50:
                    root = ET.fromstring(resp.text)
                    items = root.findall('.//item')[:20] # Aumentamos alcance por fuente
                    for item in items:
                        title_el = item.find('title')
                        desc_el = item.find('description')
                        link_el = item.find('link')
                        
                        title = title_el.text if title_el is not None else "Sin Título"
                        desc = desc_el.text if desc_el is not None else ""
                        link = link_el.text if link_el is not None else ""
                        
                        pub_date_el = item.find('pubDate')
                        pub_date = pub_date_el.text if pub_date_el is not None else None
                        
                        # Deep Scraping: Intentar obtener el contenido real del artículo
                        full_content = ""
                        if link:
                            logger.info(f"[News Worker] 🔍 Deep Scraping habilitado para: {link}")
                            full_content = await _fetch_full_content(link, client)
                        
                        news.append({
                            "headline": title.strip() if title else "Sin Título",
                            "content": full_content if len(full_content) > 100 else desc.strip(),
                            "img": "/news-placeholder.png",
                            "link": link,
                            "source_name": source["name"],
                            "pub_date": pub_date
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
            {"headline": "Inversión en Hidrógeno Verde en Magallanes supera expectativas", "content": "Proyectos en la región avanzan con fuerza...", "img": "/news-hydrogen.png", "link": ""},
            {"headline": "Punta Arenas se prepara para el Carnaval de Invierno 2026", "content": "Se anunciaron fechas tentativas...", "img": "/news-horoscopo.png", "link": ""}
        ]

    logger.info(f"[News Worker] Pool listo con {len(news_pool)} noticias candidatas.")

    # 1. Obtener URLs ya procesadas para evitar duplicados (sin límite de 50, buscando por source_url)
    try:
        existing_urls_res = db.table("regional_news").select("source_url").execute()
        existing_urls = [n["source_url"] for n in existing_urls_res.data if n.get("source_url")] if existing_urls_res.data else []
    except Exception as e:
        logger.warning(f"[News Worker] ⚠️ No se pudo obtener URLs existentes: {e}")
        existing_urls = []

    # 3. Procesar individualmente (Limitado a 4 de ALTA CALIDAD para rapidez)
    for raw_news in news_pool[:4]:
        print(f"🎨 [Redactor] Iniciando procesamiento de: {raw_news.get('title')}", flush=True)
        try:
            # 2. Verificar si la URL ya existe ANTES de procesar con IA/GPU
            if raw_news.get("link") in existing_urls:
                logger.info(f"[News Worker] ⏭️ Omitiendo (URL ya procesada): {raw_news['link']}")
                continue

            logger.info(f"[News Worker] 🤖 Procesando texto con LLM Local: {raw_news['headline'][:50]}...")
            ai_data = await process_news_with_local_llm(raw_news["headline"], raw_news["content"])
            
            # BLINDAJE: Si la IA no generó el contenido completo o un titular válido, omitimos.
            # No queremos "basura" o noticias crudas de RSS en el portal.
            if not ai_data or not ai_data.get("title") or not ai_data.get("full_content"):
                logger.warning(f"[News Worker] ⚠️ IA falló al reescribir la noticia '{raw_news['headline']}'. Omitiendo para preservar calidad.")
                continue
            
            # Verificación de "Originalidad": Si el contenido IA es idéntico al crudo, algo falló.
            if ai_data["full_content"].strip() == raw_news["content"].strip():
                logger.warning(f"[News Worker] ⚠️ IA devolvió contenido idéntico al original. Omitiendo por falta de redacción premium.")
                continue

            # 3. Generar Imagen con GPU Local (Estilo Artístico Profesional)
            image_url = raw_news["img"] 
            if ai_data.get("visual_prompt"):
                logger.info(f"[News Worker] 🎨 Generando IMAGEN ARTÍSTICA para: {ai_data['title']}")
                image_url = await generate_and_upload_image(ai_data["visual_prompt"])

            # 4. Insertar la noticia (Usamos la fecha del RSS si existe, sino ahora)
            pub_date_iso = datetime.now().isoformat()
            if raw_news.get("pub_date"):
                try:
                    # Ejemplo: Wed, 18 Mar 2026 21:08:09 +0000
                    pub_date_iso = datetime.strptime(raw_news["pub_date"], "%a, %d %b %Y %H:%M:%S %z").isoformat()
                except:
                    pass

            db.table("regional_news").insert({
                "title": ai_data.get("title", raw_news["headline"]),
                "slug": _slugify(ai_data.get("title", raw_news["headline"])),
                "normalized_title": ai_data.get("title", "").lower().strip(),
                "category": ai_data.get("category", "REGIONAL"),
                "content": ai_data["full_content"], # Garantizado por el blindaje superior
                "summary": ai_data.get("summary", ""),
                "image_url": image_url,
                "is_featured": ai_data.get("is_featured", False),
                "source_url": raw_news.get("link", ""), # RESTAURADO: Necesario para deduplicación interna
                "source_name": "Diario Punta Arenas", # Atribución interna del portal
                "published_at": pub_date_iso,
                "updated_at": datetime.now().isoformat()
            }).execute()
            
            processed_count += 1
            existing_urls.append(raw_news.get("link"))
            logger.info(f"[News Worker] ✅ Noticia guardada: {ai_data['title']}")

        except Exception as e:
            # Si falla por conflicto de título (aunque la URL sea distinta), lo manejamos
            if "duplicate key value violates unique constraint" in str(e).lower():
                logger.warning(f"[News Worker] ⚠️ Conflicto de título, omitiendo: {raw_news['headline']}")
            else:
                logger.error(f"[News Worker] ❌ Error procesando noticia: {e}")

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
