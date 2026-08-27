"""
job_worker.py — Motor de Ingesta, IA y Auditoría Legal de Empleos Magallanes
=============================================================================
Plataforma: ContaEmpleos PUQ / Contapymepuq v13.0
Cumplimiento: Artículo 2° Código del Trabajo, Ley 20.609, Schema.org JobPosting

Responsabilidades:
1. Limpieza y sanitización de avisos de fuentes públicas y redes sociales.
2. Auditoría algorítmica de cumplimiento jurídico (Anti-Discriminación y Anti-Fraude).
3. Extracción estructurada mediante LLM (Groq / Llama-3 en modo JSON estricto).
4. Deduplicación semántica cruzada por cargo, empresa y comuna.
5. Persistencia relacional en Supabase con auto-expiración a 21 días.
"""

import os
import re
import json
import logging
import asyncio
import unicodedata
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, Dict, Any, List

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from core.database import get_supabase
from core.ai import groq_chat_completion

logger = logging.getLogger("contaempleos.worker")

# Scheduler global
_jobs_scheduler: Optional[AsyncIOScheduler] = None

# Palabras prohibidas por el Art. 2° del Código del Trabajo y esquemas fraudulentos
DISCRIMINATORY_PATTERNS = [
    # Discriminación por edad
    r"\b(edad\s*(?:entre|de|maxima|minima|debe\s*tener)?\s*\d{2}\s*(?:a|-|y)?\s*\d{2}\s*a[ñn]os?)\b",
    r"\b(menor\s*de\s*\d{2}\s*a[ñn]os?)\b",
    r"\b(mayor\s*de\s*\d{2}\s*a[ñn]os?)\b",
    r"\b(edad\s*limite)\b",
    # Discriminación por género / apariencia / estado civil
    r"\b(buena\s*presencia)\b",
    r"\b(foto\s*(?:obligatoria|actualizada|en\s*el\s*cv)?)\b",
    r"\b(fotograf[ií]a\s*(?:en\s*el\s*cv|adjunta)?)\b",
    r"\b(solter[oa]|casad[oa]|sin\s*hijos?)\b",
    r"\b(solo\s*(?:hombres|mujeres|chilenos?|extranjeros?))\b",
    # Exigencia ilegal de antecedentes comerciales (DICOM)
    r"\b(sin\s*dicom|certificado\s*(?:de\s*)?dicom|bolet[ií]n\s*comercial\s*limpio)\b",
    r"\b(sin\s*deudas?\s*comerciales?)\b",
    # Esquemas fraudulentos / cobros previos
    r"\b(pago\s*previo|costo\s*(?:de\s*)?(?:matr[ií]cula|capacitaci[oó]n|uniforme))\b",
    r"\b(gana\s*dinero\s*(?:f[aá]cil|sin\s*experiencia\s*desde\s*casa))\b",
    r"\b(inversi[oó]n\s*inicial\s*requerida)\b",
]

COMUNAS_MAGALLANES = [
    "Punta Arenas",
    "Puerto Natales",
    "Porvenir",
    "Puerto Williams",
    "Cabo de Hornos",
    "Torres del Paine",
    "Primavera",
    "San Gregorio",
    "Timaukel",
    "Laguna Blanca",
    "Faena / Remoto"
]

SECTORES_PRODUCTIVOS = [
    "Comercio / Zona Franca",
    "Salmonicultura / Marítimo",
    "Hidrógeno Verde / Energía",
    "Turismo / Gastronomía",
    "Administración / Contable",
    "Construcción / Logística",
    "Salud / Servicios",
    "Educación / Social"
]


