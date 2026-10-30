import asyncio
import logging
import httpx
import re
import email.utils
import xml.etree.ElementTree as ET
from difflib import SequenceMatcher
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from core.database import get_supabase
from core.ai import process_news_with_local_llm
from core.brand_scrapper import fetch_brand_logo_url
from core.images import generate_and_upload_image, download_and_upload_image, get_category_fallback_url
from googlenewsdecoder import new_decoderv1

logger = logging.getLogger("contapyme.news")

# 🛡️ Ventana Máxima de Frescura Editorial (Máximo 5 días de antigüedad)
MAX_ARTICLE_AGE_DAYS = 5

def _validate_editorial_integrity(raw_content: str, ai_content: str, ai_summary: str) -> tuple[bool, str]:
    """
    Escudo Editorial Dual:
    1. Anti-Plagio: Asegura que la redacción sea una obra original (similitud < 0.85).
    2. Anti-Alucinación: Valida coherencia y rechaza invenciones sin respaldo factual.
    """
    if not ai_content or not raw_content:
        return True, "OK"
    
    raw_clean = raw_content.lower().strip()
    ai_clean = ai_content.lower().strip()
    
    # Chequeo de copia casi textual
    sample_raw = raw_clean[:400]
    sample_ai = ai_clean[:400]
    similarity = SequenceMatcher(None, sample_raw, sample_ai).ratio()
    
    if similarity > 0.85:
        return False, f"Riesgo de copia literal (Similitud: {similarity:.2%})"
        
    return True, "OK"

def _extract_semantic_keywords(text: str) -> set:
    """Extrae palabras clave representativas ignorando stopwords y acentos en español."""
    import unicodedata
    stop_words = {
        "para", "como", "este", "esta", "estos", "estas", "entre", "sobre", "tras", "desde",
        "hacia", "hasta", "durante", "segun", "según", "donde", "cuando", "quien", "quién",
        "cual", "cuál", "cuyo", "cuya", "haber", "hacer", "tener", "estar", "poder", "decir",
        "noticia", "diario", "prensa", "region", "región", "chile", "punta", "arenas", "magallanes"
    }
    # Normalizar acentos
    norm = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode('utf-8').lower()
    words = re.findall(r'\b[a-z]{4,}\b', norm)
    return {w for w in words if w not in stop_words}

def _is_semantic_duplicate(headline: str, content: str, existing_articles: list) -> tuple[bool, str]:
    """
    Detecta si una noticia entrante trata sobre el mismo hecho noticioso ya publicado
    analizando la intersección de entidades clave y similitud de tokens (Jaccard).
    """
    c_head_tokens = _extract_semantic_keywords(headline)
    if not c_head_tokens:
        return False, ""
        
    c_content_tokens = _extract_semantic_keywords(content[:800])
    
    for ext in existing_articles:
        ext_title = ext.get("title", "") or ext.get("normalized_title", "")
        ext_head_tokens = _extract_semantic_keywords(ext_title)
        
        if not ext_head_tokens:
            continue
            
        # Jaccard sobre palabras clave del titular
        intersection_title = c_head_tokens.intersection(ext_head_tokens)
        union_title = c_head_tokens.union(ext_head_tokens)
        jaccard_title = len(intersection_title) / len(union_title) if union_title else 0
        
        # Si comparten 2 o más palabras clave específicas en el titular o Jaccard >= 20%
        if len(intersection_title) >= 2 or (jaccard_title >= 0.20 and len(intersection_title) >= 1):
            return True, f"Titular similar a '{ext_title}' ({jaccard_title:.0%})"
            
        # Comparación combinada de titular y cuerpo
        if c_content_tokens:
            ext_content = ext.get("content", "") or ext.get("summary", "")
            ext_content_tokens = _extract_semantic_keywords(ext_content[:800])
            if ext_content_tokens:
                intersection_content = c_content_tokens.intersection(ext_content_tokens)
                union_content = c_content_tokens.union(ext_content_tokens)
                jaccard_content = len(intersection_content) / len(union_content) if union_content else 0
                
                if (len(intersection_title) >= 2 and len(intersection_content) >= 2) or (jaccard_title >= 0.15 and jaccard_content >= 0.25) or len(intersection_content) >= 6:
                    return True, f"Contenido similar a '{ext_title}'"
                    
    return False, ""
# Trace: News Worker Pipeline v8.7.2 - Estabilizado con fallback de imágenes profesionales

