"""
jobs_scraper.py — Colector Dinámico y Resiliente de Ofertas Laborales para Magallanes
=====================================================================================
Módulo desacoplado de extracción web para ContaEmpleos PUQ / Contapymepuq.
Responsabilidad única (SRP): Consultar portales de empleo autorizados,
extraer y normalizar convocatorias específicas de la Región de Magallanes
(Punta Arenas, Puerto Natales, Porvenir, Cabo de Hornos), exigiendo SIEMPRE
un canal directo y verificado de postulación (email o WhatsApp).
"""

import asyncio
import logging
import re
from typing import List, Optional, Tuple, TypedDict
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("contaempleos.scraper")

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

IGNORED_EMAIL_DOMAINS = [
    "popper", "sentry", "chiletrabajos", "example", "cloudflare", "w3.org", "schema.org", "google"
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
    Parsea el listado HTML de resultados de Chiletrabajos y extrae las ofertas preliminares
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

            combined_geo = f"{location} {title} {meta_text}".lower()
            if not any(comuna in combined_geo for comuna in COMUNAS_PERMITIDAS):
                continue

            norm_location = "Punta Arenas"
            for comuna in COMUNAS_PERMITIDAS:
                if comuna in combined_geo:
                    norm_location = comuna.title()
                    break

            desc_el = item.select_one("p, .desc, .description")
            description_text = desc_el.text.strip() if desc_el else title

            # Extracción limpia de correos en el snippet
            email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", description_text)
            raw_email = email_match.group(0).lower() if email_match else None
            contact_email = raw_email if raw_email and not any(ign in raw_email for ign in IGNORED_EMAIL_DOMAINS) else None

            # Extracción limpia de teléfonos en el snippet (mínimo 8 dígitos)
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


async def fetch_job_detail_contacts(client: httpx.AsyncClient, job_url: str) -> Tuple[Optional[str], Optional[str], str]:
    """
    Ingresa a la página individual de la vacante, elimina scripts y metadatos del sitio,
    y extrae el correo o WhatsApp genuino que el empleador haya colocado en el cuerpo del aviso.
    """
    try:
        resp = await client.get(job_url, timeout=12.0)
        if resp.status_code == 200 and resp.text:
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Limpiar tags que puedan contener atributos o scripts ajenos al aviso
            for tag in soup(["script", "style", "header", "footer", "nav", "meta", "head", "noscript"]):
                tag.decompose()

            # Extraer párrafos del cuerpo del aviso exclusivamente
            body_paragraphs = soup.select("p, .description, table")
            body_text = " ".join([p.text.strip() for p in body_paragraphs if len(p.text.strip()) > 15])

            # Buscar correos legítimos en el cuerpo del aviso
            all_emails = re.findall(r"[\w\.-]+@[\w\.-]+\.\w+", body_text)
            valid_emails = [
                e.lower().strip() for e in all_emails
                if not any(ign in e.lower() for ign in IGNORED_EMAIL_DOMAINS)
                and len(e) > 5 and "." in e
            ]
            email = valid_emails[0] if valid_emails else None

            # Buscar celular o WhatsApp en el cuerpo del aviso (debe ser chileno de 9 dígitos)
            wa_match = re.search(r"(?:\+?56\s*9|(?:\b9))\s*\d{4}\s*\d{4}\b", body_text)
            whatsapp = re.sub(r"\D", "", wa_match.group(0)) if wa_match else None
            # Asegurar que sea celular chileno válido (9 dígitos o 11 con código país)
            if whatsapp and len(whatsapp) not in (8, 9, 11):
                whatsapp = None

            return email, whatsapp, body_text[:1200]
    except Exception as e:
        logger.debug(f"[Scraper] Error obteniendo detalle de {job_url}: {e}")

    return None, None, ""


async def fetch_chiletrabajos_magallanes(limit: int = 15) -> List[ScrapedJob]:
    """
    Consulta asíncrona a las ofertas laborales de Punta Arenas y Magallanes.
    Inspecciona cada detalle y DESCARTA INMEDIATAMENTE aquellas ofertas
    que no tengan correo corporativo ni WhatsApp explícito del empleador.
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
                    parsed_candidates = parse_chiletrabajos_html(resp.text)
                    for candidate in parsed_candidates:
                        if candidate["source_url"] in seen_urls:
                            continue

                        email = candidate["contact_email"]
                        whatsapp = candidate["contact_whatsapp"]
                        detail_desc = candidate["description"]

                        # Si la sinopsis de la lista no traía contacto, inspeccionar el cuerpo de la oferta
                        if not email and not whatsapp:
                            await asyncio.sleep(0.3)
                            ext_email, ext_wa, ext_desc = await fetch_job_detail_contacts(client, candidate["source_url"])
                            if ext_email:
                                email = ext_email
                            if ext_wa:
                                whatsapp = ext_wa
                            if ext_desc:
                                detail_desc = f"{candidate['title']}. {ext_desc} Empresa: {candidate['company_name']}."

                        # 🛑 REGLA INQUEBRANTABLE: Si no tiene email ni WhatsApp directo, SE RECHAZA
                        if not email and not whatsapp:
                            continue

                        candidate["contact_email"] = email
                        candidate["contact_whatsapp"] = whatsapp
                        candidate["description"] = detail_desc
                        seen_urls.add(candidate["source_url"])
                        collected_jobs.append(candidate)
                        logger.info(f"[Scraper] ✅ Vacante Aprobada con Contacto Directo: '{candidate['title']}' ({candidate['company_name']}) -> {email or whatsapp}")

                        if len(collected_jobs) >= limit:
                            break
                else:
                    logger.warning(f"[Scraper] Chiletrabajos HTTP {resp.status_code} en {url}")

                await asyncio.sleep(0.8)
                if len(collected_jobs) >= limit:
                    break

            except Exception as req_ex:
                logger.warning(f"[Scraper] Fallo de conexión al consultar {url}: {req_ex}")

    logger.info(f"[Scraper] Chiletrabajos Magallanes: {len(collected_jobs)} ofertas 100% verificadas con contacto directo.")
    return collected_jobs


async def fetch_all_magallanes_jobs(limit: int = 15) -> List[ScrapedJob]:
    """Punto de entrada unificado para el motor de empleos."""
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