def _clean_job_text(text: str) -> str:
    """Limpia caracteres especiales, scripts, emojis pesados y URLs extrañas."""
    if not text:
        return ""
    # Quitar tags HTML
    clean = re.sub(r"<[^>]+>", " ", text)
    # Quitar múltiples espacios y saltos excesivos
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def _audit_legal_compliance(text: str) -> Tuple[bool, str]:
    """
    Audita el texto del aviso laboral frente al Art. 2° del Código del Trabajo,
    Ley N° 20.609 y prevención de estafas digitales.
    Retorna (es_valido, motivo_rechazo).
    """
    if not text or len(text.strip()) < 40:
        return False, "Texto de aviso insuficiente o vacío"

    text_lower = text.lower()
    for pattern in DISCRIMINATORY_PATTERNS:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            found_term = match.group(0)
            if "dicom" in found_term or "comercial" in found_term:
                return False, f"Rechazado por Art. 2° Código del Trabajo: Exigencia ilegal de antecedentes comerciales ({found_term})"
            elif "edad" in found_term or "años" in found_term:
                return False, f"Rechazado por Ley 20.609: Criterio discriminatorio de edad ({found_term})"
            elif "presencia" in found_term or "foto" in found_term:
                return False, f"Rechazado por Ley 20.609: Exigencia arbitraria de apariencia/foto ({found_term})"
            elif "pago" in found_term or "inversi" in found_term or "gana dinero" in found_term:
                return False, f"Rechazado por seguridad: Posible esquema fraudulento o cobro previo ({found_term})"
            else:
                return False, f"Rechazado por infracción a normas de no discriminación ({found_term})"

    return True, "OK"


def _slugify_job(title: str, company: str, location: str) -> str:
    """Genera un slug SEO amigable y único para la oferta laboral."""
    combined = f"{title} {company} {location}"
    normalized = unicodedata.normalize("NFKD", combined).encode("ascii", "ignore").decode("utf-8")
    slug = re.sub(r"[^\w\s-]", "", normalized.lower()).strip()
    slug = re.sub(r"[-\s]+", "-", slug)
    return slug[:110].rstrip("-")


def _extract_semantic_tokens(text: str) -> set:
    """Extrae palabras clave significativas para deduplicación."""
    norm = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8").lower()
    tokens = set(re.findall(r"\b[a-z0-9]{4,}\b", norm))
    stopwords = {"para", "como", "esta", "este", "estos", "estas", "sobre", "desde", "hacia", "empresa", "busca", "requiere", "trabajo", "empleo", "oferta"}
    return tokens - stopwords


def _is_duplicate_job(candidate_title: str, candidate_company: str, candidate_location: str, existing_jobs: list) -> bool:
    """Detecta si la oferta laboral ya existe en la base de datos."""
    c_title_tokens = _extract_semantic_tokens(candidate_title)
    c_company_tokens = _extract_semantic_tokens(candidate_company)

    for job in existing_jobs:
        ext_title_tokens = _extract_semantic_tokens(job.get("title", ""))
        ext_company_tokens = _extract_semantic_tokens(job.get("company_name", ""))
        ext_loc = job.get("location", "")

        # Si coincide la comuna y la empresa
        company_match = len(c_company_tokens.intersection(ext_company_tokens)) > 0 if c_company_tokens and ext_company_tokens else True
        loc_match = candidate_location.lower() == ext_loc.lower()

        if company_match and loc_match:
            intersection = c_title_tokens.intersection(ext_title_tokens)
            union = c_title_tokens.union(ext_title_tokens)
            jaccard = len(intersection) / len(union) if union else 0
            if jaccard >= 0.50 or len(intersection) >= 3:
                return True

    return False


