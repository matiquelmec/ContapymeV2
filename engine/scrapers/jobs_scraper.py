"""
jobs_scraper.py — Colector Dinámico y Resiliente de Ofertas Laborales para Magallanes
=====================================================================================
Módulo desacoplado de extracción web para ContaEmpleos PUQ / Contapymepuq.
Responsabilidad única (SRP): Consultar portales de empleo autorizados,
extraer y normalizar convocatorias específicas de la Región de Magallanes
(Punta Arenas, Puerto Natales, Porvenir, Cabo de Hornos).
"""

import asyncio
import logging
import re
from typing import List, Optional, TypedDict
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("contaempleos.scraper")

# Cabeceras estándar de navegación para peticiones benignas y transparentes
SCRAPER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
}

COMUNAS_PERMITIDAS = [
    "punta arenas",
    "puerto natales",
    "porvenir",
    "puerto williams",
    "cabo de hornos",
    "torres del paine",
    "primavera",
    "san gregorio",
    "timaukel",
    "laguna blanca",
    "magallanes"
]


class ScrapedJob(TypedDict):
    title: str
    company_name: str
    location: str
    description: str
    source_name: str
    source_url: str
    contact_email: Optional[str]
    contact_whatsapp: Optional[str]


def parse_chiletrabajos_html(html_content: str, base_url: str = "https://www.chiletrabajos.cl") -> List[ScrapedJob]:
    """
    Parsea el listado HTML de resultados de Chiletrabajos y extrae las ofertas
    verificando estrictamente su pertenencia a la Región de Magallanes.
    """
    jobs: List[ScrapedJob] = []
    if not html_content:
        return jobs

    soup = BeautifulSoup(html_content, "html.parser")
    job_items = soup.select(".job-item")

    for item in job_items:
        try:
            title_el = item.select_one("h2 a, .title a, a.title")
            if not title_el:
                continue

            title = title_el.text.strip()
            href = title_el.get("href", "")
            if href.startswith("/"):
                source_url = f"{base_url}{href}"
            elif href.startswith("http"):
                source_url = href
            else:
                source_url = f"{base_url}/{href}"

            # Extracción de empresa y ubicación de los metadatos
            meta_el = item.select_one(".meta, h3, .job-details, .location")
            meta_text = meta_el.text.strip() if meta_el else ""

            company_name = "Empresa Regional"
            location = "Punta Arenas"

            if meta_text:
                parts = [p.strip() for p in meta_text.split(",") if p.strip()]
                if len(parts) >= 2:
                    company_name = parts[0]
                    location = parts[1]
                elif len(parts) == 1:
                    company_name = parts[0]

            # Filtro geográfico estricto: Descartar ofertas fuera de Magallanes
            combined_geo = f"{location} {title} {meta_text}".lower()
            if not any(comuna in combined_geo for comuna in COMUNAS_PERMITIDAS):
                continue

            # Normalizar ubicación para la base de datos
            norm_location = "Punta Arenas"
            for comuna in COMUNAS_PERMITIDAS:
                if comuna in combined_geo:
                    norm_location = comuna.title()
                    break

            # Extracción del texto / sinopsis
            desc_el = item.select_one("p, .desc, .description")
            description_text = desc_el.text.strip() if desc_el else title

            # Extracción oportunista de contactos en el texto
            email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", description_text)
            contact_email = email_match.group(0).lower() if email_match else None

            wa_match = re.search(r"(?:\+?56\s*9|9)\s*\d{4}\s*\d{4}", description_text)
            contact_whatsapp = re.sub(r"\D", "", wa_match.group(0)) if wa_match else None

            jobs.append({
                "title": title,
                "company_name": company_name,
                "location": norm_location,
                "description": f"{title}. {description_text}. Empresa: {company_name}. Ubicación: {norm_location}.",
                "source_name": f"Chiletrabajos Magallanes / {company_name}",
                "source_url": source_url,
                "contact_email": contact_email,
                "contact_whatsapp": contact_whatsapp
            })
        except Exception as parse_err:
            logger.debug(f"[Scraper] Error parseando item individual: {parse_err}")
            continue

    return jobs


async def fetch_chiletrabajos_magallanes(limit: int = 15) -> List[ScrapedJob]:
    """
    Consulta asíncrona a las ofertas laborales de Punta Arenas y Magallanes en Chiletrabajos.
    Aplica rate limiting ético y timeouts de resiliencia.
    """
    target_urls = [
        "https://www.chiletrabajos.cl/encuentra-un-empleo?2=Punta+Arenas",
        "https://www.chiletrabajos.cl/encuentra-un-empleo?2=Puerto+Natales",
    ]

    collected_jobs: List[ScrapedJob] = []
    seen_urls = set()

    async with httpx.AsyncClient(headers=SCRAPER_HEADERS, timeout=15.0, follow_redirects=True) as client:
        for url in target_urls:
            try:
                resp = await client.get(url)
                if resp.status_code == 200 and resp.text:
                    parsed = parse_chiletrabajos_html(resp.text)
                    for job in parsed:
                        if job["source_url"] not in seen_urls:
                            seen_urls.add(job["source_url"])
                            collected_jobs.append(job)
                            if len(collected_jobs) >= limit:
                                break
                else:
                    logger.warning(f"[Scraper] Chiletrabajos HTTP {resp.status_code} en {url}")

                # Pausa ética entre peticiones
                await asyncio.sleep(1.0)
                if len(collected_jobs) >= limit:
                    break

            except Exception as req_ex:
                logger.warning(f"[Scraper] Fallo de conexión al consultar {url}: {req_ex}")

    logger.info(f"[Scraper] Chiletrabajos Magallanes: {len(collected_jobs)} ofertas válidas extraídas.")
    return collected_jobs


async def fetch_all_magallanes_jobs(limit: int = 15) -> List[ScrapedJob]:
    """
    Punto de entrada unificado para el motor de empleos.
    Orquesta múltiples fuentes públicas y retorna una lista deduplicada por URL.
    """
    all_jobs: List[ScrapedJob] = []
    seen_keys = set()

    try:
        chiletrabajos_jobs = await fetch_chiletrabajos_magallanes(limit=limit)
        for job in chiletrabajos_jobs:
            key = f"{job['title'].lower().strip()}|{job['company_name'].lower().strip()}"
            if key not in seen_keys:
                seen_keys.add(key)
                all_jobs.append(job)
    except Exception as e:
        logger.error(f"[Scraper] Error en colector dinámico de empleos: {e}")

    return all_jobs