# ─── Fuentes de noticias e indicadores 🟢 ──
NEWS_SOURCES = [
    # Regionales (Core)
    {"name": "La Prensa Austral", "url": "https://laprensaaustral.cl/feed/", "type": "regional"},
    {"name": "El Pingüino", "url": "https://news.google.com/rss/search?q=site:elpinguino.com+when:3d&hl=es-419&gl=CL&ceid=CL:es-419", "type": "regional"},
    {"name": "Ovejero Noticias", "url": "https://www.ovejeronoticias.cl/feed/", "type": "regional"},
    {"name": "Google News Magallanes", "url": "https://news.google.com/rss/search?q=Punta+Arenas+Magallanes+when:3d&hl=es-419&gl=CL&ceid=CL:es-419", "type": "regional"},
    # Económicas y Financieras (Link al nicho Contapyme)
    {"name": "Diario Financiero", "url": "https://www.df.cl/site/asociacion/rss/rss_index.xml", "type": "financial"},
    {"name": "Google News Economía", "url": "https://news.google.com/rss/search?q=SII+IPC+Dolar+Chile+Impuestos+Economia+when:3d&hl=es-419&gl=CL&ceid=CL:es-419", "type": "financial"},
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

def _clean_html(html_str: str) -> str:
    """Elimina etiquetas HTML, scripts y ruido publicitario/administrativo de diarios locales."""
    import html
    # Des-escapar entidades HTML como &lt; y &gt; antes de limpiar
    html_str = html.unescape(html_str)
    # 1. Eliminar etiquetas estructurales ruidosas
    html_str = re.sub(r'<(script|style|header|footer|nav|aside|form|search).*?>.*?</\1>', '', html_str, flags=re.DOTALL | re.IGNORECASE)
    # 2. Eliminar etiquetas HTML restantes (incluyendo mal formadas o sin cerrar)
    text = re.sub(r'<[^>]*>?', ' ', html_str)
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
    text = text.replace("&#8211;", "-").replace("&nbsp;", " ").replace("\u2013", "-").replace("\u2014", "-")
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def _parse_article_datetime(pub_date_str: str | None) -> datetime | None:
    """
    Parsea de forma robusta fechas RFC-822, RFC-2822, ISO 8601 o GMT.
    Retorna un datetime con timezone UTC o None si no se puede determinar fehacientemente.
    """
    if not pub_date_str:
        return None

    cleaned = pub_date_str.strip()
    # Intentar RFC 2822 / 822 con email.utils (maneja GMT, EST, +0000, etc.)
    try:
        parsed_tuple = email.utils.parsedate_to_datetime(cleaned)
        if parsed_tuple:
            if parsed_tuple.tzinfo is None:
                parsed_tuple = parsed_tuple.replace(tzinfo=timezone.utc)
            return parsed_tuple.astimezone(timezone.utc)
    except Exception:
        pass

    # Intentar formatos comunes
    formats = [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(cleaned, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            continue

    return None

def _extract_date_from_url(url: str | None) -> datetime | None:
    """Extrae fecha estampada en URLs típicas de medios (/YYYY/MM/DD/, /YYYY-MM-DD/ o /YYYY/MM/)."""
    if not url:
        return None
    # Patrón completo /2026/04/09/ o /2026-04-09/
    match_full = re.search(r'[/-](202[0-9])[/-]([0-1][0-9])[/-]([0-3][0-9])(?:[/-]|\b)', url)
    if match_full:
        try:
            y, m, d = int(match_full.group(1)), int(match_full.group(2)), int(match_full.group(3))
            if 1 <= m <= 12 and 1 <= d <= 31:
                return datetime(y, m, d, tzinfo=timezone.utc)
        except Exception:
            pass
    # Patrón mensual /2026/04/
    match_month = re.search(r'/(202[0-9])/([0-1][0-9])/', url)
    if match_month:
        try:
            y, m = int(match_month.group(1)), int(match_month.group(2))
            if 1 <= m <= 12:
                return datetime(y, m, 1, tzinfo=timezone.utc)
        except Exception:
            pass
    return None

def _extract_date_from_html_meta(raw_html: str) -> datetime | None:
    """
    Extrae la fecha real de publicación desde los metadatos HTML originales (<head>/<body>):
    - <meta property="article:published_time" content="...">
    - <meta name="pubdate" / "publishdate" / "date" / "DC.date.issued" content="...">
    - JSON-LD "datePublished": "..."
    - <time datetime="...">
    """
    if not raw_html:
        return None

    head_sample = raw_html[:60000]
    patterns = [
        r'<meta[^>]+(?:property|name|itemprop)=["\'](?:article:published_time|og:published_time|pubdate|publishdate|date|DC\.date\.issued|datePublished)["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name|itemprop)=["\'](?:article:published_time|og:published_time|pubdate|publishdate|date|DC\.date\.issued|datePublished)["\']',
        r'"datePublished"\s*:\s*"([^"]+)"',
        r'<time[^>]+datetime=["\']([^"\']+)["\']',
    ]

    candidates: list[datetime] = []
    for pat in patterns:
        for m in re.finditer(pat, head_sample, flags=re.IGNORECASE):
            val = m.group(1).strip()
            dt = _parse_article_datetime(val)
            if not dt:
                # Intentar extraer YYYY-MM-DD del inicio del string ISO
                iso_m = re.match(r'^(202[0-9])-([0-1][0-9])-([0-3][0-9])', val)
                if iso_m:
                    try:
                        dt = datetime(int(iso_m.group(1)), int(iso_m.group(2)), int(iso_m.group(3)), tzinfo=timezone.utc)
                    except Exception:
                        pass
            if dt:
                candidates.append(dt)

    if not candidates:
        return None
    # Retornar la fecha más antigua (conservadora) encontrada en los metadatos de publicación
    return min(candidates)

def _extract_og_image_from_html(raw_html: str) -> str | None:
    """
    Extrae la fotografía periodística oficial de alta resolución desde <meta property="og:image">
    o <meta name="twitter:image"> del artículo original.
    """
    if not raw_html:
        return None
    head_sample = raw_html[:60000]
    patterns = [
        r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image|twitter:image:src)["\'][^>]+content=["\'](https?://[^"\']+)["\']',
        r'<meta[^>]+content=["\'](https?://[^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image|twitter:image:src)["\']',
    ]
    for pat in patterns:
        m = re.search(pat, head_sample, flags=re.IGNORECASE)
        if m:
            img_url = m.group(1).strip()
            # Descartar placeholders o logos genéricos de Google News
            if not any(bad in img_url.lower() for bad in ("google.com", "gstatic.com", "placeholder", "logo", "favicon", "avatar")):
                return img_url
    return None

def _has_anachronistic_content(title: str, content: str, now_utc: datetime | None = None) -> tuple[bool, str]:
    """
    Escudo Semántico Anti-Anacronismo:
    Detecta si el titular o el cuerpo de la noticia habla de hitos estacionales/calendario
    que pertenecen a meses pasados respecto a la fecha actual (ej: Operación Renta de abril
    o Fiestas Patrias de septiembre publicadas en octubre).
    """
    if now_utc is None:
        now_utc = datetime.now(timezone.utc)

    combined = f"{title or ''} {content or ''}".lower()
    current_month = now_utc.month

    # 1. Operación Renta / Devolución Anticipada de Abril (válido solo en marzo, abril y mayo)
    if current_month not in (3, 4, 5):
        if (
            "operación renta" in combined
            or "operacion renta" in combined
            or "devolución anticipada" in combined
            or "devolucion anticipada" in combined
            or "29 de abril" in combined
        ):
            return True, "Hito fuera de temporada: Operación Renta / Devolución de abril fuera de ventana marzo-mayo"

    # 2. Fiestas Patrias / Corrida de Garzones de Septiembre (válido solo en agosto, septiembre y primeros 3 días de octubre)
    if current_month not in (8, 9) and not (current_month == 10 and now_utc.day <= 3):
        if "corrida de garzones" in combined or "fiestas patrias" in combined or "18 de septiembre" in combined:
            return True, "Hito fuera de temporada: Fiestas Patrias / Septiembre fuera de ventana"

    # 3. Referencias explícitas a fechas exactas de meses pasados lejanos (> 1 mes atrás)
    month_names = {
        1: "enero", 2: "febrero", 3: "marzo", 4: "abril",
        5: "mayo", 6: "junio", 7: "julio", 8: "agosto",
        9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
    }
    for m_num, m_name in month_names.items():
        # Calcular distancia hacia atrás en meses dentro del mismo año
        if m_num < current_month - 1:
            # Si menciona "el 29 de abril", "este 15 de mayo", "se pagará el ... de abril"
            if re.search(rf'\b(?:el|este|pasado|pagar[aá] el)\s+\d{{1,2}}\s+de\s+{m_name}\b', combined):
                return True, f"Mención explícita de fecha pasada ({m_name}) en mes {current_month}"

    return False, ""

def _validate_and_resolve_article_date(
    pub_date_str: str | None,
    url: str | None,
    html_meta_dt: datetime | None = None,
    title: str = "",
    content: str = "",
    now_utc: datetime | None = None,
    max_age_days: int = MAX_ARTICLE_AGE_DAYS
) -> tuple[bool, datetime | None, str]:
    """
    Resuelve la fecha real de publicación aplicando el principio de Fecha Más Conservadora (Oldest Date Wins)
    entre RSS pubDate, URL slug date y HTML meta date, más validación semántica de anacronismos.
    Jamás hace fallback a datetime.now().
    """
    if now_utc is None:
        now_utc = datetime.now(timezone.utc)

    rss_dt = _parse_article_datetime(pub_date_str)
    url_dt = _extract_date_from_url(url)

    # Si la URL solo tiene precisión mensual (/YYYY/MM/) y corresponde al mes y año actual,
    # no castigar al día 1 si existe rss_dt o html_meta_dt dentro del mismo mes.
    candidates: list[datetime] = []
    if rss_dt:
        candidates.append(rss_dt)
    if html_meta_dt:
        candidates.append(html_meta_dt)
    if url_dt:
        # Verificar si url_dt vino de un patrón mensual /YYYY/MM/ (día 1 a las 00:00)
        is_month_only = bool(url and not re.search(r'[/-](202[0-9])[/-]([0-1][0-9])[/-]([0-3][0-9])(?:[/-]|\b)', url))
        if is_month_only and url_dt.year == now_utc.year and url_dt.month == now_utc.month and (rss_dt or html_meta_dt):
            pass  # Usar rss_dt / html_meta_dt para el día exacto dentro del mes actual
        else:
            candidates.append(url_dt)

    if not candidates:
        return False, None, "Fecha no verificable (sin pubDate, URL date ni HTML meta date)"

    # Regla de Oro: La fecha más antigua (conservadora) gana para derrotar re-indexaciones de Google News
    effective_dt = min(candidates)

    age_delta = now_utc - effective_dt
    if age_delta.days > max_age_days:
        return False, effective_dt, f"Noticia obsoleta ({age_delta.days} días de antigüedad, máx {max_age_days}d)"

    if age_delta.total_seconds() < -86400:
        return False, effective_dt, "Fecha en el futuro inválida (>24h)"

    is_anachronistic, anach_reason = _has_anachronistic_content(title, content, now_utc)
    if is_anachronistic:
        return False, effective_dt, anach_reason

    return True, effective_dt, "OK"

def _slugify(text: str) -> str:
    """Convierte texto en un slug amigable para URL con soporte para acentos españoles."""
    import unicodedata
    normalized = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode('utf-8')
    normalized = normalized.lower()
    normalized = re.sub(r'[^a-z0-9\s]', '', normalized)
    normalized = re.sub(r'\s+', '-', normalized)
    return re.sub(r'-+', '-', normalized).strip('-')

async def _fetch_full_content(url: str, client: httpx.AsyncClient, return_meta: bool = False):
    """Extrae el texto completo de una noticia visitando su URL con decodificación resiliente.
    Si return_meta=True, retorna (cleaned_text, html_meta_dt, final_url, og_image_url).
    """
    try:
        resp = await client.get(url, timeout=15.0, follow_redirects=True)
        if resp.status_code == 200:
            # Resiliencia de codificación: intentar UTF-8 con fallback a ISO-8859-1
            try:
                raw_bytes = resp.content
                try:
                    text_content = raw_bytes.decode('utf-8')
                except UnicodeDecodeError:
                    text_content = raw_bytes.decode('iso-8859-1', errors='replace')
            except Exception:
                text_content = resp.text
            meta_dt = _extract_date_from_html_meta(text_content)
            og_img = _extract_og_image_from_html(text_content)
            final_url = str(resp.url) if resp.url else url
            cleaned = _clean_html(text_content)
            if return_meta:
                return cleaned, meta_dt, final_url, og_img
            return cleaned
    except Exception as e:
        logger.warning(f"[News Worker] ⚠️ No se pudo obtener contenido completo de {url}: {e}")
    if return_meta:
        return "", None, url, None
    return ""

def _is_forbidden_topic(title: str, desc: str = "") -> bool:
    """Filtro estricto que descarta deportes, farándula y sucesos irrelevantes de nicho."""
    text = f"{title or ''} {desc or ''}".lower()
    forbidden = [
        "padel", "pádel", "futbol", "fútbol", "basquetbol", "básquetbol", "voley", "voleibol",
        "balonmano", "ciclismo", "araucania", "araucanía", "judo", "taekwondo", "boxeo",
        "karting", "atletismo", "goleada", "campeonato", "torneo", "semifinal", "deporte",
        "deportes", "deportivo", "liga infantil", "maxibasquetbol", "triatlon", "triatlón",
        "chofer ebrio", "riña", "tiktoker preso", "golpiza", "chofer sorprendido",
        "quebrantamiento de condena", "necrologicas", "necrológicas", "funeraria", "sepelio"
    ]
    return any(re.search(rf"\b{re.escape(w)}\b", text) for w in forbidden)

async def _fetch_from_magallanes_rss(existing_urls: set = None, existing_titles: set = None):
    """Obtiene noticias reales de diarios locales vía RSS con pre-filtrado de alto rendimiento."""
    news = []
    existing_urls = existing_urls or set()
    existing_titles = existing_titles or set()

    async with httpx.AsyncClient(headers=STEALTH_HEADERS, follow_redirects=True, timeout=15.0) as client:
        for source in NEWS_SOURCES:
            try:
                logger.info(f"[News Worker] 🔍 Intentando capturar desde: {source['name']}")
                resp = await client.get(source["url"])
                
                if resp.status_code == 200 and len(resp.text) > 50:
                    root = ET.fromstring(resp.text)
                    items = root.findall('.//item')[:20]
                    for item in items:
                        title_el = item.find('title')
                        desc_el = item.find('description')
                        link_el = item.find('link')
                        
                        title = (title_el.text or "Sin Título").strip()
                        desc = (desc_el.text or "").strip()
                        link = (link_el.text or "").strip()
                        norm_title = title.lower().strip()

                        # 🛡️ 1. Pre-filtro: omitir si ya existe en DB (cero requests innecesarios)
                        if link in existing_urls or norm_title in existing_titles:
                            continue

                        # 🛡️ 2. Pre-filtro: rechazar taxativamente deportes y sucesos fuera de nicho
                        if _is_forbidden_topic(title, desc):
                            logger.info(f"[News Worker] ⏭️ Omitiendo deporte/suceso irrelevante: {title[:50]}...")
                            continue
                        
                        pub_date_el = item.find('pubDate')
                        pub_date = pub_date_el.text if pub_date_el is not None else None
                        
                        # Deep Scraping: Intentar obtener el contenido real, metadatos de fecha y og:image del artículo
                        full_content = ""
                        html_meta_dt = None
                        og_img = None
                        if link:
                            # Decodificar URL si es enlace de Google News
                            if "news.google.com" in link:
                                try:
                                    logger.info(f"[News Worker] 🔗 Decodificando URL de Google News: {link}")
                                    decoded_data = new_decoderv1(link)
                                    if decoded_data.get("status") and decoded_data.get("decoded_url"):
                                        real_url = decoded_data["decoded_url"]
                                        logger.info(f"[News Worker] 🚀 URL Real decodificada: {real_url}")
                                        full_content, html_meta_dt, final_url, og_img = await _fetch_full_content(real_url, client, return_meta=True)
                                        link = final_url or real_url
                                    else:
                                        full_content, html_meta_dt, final_url, og_img = await _fetch_full_content(link, client, return_meta=True)
                                        if final_url and "news.google.com" not in final_url:
                                            link = final_url
                                except Exception as dec_err:
                                    logger.warning(f"[News Worker] ⚠️ Error al decodificar URL de Google News: {dec_err}")
                                    full_content, html_meta_dt, final_url, og_img = await _fetch_full_content(link, client, return_meta=True)
                                    if final_url and "news.google.com" not in final_url:
                                        link = final_url
                            else:
                                logger.info(f"[News Worker] 🔍 Deep Scraping habilitado para: {link}")
                                full_content, html_meta_dt, final_url, og_img = await _fetch_full_content(link, client, return_meta=True)
                                if final_url:
                                    link = final_url
                        
                        news.append({
                            "headline": title if title else "Sin Título",
                            "content": full_content if len(full_content) > 100 else _clean_html(desc),
                            "img": og_img or "/news-placeholder.png",
                            "link": link,
                            "source_name": source["name"],
                            "source_type": source.get("type", "regional"),
                            "pub_date": pub_date,
                            "html_meta_dt": html_meta_dt
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

    # 1. Obtener historial reciente para deduplicación exacta, semántica y visual ANTES del scraping
    existing_articles = []
    existing_urls = set()
    existing_titles = set()
    used_images_in_cycle = set()
    try:
        existing_res = db.table("regional_news").select("source_url, normalized_title, title, summary, content, image_url").order("published_at", desc=True).limit(60).execute()
        existing_articles = existing_res.data or []
        existing_urls = {n["source_url"] for n in existing_articles if n.get("source_url")}
        existing_titles = {n["normalized_title"] for n in existing_articles if n.get("normalized_title")}
        used_images_in_cycle = {n["image_url"] for n in existing_articles[:20] if n.get("image_url")}
    except Exception as e:
        logger.warning(f"[News Worker] ⚠️ No se pudo obtener datos existentes: {e}")

    # 2. Captura de Noticias de Fuentes RSS con pre-filtro activo
    news_pool = await _fetch_from_magallanes_rss(existing_urls=existing_urls, existing_titles=existing_titles)
    
    if not news_pool:
        logger.warning("[News Worker] ⚠️ No se encontraron noticias nuevas en las fuentes RSS.")
        return {"total": 0}

    # 3. Filtrado Inteligente (Deduplicación semántica y relevancia local con priorización de nicho)
    financial_candidates = []
    regional_candidates = []
    seen_uf = False
    now_utc = datetime.now(timezone.utc)

    for raw in news_pool:
        url = raw.get("link")
        headline = raw.get("headline", "")
        norm_headline = headline.lower().strip()
        
        # Omitir si URL ya existe
        if url in existing_urls:
            continue
            
        # Omitir si el título exacto ya fue procesado
        if norm_headline in existing_titles:
            logger.info(f"[News Worker] ⏭️ Omitiendo (Título exacto ya existe): {headline[:50]}...")
            continue

        # 🛡️ ESCUDO DE FRESCURA EDITORIAL MULTICAPA OBLIGATORIO:
        # Validar fecha más conservadora entre RSS, URL y metadatos HTML, más filtro semántico anti-anacronismo
        is_fresh, effective_dt, fresh_reason = _validate_and_resolve_article_date(
            pub_date_str=raw.get("pub_date"),
            url=url,
            html_meta_dt=raw.get("html_meta_dt"),
            title=headline,
            content=raw.get("content", ""),
            now_utc=now_utc,
            max_age_days=MAX_ARTICLE_AGE_DAYS
        )
        if not is_fresh or not effective_dt:
            logger.warning(f"[News Worker] 🛑 Rechazando noticia por escudo temporal ({fresh_reason}): {headline[:55]} | URL: {url}")
            continue

        # Guardar la fecha validada en el dict para persistirla con fidelidad absoluta
        raw["validated_published_at"] = effective_dt.isoformat()

        # Deduplicación Semántica Inteligente (Cruces entre diferentes diarios del mismo hecho)
        is_dup, dup_reason = _is_semantic_duplicate(headline, raw.get("content", ""), existing_articles)
        if is_dup:
            logger.info(f"[News Worker] ⏭️ Omitiendo por duplicidad temática ({dup_reason}): {headline[:50]}...")
            continue

        # Evitar múltiples noticias redundantes sobre el valor de la UF en la misma corrida
        if "uf" in norm_headline or "unidad de fomento" in norm_headline:
            if seen_uf:
                logger.info(f"[News Worker] ⏭️ Omitiendo (Ya procesamos un artículo de la UF en este ciclo): {headline[:50]}...")
                continue
            seen_uf = True

        # Blindaje de Sustancia: Si el contenido es demasiado corto, está vacío o viene con puntos suspensivos (truncado), no califica para noticia premium
        content_text = raw.get("content", "").strip()
        if len(content_text) < 450 or content_text.endswith("...") or content_text.endswith("…"):
            logger.info(f"[News Worker] ⏭️ Omitiendo (Contenido insuficiente o truncado): {headline[:50]}...")
            continue

        # 4. Escudo Regional y de Nicho (Estrategia Híbrida Experta: Cero Deportes ni Crónica Roja)
        forbidden_niche_keywords = [
            "fútbol", "futbol", "básquet", "basquet", "basket", "judo", "motocross", "campeonato",
            "torneo", "medalla", "medallas", "goleada", "clasifica", "deporte", "deportivo",
            "juegos de la araucanía", "araucanía", "colisión", "volcamiento", "lesionadas",
            "agredido", "apuñalado", "ebriedad", "detenido por", "choque vehicular"
        ]
        combined_check = f"{norm_headline} {content_text[:400].lower()}"
        if any(bad_kw in combined_check for bad_kw in forbidden_niche_keywords):
            logger.info(f"[News Worker] 🛑 Omitiendo (Deportes o Crónica Roja fuera de nicho): {headline[:55]}...")
            continue

        region_keywords = ["magallanes", "punta arenas", "natales", "porvenir", "williams", "tierra del fuego", "antártica"]
        financial_keywords = [
            "sii", "ipc", "dólar", "dolar", "impuesto", "finanzas", "economía", "hacienda", 
            "pib", "tasa", "empleo", "dt", "trabajo", "laboral", "renta", "previsional", 
            "cotización", "previred", "vacante", "postula", "contrata", "sercotec", "corfo"
        ]
        
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

        if is_financial:
            financial_candidates.append(raw)
        else:
            regional_candidates.append(raw)

    # 4. Seleccionar candidatos respetando cuotas (Máximo 4 noticias en total: priorizando 2 financieras/laborales)
    candidates = []
    # Tomar hasta 2 financieras/laborales
    candidates.extend(financial_candidates[:2])
    # Completar con regionales (hasta 4)
    needed_regional = 4 - len(candidates)
    candidates.extend(regional_candidates[:needed_regional])
    # Si aún queda espacio, rellenar con las financieras/laborales restantes
    if len(candidates) < 4:
        remaining_financial = financial_candidates[2:]
        needed_more = 4 - len(candidates)
        candidates.extend(remaining_financial[:needed_more])

    if not candidates:
        logger.info("[News Worker] 💤 No hay noticias nuevas que cumplan los criterios de calidad.")
        return {"total": 0}

    # 4. Procesamiento en PARALELO para la IA (Rápido)
    logger.info(f"[News Worker] 🤖 Iniciando redacción paralela de {len(candidates)} noticias...")
    
    async def _news_pipeline_task(raw):
        print(f"[Redactor] Iniciando procesamiento de: {raw['headline']}", flush=True)
        ai_data = await process_news_with_local_llm(raw["headline"], raw["content"])
        return (raw, ai_data)

    tasks = [_news_pipeline_task(c) for c in candidates]
    results = await asyncio.gather(*tasks)

    # 5. Procesamiento SECUENCIAL para Imágenes y DB (Protección de VRAM GPU)
    for raw_news, ai_data in results:
        # Blindajes de calidad y relevancia (Rechazar DEPORTES o IGNORE)
        raw_cat = str(ai_data.get("category", "")).upper() if ai_data else "IGNORE"
        if not ai_data or raw_cat == "IGNORE" or "DEPORTE" in raw_cat or "POLICIAL" in raw_cat:
            logger.info(f"[News Worker] ⏭️ Omitiendo noticia (Sin relevancia institucional / {raw_cat}): {raw_news['headline'][:50]}...")
            continue

        if not ai_data.get("title") or not ai_data.get("full_content"):
            continue

        ai_title = ai_data["title"].strip()
        ai_content = ai_data["full_content"].strip()
        ai_summary = ai_data.get("summary", "").strip()

        # Blindaje Post-IA de Calidad y Sustancia Absoluta
        if len(ai_content) < 350 or len(ai_title) < 10:
            logger.warning(f"[News Worker] ⚠️ Contenido generado por la IA es demasiado corto ({len(ai_content)} caracteres). Omitiendo: {ai_title}")
            continue

        if ai_content.endswith("...") or ai_content.endswith("…") or ai_summary.endswith("...") or ai_summary.endswith("…"):
            logger.warning(f"[News Worker] ⚠️ Contenido o resumen de la IA está incompleto/truncado. Omitiendo: {ai_title}")
            continue

        if "<" in ai_content or ">" in ai_content or "href=" in ai_content:
            logger.warning(f"[News Worker] ⚠️ Contenido de la IA contiene código HTML residual. Omitiendo: {ai_title}")
            continue

        # Validación de Integridad Editorial: Anti-Plagio y Fidelidad Factual
        is_valid_editorial, editorial_reason = _validate_editorial_integrity(raw_news.get("content", ""), ai_content, ai_summary)
        if not is_valid_editorial:
            logger.warning(f"[News Worker] ⚠️ Noticia rechazada por control editorial ({editorial_reason}): {ai_title}")
            continue

        try:
            category = _normalize_category(ai_data.get("category", "MAGALLANES ACTUAL"))
            image_url = None

            # Prioridad 1: Fotografía Periodística Real (og:image HD >= 500x300) con Revelado Óptico Editorial
            original_img = raw_news.get("img")
            if original_img and not original_img.startswith("/") and original_img not in used_images_in_cycle:
                logger.info(f"[News Worker] 📸 Verificando fotografía periodística real HD (og:image): {original_img}")
                image_url = await download_and_upload_image(original_img, min_width=500, min_height=300)
                if image_url:
                    logger.info(f"[News Worker] ✅ Fotografía periodística real HD revelada y subida: {image_url}")

            # Prioridad 2: Generación Fotoperiodística HD con IA (FLUX.1-dev / flux-realism 1536x864 + Revelado Óptico)
            if not image_url or "placeholder" in image_url:
                if ai_data.get("visual_prompt"):
                    logger.info(f"[News Worker] 🎨 Generando Fotoperiodismo HD IA para: {ai_data['title']}")
                    image_url = await generate_and_upload_image(ai_data["visual_prompt"], category=category)

            # Prioridad 3: Logotipo de Marca si aplica (Clearbit Scrapper)
            if not image_url or "placeholder" in image_url:
                brand_name = ai_data.get("brand_name")
                if brand_name:
                    logger.info(f"[News Worker] Encontrada marca '{brand_name}' en la noticia. Buscando logo oficial...")
                    brand_logo_url = await fetch_brand_logo_url(brand_name)
                    if brand_logo_url:
                        image_url = await download_and_upload_image(brand_logo_url)
                        if image_url:
                            logger.info(f"[News Worker] Éxito descargando logo oficial de la marca: {image_url}")
            
            # Prioridad 4: Stock Profesional con Anti-Colisión (Asíncrono y seguro)
            if not image_url or "placeholder" in image_url:
                image_url = await get_category_fallback_url(category, ai_data.get("title", ""), exclude_urls=list(used_images_in_cycle))
                logger.info(f"[News Worker] Usando stock seguro en Supabase para: {category}")

            if image_url:
                used_images_in_cycle.add(image_url)

            # 🛡️ Formatear Fecha Certificada con Estricto Rechazo de Anacronismo (Cero fallback a datetime.now)
            pub_date_iso = raw_news.get("validated_published_at")
            if not pub_date_iso:
                is_fresh_post, parsed_dt, post_reason = _validate_and_resolve_article_date(
                    pub_date_str=raw_news.get("pub_date"),
                    url=raw_news.get("link"),
                    html_meta_dt=raw_news.get("html_meta_dt"),
                    title=ai_title,
                    content=ai_content
                )
                if not is_fresh_post or not parsed_dt:
                    logger.warning(f"[News Worker] 🛑 Abortando persistencia por fecha inválida o anacrónica ({post_reason}): {ai_title}")
                    continue
                pub_date_iso = parsed_dt.isoformat()
            else:
                # Validar que el texto reescrito por la IA tampoco introduzca anacronismos
                is_anach_ai, anach_ai_reason = _has_anachronistic_content(ai_title, ai_content)
                if is_anach_ai:
                    logger.warning(f"[News Worker] 🛑 Abortando persistencia por anacronismo en redacción IA ({anach_ai_reason}): {ai_title}")
                    continue

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
                "updated_at": datetime.now().isoformat(),
                "seo_keywords": ai_data.get("seo_keywords", "contapymepuq, magallanes, punta arenas, chile"),
                "seo_description": ai_data.get("seo_description", ai_data.get("summary", "")[:155])
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
        # 1. Obtener la fecha de la noticia no protegida número 200 (nuestro límite para feeds automáticos)
        res = db.table("regional_news").select("published_at").eq("is_protected", False).order("published_at", desc=True).range(199, 199).execute()
        
        if not res.data:
            # Si hay menos de 200 noticias no protegidas, no hacemos nada
            return
            
        limit_date = res.data[0]["published_at"]
        
        # 2. Borrar todo lo que sea anterior a esa fecha que NO esté protegido
        # Esto preserva comunicados institucionales y notas permanentes
        delete_res = db.table("regional_news").delete().lt("published_at", limit_date).eq("is_protected", False).execute()
        
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
    
    return "MAGALLANES ACTUAL" # Fallback regional

async def stop_news_worker():
    """Detiene el worker limpiamente."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[News Worker] 🛑 Scheduler detenido.")