async def audit_and_structure_job_with_ai(raw_text: str, source_name: str = "ContaEmpleos PUQ", source_url: str = None) -> Optional[Dict[str, Any]]:
    """
    Procesa un aviso laboral con IA:
    1. Audita el Artículo 2° y no discriminación.
    2. Estructura el aviso en formato normalizado JSON para Google for Jobs.
    """
    # 1. Auditoría de reglas deterministas
    is_compliant, reason = _audit_legal_compliance(raw_text)
    if not is_compliant:
        logger.warning(f"[Job Worker] 🚫 Aviso rechazado: {reason}")
        return None

    # 2. Inferencia con LLM en JSON Mode estricto
    prompt_system = """Eres el Auditor Laboral y Clasificador de Empleos de ContaEmpleos Magallanes (Punta Arenas, Chile).
Tu objetivo es recibir un aviso laboral en texto bruto y devolver ÚNICAMENTE un objeto JSON estrictamente validado.

REGLAS DE ORO JURÍDICAS Y LABORALES (CHILE):
1. Cumplimiento estricto del Artículo 2° del Código del Trabajo (prohibición de discriminación por edad, género, apariencia, o antecedentes comerciales).
2. Si el texto original pide fotos, edad o DICOM, EXCLÚYELOS de los requisitos en el JSON final.
3. Ubicación: Asigna una comuna de Magallanes: 'Punta Arenas', 'Puerto Natales', 'Porvenir', 'Puerto Williams', 'Faena / Remoto', 'Torres del Paine'.
4. Sector: Asigna uno de: 'Comercio / Zona Franca', 'Salmonicultura / Marítimo', 'Hidrógeno Verde / Energía', 'Turismo / Gastronomía', 'Administración / Contable', 'Construcción / Logística', 'Salud / Servicios', 'Educación / Social'.
5. Jornada: Clasifica en: '44 hrs', '40 hrs', 'Turno 7x7', 'Turno 14x14', 'Turno 21x7', 'Part-Time', 'Honorarios'.
6. Tipo Contrato: 'Indefinido', 'Plazo Fijo', 'Faena / Obra', 'Honorarios', 'Práctica'.
7. Salario: Extrae valores numéricos si existen (mínimo y máximo mensual). Si no indica monto, pon salary_min: null, salary_max: null, is_salary_public: false.
8. WhatsApp / Email: Extrae el teléfono o correo para postulación directa.

FORMATO JSON OBLIGATORIO (JSON MODE):
{
  "title": "Título profesional del cargo",
  "company_name": "Nombre de la empresa o 'Empresa Regional'",
  "company_rut": null,
  "location": "Punta Arenas",
  "sector": "Comercio / Zona Franca",
  "job_type": "Indefinido",
  "work_shift": "44 hrs",
  "salary_raw": "$850.000 líquido" o null,
  "salary_min": 850000 o null,
  "salary_max": 950000 o null,
  "salary_period": "MONTH",
  "is_salary_public": true,
  "description": "Descripción formal de las funciones y responsabilidades...",
  "requirements": ["Requisito 1", "Requisito 2"],
  "benefits": ["Colación", "Alojamiento en faena" o beneficios mencionados],
  "contact_email": "rrhh@empresa.cl" o null,
  "contact_whatsapp": "+56912345678" o null,
  "is_compliant": true
}"""

    prompt_user = f"AVISO LABORAL A ESTRUCTURAR:\n{raw_text[:2500]}"

    try:
        response_text = await groq_chat_completion(
            messages=[
                {"role": "system", "content": prompt_system},
                {"role": "user", "content": prompt_user}
            ],
            temperature=0.0,
            json_mode=True
        )

        if not response_text:
            return None

        job_data = json.loads(response_text)
        if not job_data.get("title") or not job_data.get("description"):
            return None

        # Normalizar comuna y sector
        location = job_data.get("location", "Punta Arenas")
        if location not in COMUNAS_MAGALLANES:
            location = "Punta Arenas"

        sector = job_data.get("sector", "Comercio / Zona Franca")
        if sector not in SECTORES_PRODUCTIVOS:
            sector = "Comercio / Zona Franca"

        company_name = job_data.get("company_name", "Empresa Regional")
        title = job_data.get("title")

        # Generar slug
        slug = _slugify_job(title, company_name, location)

        # Enriquecer objeto final
        job_data["location"] = location
        job_data["sector"] = sector
        job_data["company_name"] = company_name
        job_data["slug"] = slug
        job_data["source_name"] = source_name
        job_data["source_url"] = source_url
        job_data["is_verified"] = False
        job_data["status"] = "active"
        job_data["published_at"] = datetime.now(timezone.utc).isoformat()
        job_data["expires_at"] = (datetime.now(timezone.utc) + timedelta(days=21)).isoformat()

        return job_data

    except Exception as e:
        logger.error(f"[Job Worker] Error en extracción estructurada con IA: {e}")
        return None


