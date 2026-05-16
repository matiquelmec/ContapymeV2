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
from core.images import generate_and_upload_image, download_and_upload_image, get_category_fallback

logger = logging.getLogger("contapyme.news")
# Trace: News Worker Pipeline v8.7.2 - Estabilizado con fallback de imágenes profesionales

# ─── Fuentes de noticias e indicadores 🟢 ──
NEWS_SOURCES = [
    # Regionales (Core)
    {"name": "La Prensa Austral", "url": "https://laprensaaustral.cl/feed/", "type": "regional"},
    {"name": "El Pingüino", "url": "https://elpinguino.com/rss", "type": "regional"},
    {"name": "Ovejero Noticias", "url": "https://www.ovejeronoticias.cl/feed/", "type": "regional"},
    {"name": "Google News Magallanes", "url": "https://news.google.com/rss/search?q=Punta+Arenas+Magallanes&hl=es-419&gl=CL&ceid=CL:es-419", "type": "regional"},
    # Económicas y Financieras (Link al nicho Contapyme)
    {"name": "Diario Financiero", "url": "https://www.df.cl/site/asociacion/rss/rss_index.xml", "type": "financial"},
    {"name": "Google News Economía", "url": "https://news.google.com/rss/search?q=SII+IPC+Dolar+Chile+Impuestos+Economia&hl=es-419&gl=CL&ceid=CL:es-419", "type": "financial"},
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
                            "source_type": source.get("type", "regional"),
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

    # 1. Captura de Noticias de Fuentes RSS
    news_pool = await _fetch_from_magallanes_rss()
    
    if not news_pool:
        logger.warning("[News Worker] ⚠️ No se encontraron noticias nuevas en las fuentes RSS.")
        return {"total": 0}

    # 2. Obtener duplicados (URLs y Títulos Normalizados) para evitar reprocesar con IA
    try:
        existing_res = db.table("regional_news").select("source_url, normalized_title").execute()
        existing_urls = [n["source_url"] for n in existing_res.data if n.get("source_url")] if existing_res.data else []
        existing_titles = [n["normalized_title"] for n in existing_res.data if n.get("normalized_title")]
    except Exception as e:
        logger.warning(f"[News Worker] ⚠️ No se pudo obtener datos existentes: {e}")
        existing_urls, existing_titles = [], []

    # 3. Filtrado Inteligente (Deduplicación rápida y relevancia local)
    candidates = []
    for raw in news_pool:
        url = raw.get("link")
        headline = raw.get("headline", "")
        norm_headline = headline.lower().strip()
        
        # Omitir si URL ya existe
        if url in existing_urls:
            continue
            
        # Omitir si el título (o algo muy parecido) ya fue procesado
        if norm_headline in existing_titles:
            logger.info(f"[News Worker] ⏭️ Omitiendo (Título similar ya existe): {headline[:50]}...")
            continue

        # Blindaje de Sustancia: Si el contenido es demasiado corto, no hay material para una noticia premium
        if len(raw.get("content", "")) < 200:
            logger.info(f"[News Worker] ⏭️ Omitiendo (Contenido insuficiente): {headline[:50]}...")
            continue

        # 4. Escudo Regional y de Nicho (Estrategia Híbrida Experta)
        region_keywords = ["magallanes", "punta arenas", "natales", "porvenir", "williams", "tierra del fuego", "antártica"]
        financial_keywords = ["sii", "ipc", "dólar", "dolar", "impuesto", "finanzas", "economía", "hacienda", "pib", "tasa", "empleo", "dt", "trabajo"]
        
        is_regional = any(k in norm_headline for k in region_keywords)
        is_financial = any(k in norm_headline for k in financial_keywords)
        
        # Filtro de Rechazo: Si no es regional ni financiero, se descarta (Chau Chuck Norris)
        if not is_regional and not is_financial:
            logger.info(f"[News Worker] ⏭️ Omitiendo (Fuera de Nicho): {headline[:50]}...")
            continue
        
        # Blindaje Extra para Google News (Evitar ruido genérico)
        if "Google News" in raw["source_name"]:
            if not is_regional and not is_financial:
                continue

        candidates.append(raw)
        if len(candidates) >= 4: break # Límite de 4 noticias por ciclo para mantener calidad

    if not candidates:
        logger.info("[News Worker] 💤 No hay noticias nuevas que cumplan los criterios de calidad.")
        return {"total": 0}

    # 4. Procesamiento en PARALELO para la IA (Rápido)
    logger.info(f"[News Worker] 🤖 Iniciando redacción paralela de {len(candidates)} noticias...")
    
    async def _news_pipeline_task(raw):
        print(f"🎨 [Redactor] Iniciando procesamiento de: {raw['headline']}", flush=True)
        ai_data = await process_news_with_local_llm(raw["headline"], raw["content"])
        return (raw, ai_data)

    tasks = [_news_pipeline_task(c) for c in candidates]
    results = await asyncio.gather(*tasks)

    # 5. Procesamiento SECUENCIAL para Imágenes y DB (Protección de VRAM GPU)
    for raw_news, ai_data in results:
        # Blindajes de calidad y relevancia
        if not ai_data or ai_data.get("category") == "IGNORE":
            logger.info(f"[News Worker] ⏭️ Omitiendo noticia (Sin relevancia institucional): {raw_news['headline'][:50]}...")
            continue

        if not ai_data.get("title") or not ai_data.get("full_content"):
            continue

        # Si la IA no redactó nada nuevo (copy-paste literal), descartamos por falta de calidad premium
        if ai_data["full_content"].strip() == raw_news["content"].strip():
            logger.warning(f"[News Worker] ⚠️ IA devolvió contenido idéntico. Omitiendo: {ai_data['title']}")
            continue

        try:
            # Prioridad 1: Estilo Artístico (IA) - Para mantener el estilo Contapyme
            image_url = None
            if ai_data.get("visual_prompt"):
                logger.info(f"[News Worker] 🎨 Generando ESTILO ARTÍSTICO para: {ai_data['title']}")
                image_url = await generate_and_upload_image(ai_data["visual_prompt"])
            
            # Prioridad 2: Imagen Original (RSS) - Si la IA falla
            if not image_url or "placeholder" in image_url:
                original_img = raw_news.get("img")
                if original_img and not original_img.startswith("/"):
                    logger.info(f"[News Worker] 📸 IA falló, usando imagen original del RSS.")
                    image_url = await download_and_upload_image(original_img)
            
            # Prioridad 3: Stock Profesional (Ahora asíncrono y seguro)
            if not image_url or "placeholder" in image_url:
                category = _normalize_category(ai_data.get("category", "MAGALLANES ACTUAL"))
                image_url = await get_category_fallback_url(category)
                logger.info(f"[News Worker] 🖼️ Usando stock seguro en Supabase para: {category}")

            # Formatear Fecha
            pub_date_iso = datetime.now().isoformat()
            if raw_news.get("pub_date"):
                try:
                    pub_date_iso = datetime.strptime(raw_news["pub_date"], "%a, %d %b %Y %H:%M:%S %z").isoformat()
                except: pass

            # Normalizar Categoría para prioridad Smart Mix
            category = _normalize_category(ai_data.get("category", "MAGALLANES ACTUAL"))
            
            # Persistencia en Supabase con blindajes profesionales
            db.table("regional_news").insert({
                "title": ai_data["title"],
                "slug": _slugify(ai_data["title"]),
                "normalized_title": ai_data["title"].lower().strip(),
                "category": category,
                "content": ai_data["full_content"],
                "summary": ai_data.get("summary", ""),
                "image_url": image_url,
                "is_featured": ai_data.get("is_featured", False) or category == "SII / LEGAL", # Autoprioridad
                "source_url": raw_news.get("link", ""),
                "source_name": "Diario Punta Arenas", 
                "published_at": pub_date_iso,
                "updated_at": datetime.now().isoformat()
            }).execute()
            
            # CADENCIA: Pausa de 5 segundos para evitar Rate Limits (Groq 429 / Images)
            logger.info(f"[News Worker] ⏱️ Pausando 5s para respetar límites de API...")
            await asyncio.sleep(5)
            
            processed_count += 1
            logger.info(f"[News Worker] 🚀 ÉXITO EN BASE DE DATOS: {ai_data['title']} ({category})")

        except Exception as e:
            logger.error(f"[News Worker] ❌ Fallo al guardar la noticia '{ai_data['title']}': {e}")
    
    # Al final del ciclo, hacemos limpieza de higiene
    await _maintain_db_hygiene()

    logger.info(f"[News Worker] Ciclo completado. Total noticias procesadas: {processed_count}")
    return {"total": processed_count}

async def _cleanup_junk_news():
    """Limpia las noticias de prueba. Simplificado para evitar errores de timeout."""
    # Desactivado: La IA ya se encarga de no guardar basura.
    # Solo mantenemos la función para no romper referencias, pero sin lógica pesada.
    pass

async def _maintain_db_hygiene():
    """Mantiene solo las últimas 200 noticias usando filtros de fecha para mayor eficiencia."""
    db = get_supabase()
    try:
        # 1. Obtener la fecha de la noticia número 200 (nuestro límite)
        res = db.table("regional_news").select("published_at").order("published_at", desc=True).range(199, 199).execute()
        
        if not res.data:
            # Si hay menos de 200 noticias, no hacemos nada
            return
            
        limit_date = res.data[0]["published_at"]
        
        # 2. Borrar todo lo que sea anterior a esa fecha
        # Esto es una sola query eficiente en el servidor
        delete_res = db.table("regional_news").delete().lt("published_at", limit_date).execute()
        
        if delete_res.data:
            logger.info(f"[News Worker] 🧹 Higiene: Se eliminaron {len(delete_res.data)} noticias antiguas (anteriores a {limit_date}).")
        else:
            logger.info("[News Worker] 🧹 Higiene: Base de datos ya está optimizada.")

    except Exception as e:
        logger.warning(f"[News Worker] ⚠️ Error no-crítico en higiene: {e}")

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
        # Carga inicial inmediata de noticias
        asyncio.create_task(_fetch_and_process_news())

def _normalize_category(cat: str) -> str:
    """Normaliza la categoría de la IA a las permitidas por el Smart Mixer del Frontend."""
    cat = cat.upper().strip()
    
    # Mapeos de Relevancia Contable/Financiera
    if any(k in cat for k in ["SII", "LEGAL", "LEY", "DERECHO", "EMPRESARIAL", "TRIBUTARIO"]):
        return "SII / LEGAL"
    if any(k in cat for k in ["FINAN", "BOLSA", "MERCADO", "IPC", "DÓLAR"]):
        return "FINANZAS"
    if any(k in cat for k in ["ECONOM", "INVERSI", "INDUSTRIA", "MINER", "GAS", "HIDR"]):
        return "ECONOMÍA"
    
    # Mapeos Regionales
    if any(k in cat for k in ["MAGALLANES", "ARENAS", "PUNTA", "WILLIAMS", "NATALES", "PORVENIR", "LOCAL"]):
        return "MAGALLANES ACTUAL"
    if "DEPORTE" in cat:
        return "DEPORTES REGIONALES"
    
    return "MAGALLANES ACTUAL" # Fallback regional

async def stop_news_worker():
    """Detiene el worker limpiamente."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[News Worker] 🛑 Scheduler detenido.")