async def process_and_save_job(raw_text: str, source_name: str = "ContaEmpleos PUQ", source_url: str = None) -> Optional[Dict[str, Any]]:
    """Procesa, valida, deduplica y guarda una oferta en Supabase."""
    cleaned_text = _clean_job_text(raw_text)
    structured = await audit_and_structure_job_with_ai(cleaned_text, source_name=source_name, source_url=source_url)
    if not structured:
        return None

    db = get_supabase()
    # 1. Comprobar duplicados existentes
    recent_jobs = db.table("job_postings").select("id, title, company_name, location").eq("status", "active").limit(50).execute().data or []
    if _is_duplicate_job(structured["title"], structured["company_name"], structured["location"], recent_jobs):
        logger.info(f"[Job Worker] 🔁 Oferta duplicada detectada y descartada: {structured['title']} ({structured['company_name']})")
        return None

    # 2. Inserción en base de datos
    try:
        res = db.table("job_postings").insert(structured).execute()
        if res.data and len(res.data) > 0:
            saved_job = res.data[0]
            logger.info(f"[Job Worker] ✅ Nueva oferta guardada con éxito: {saved_job['title']} en {saved_job['location']}")
            return saved_job
    except Exception as e:
        logger.error(f"[Job Worker] ❌ Error insertando oferta en Supabase: {e}")

    return None


async def cleanup_expired_jobs():
    """Marca como 'expired' todas las ofertas cuya fecha expires_at haya pasado."""
    db = get_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        res = db.table("job_postings").update({"status": "expired"}).lt("expires_at", now_iso).eq("status", "active").execute()
        count = len(res.data) if res.data else 0
        if count > 0:
            logger.info(f"[Job Worker] 🧹 {count} ofertas expiradas actualizadas a 'expired'.")
    except Exception as e:
        logger.error(f"[Job Worker] Error en limpieza de ofertas expiradas: {e}")


def get_jobs_scheduler() -> AsyncIOScheduler:
    """Crea o retorna el scheduler de mantenimiento de empleos."""
    global _jobs_scheduler
    if _jobs_scheduler is None:
        _jobs_scheduler = AsyncIOScheduler(timezone="America/Santiago")
        # Ejecutar limpieza de expirados cada 6 horas
        _jobs_scheduler.add_job(
            func=cleanup_expired_jobs,
            trigger=IntervalTrigger(hours=6),
            id="cleanup_expired_jobs_job",
            name="Limpieza periódica de ofertas expiradas",
            replace_existing=True
        )
        logger.info("[Job Worker] Scheduler de ciclo de vida de empleos configurado (cada 6h).")
    return _jobs_scheduler


async def start_jobs_worker():
    """Inicia el worker de ciclo de vida de empleos."""
    scheduler = get_jobs_scheduler()
    if not scheduler.running:
        scheduler.start()
        logger.info("[Job Worker] 🚀 Worker de empleos iniciado correctamente.")
        # Limpieza inicial
        await cleanup_expired_jobs()


async def stop_jobs_worker():
    """Detiene el worker limpiamente."""
    global _jobs_scheduler
    if _jobs_scheduler and _jobs_scheduler.running:
        _jobs_scheduler.shutdown(wait=False)
        logger.info("[Job Worker] 🛑 Worker de empleos detenido correctamente.")
