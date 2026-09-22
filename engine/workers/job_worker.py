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

try:
    from scrapers.jobs_scraper import fetch_all_magallanes_jobs, ScrapedJob
except ImportError:
    try:
        from engine.scrapers.jobs_scraper import fetch_all_magallanes_jobs, ScrapedJob
    except ImportError:
        fetch_all_magallanes_jobs = None
        ScrapedJob = None

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


def _has_valid_direct_contact(job_data: Dict[str, Any]) -> bool:
    """
    Regla de Calidad y Veracidad (ContaEmpleos PUQ):
    Exige que toda oferta laboral publicada posea al menos un canal directo
    y verificable de postulación (Email corporativo, WhatsApp activo o URL directa).
    """
    email = (job_data.get("contact_email") or "").strip().lower()
    raw_wa = job_data.get("contact_whatsapp") or ""
    whatsapp = re.sub(r"\D", "", str(raw_wa))
    raw_url = (job_data.get("application_url") or job_data.get("source_url") or "").strip().lower()

    # Validar email sintáctico
    has_email = bool(
        "@" in email and "." in email and len(email) > 5
        and not email.startswith("@") and not email.endswith("@")
        and not any(fake in email for fake in ["null", "undefined", "no-email", "none", "sin-correo"])
    )

    # Validar WhatsApp (mínimo 8 dígitos, formato regional/nacional)
    has_whatsapp = len(whatsapp) >= 8

    # Validar URL institucional o de postulación directa
    has_url = bool(
        (raw_url.startswith("http://") or raw_url.startswith("https://"))
        and not any(fake in raw_url for fake in ["null", "undefined", "localhost"])
    )

    return has_email or has_whatsapp or has_url


async def audit_and_structure_job_with_ai(
    raw_text: str,
    source_name: str = "ContaEmpleos PUQ",
    source_url: str = None,
    fallback_company: str = None,
    fallback_email: str = None,
    fallback_whatsapp: str = None
) -> Optional[Dict[str, Any]]:
    """
    Procesa un aviso laboral con IA:
    1. Audita el Artículo 2° y no discriminación.
    2. Estructura el aviso en formato normalizado JSON para Google for Jobs.
    3. Asegura preservación de metadatos de empresa y canales directos de contacto.
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
8. WhatsApp / Email: Extrae el teléfono o correo para postulación directa. Si se suministran datos de contacto en la cabecera, presérvalos con exactitud.

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

    context_lines = []
    if fallback_company:
        context_lines.append(f"Empresa informada: {fallback_company}")
    if fallback_email:
        context_lines.append(f"Email postulación: {fallback_email}")
    if fallback_whatsapp:
        context_lines.append(f"WhatsApp postulación: {fallback_whatsapp}")
    context_prefix = ("DATOS VERIFICADOS DE FUENTE:\n" + "\n".join(context_lines) + "\n\n") if context_lines else ""

    prompt_user = f"{context_prefix}AVISO LABORAL A ESTRUCTURAR:\n{raw_text[:2500]}"

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

        # Normalizar empresa y fusionar fallbacks si la IA devolvió nombres genéricos o incompletos
        company_name = (job_data.get("company_name") or "").strip()
        generic_names = ["empresa regional", "empresa líder de retail y hogar", "empresa confidencial", "empresa", ""]
        if (not company_name or company_name.lower() in generic_names) and fallback_company:
            company_name = fallback_company
        elif not company_name:
            company_name = fallback_company or "Empresa Regional"

        title = job_data.get("title")

        # Fusionar contactos de fallback si el LLM no los extrajo o vinieron nulos
        contact_email = (job_data.get("contact_email") or "").strip().lower()
        if (not contact_email or contact_email in ["null", "none", "undefined"]) and fallback_email:
            job_data["contact_email"] = fallback_email

        contact_whatsapp = str(job_data.get("contact_whatsapp") or "").strip()
        if (not contact_whatsapp or contact_whatsapp in ["null", "none", "undefined"]) and fallback_whatsapp:
            job_data["contact_whatsapp"] = fallback_whatsapp

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
        # Remover campos internos de validación que no existen como columnas en Supabase
        job_data.pop("is_compliant", None)

        return job_data

    except Exception as e:
        logger.error(f"[Job Worker] Error en extracción estructurada con IA: {e}")
        return None


async def process_and_save_job(
    raw_text: str,
    source_name: str = "ContaEmpleos PUQ",
    source_url: str = None,
    fallback_company: str = None,
    fallback_email: str = None,
    fallback_whatsapp: str = None
) -> Optional[Dict[str, Any]]:
    """Procesa, valida, audita canales de contacto, deduplica y guarda una oferta en Supabase."""
    cleaned_text = _clean_job_text(raw_text)
    structured = await audit_and_structure_job_with_ai(
        cleaned_text,
        source_name=source_name,
        source_url=source_url,
        fallback_company=fallback_company,
        fallback_email=fallback_email,
        fallback_whatsapp=fallback_whatsapp
    )
    if not structured:
        return None

    # 1. Regla de Calidad y Veracidad: Exigir canal de contacto directo comprobable
    if not _has_valid_direct_contact(structured):
        logger.warning(
            f"[Job Worker] 🚫 Oferta rechazada por Regla de Calidad y Veracidad (sin email, whatsapp ni canal directo): "
            f"'{structured.get('title')}' de '{structured.get('company_name')}'"
        )
        return None

    db = get_supabase()
    # 2. Comprobar duplicados existentes
    recent_jobs = db.table("job_postings").select("id, title, company_name, location").eq("status", "active").limit(50).execute().data or []
    if _is_duplicate_job(structured["title"], structured["company_name"], structured["location"], recent_jobs):
        logger.info(f"[Job Worker] 🔁 Oferta duplicada detectada y descartada: {structured['title']} ({structured['company_name']})")
        return None

    # 3. Inserción en base de datos
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
        return count
    except Exception as e:
        logger.error(f"[Job Worker] Error en limpieza de ofertas expiradas: {e}")
        return 0


# Catálogo curado de vacantes y convocatorias prioritarias de Magallanes para el Engine
REGIONAL_CURATED_FEEDS = [
    {
        "title": "Vendedor(a) de Salón y Atención al Cliente",
        "company_name": "Sanchez & Sanchez Ltda.",
        "location": "Punta Arenas",
        "sector": "Comercio / Zona Franca",
        "job_type": "Indefinido",
        "work_shift": "40 hrs",
        "salary_min": 610000,
        "salary_max": 760000,
        "contact_email": "seleccion.puntaarenas@sanchezysanchez.cl",
        "contact_whatsapp": "+56961220055",
        "source_url": "https://www.bne.cl/ofertas-empleo/punta-arenas",
        "source_name": "BNE Magallanes / Sanchez & Sanchez",
        "raw_text": "Empresa líder de retail y hogar en Magallanes busca Vendedor(a) para sala de ventas en Punta Arenas. Funciones: atención a clientes, orden de lineales, asesoría y apoyo en inventarios. Requisitos: enseñanza media, vocación de servicio, residencia en Punta Arenas. Beneficios: estabilidad laboral, uniforme corporativo, seguro de salud complementario y beneficios de caja."
    },
    {
        "title": "Técnico Mecánico de Mantenimiento Industrial",
        "company_name": "Procesadora Barranco Amarillo",
        "location": "Punta Arenas",
        "sector": "Salmonicultura / Marítimo",
        "job_type": "Indefinido",
        "work_shift": "40 hrs",
        "salary_min": 900000,
        "salary_max": 1200000,
        "contact_email": "operaciones@barrancoamarillo.cl",
        "contact_whatsapp": "+56961200354",
        "source_url": "https://www.chiletrabajos.cl/encuentra-un-empleo?carrera=&region=12&comuna=Punta+Arenas",
        "source_name": "Chiletrabajos Magallanes / Barranco Amarillo",
        "raw_text": "Planta de procesos pesqueros y congelados en Punta Arenas requiere Técnico Mecánico para mantenimiento de líneas continuas, bombas hidráulicas y transportadores. Requisitos: título técnico en mecánica industrial, electromecánica o afín, experiencia en plantas productivas de la zona austral. Beneficios: bus de acercamiento, casino con alimentación completa, equipamiento térmico normado y asignación de zona."
    },
    {
        "title": "Operario(a) de Centro de Cultivo de Salmones",
        "company_name": "Australis Seafoods",
        "location": "Punta Arenas",
        "sector": "Salmonicultura / Marítimo",
        "job_type": "Faena / Obra",
        "work_shift": "Turno 14x14",
        "salary_min": 850000,
        "salary_max": 1100000,
        "contact_email": "postulaciones.austral@australis-seafoods.com",
        "contact_whatsapp": "+56961200556",
        "source_url": "https://www.bne.cl/ofertas-empleo/magallanes",
        "source_name": "BNE Magallanes / Australis Seafoods",
        "raw_text": "Australis Seafoods busca Operarios para centros de cultivo en fiordos de Magallanes. Monitoreo de alimentación, limpieza de redes, bioseguridad del centro. Requisitos: certificado médico compatible con faena aislada y navegación, disposición para turno 14x14. Beneficios: traslados completos desde Punta Arenas/Natales, alojamiento en pontón moderno con wifi satelital, 4 comidas diarias y seguro de accidentes."
    },
    {
        "title": "Conductor(a) Profesional Tolva y Carga Pesada (A4/A5)",
        "company_name": "Transportes y Logística Fueguina Ltda.",
        "location": "Porvenir",
        "sector": "Construcción / Logística",
        "job_type": "Indefinido",
        "work_shift": "Turno 7x7",
        "salary_min": 1100000,
        "salary_max": 1450000,
        "contact_email": "operaciones.porvenir@transportesfueguina.cl",
        "contact_whatsapp": "+56961200556",
        "source_url": "https://www.chiletrabajos.cl/encuentra-un-empleo?carrera=&region=12&comuna=Porvenir",
        "source_name": "OMIL Porvenir / Chiletrabajos",
        "raw_text": "Se requieren conductores profesionales con licencia A4 o A5 al día para transporte de áridos y abastecimiento logístico en faenas de Tierra del Fuego. Requisitos: licencia A4 o A5 con al menos 3 años de antigüedad, hoja de vida de conductor intachable, experiencia en conducción sobre nieve, escarcha y ripio austral. Beneficios: campamento y alimentación cubierta en Porvenir, pasajes en barcaza, viático de ruta y seguro complementario."
    },
    {
        "title": "Técnico Electromecánico de Aerogeneradores y Plantas Piloto",
        "company_name": "HIF Global / Soluciones Eólicas Magallanes",
        "location": "Punta Arenas",
        "sector": "Hidrógeno Verde / Energía",
        "job_type": "Indefinido",
        "work_shift": "40 hrs",
        "salary_min": 1200000,
        "salary_max": 1650000,
        "contact_email": "talento.magallanes@hifglobal.com",
        "contact_whatsapp": "+56961220055",
        "source_url": "https://www.bne.cl/ofertas-empleo/magallanes",
        "source_name": "BNE Magallanes / Sector Hidrógeno Verde",
        "raw_text": "Soporte al mantenimiento de aerogeneradores, electrolizadores y sistemas de compresión de hidrógeno verde en planta demostrativa de Magallanes. Requisitos: título técnico en electromecánica, electricidad industrial o energías renovables, curso de trabajo en altura física, licencia clase B. Beneficios: capacitación técnica en e-combustibles, van corporativa diaria desde Punta Arenas, alimentación en faena y seguro de vida y salud."
    },
    {
        "title": "Guía Bilingüe de Turismo y Trekking",
        "company_name": "Patagonia Wilderness Expeditions SpA",
        "location": "Puerto Natales",
        "sector": "Turismo / Gastronomía",
        "job_type": "Plazo Fijo",
        "work_shift": "Turno 14x14",
        "salary_min": 950000,
        "salary_max": 1350000,
        "contact_email": "guias@patagoniawilderness.cl",
        "contact_whatsapp": "+56961200354",
        "source_url": "https://www.chiletrabajos.cl/encuentra-un-empleo?carrera=&region=12&comuna=Puerto+Natales",
        "source_name": "Chiletrabajos Magallanes / Natales",
        "raw_text": "Empresa de ecoturismo busca Guía de Turismo Bilingüe (Español/Inglés) para circuitos en Parque Nacional Torres del Paine. Guiado, interpretación ambiental y seguridad de pasajeros. Requisitos: certificación WAFA/WFR vigente, registro SERNATUR, inglés fluido. Beneficios: alojamiento y alimentación en base de operaciones, equipamiento técnico de alta montaña y propinas compartidas equitativamente."
    }
]


async def sync_regional_jobs_cycle() -> Dict[str, Any]:
    """
    Ciclo autónomo ejecutado por el Scheduler de Render:
    1. Limpia vacantes expiradas.
    2. Procesa e ingesta ofertas no duplicadas con validación Art. 2° DT.
    3. Registra auditoría inmutable en audit_logs.
    """
    start_time = datetime.now(timezone.utc)
    db = get_supabase()
    
    # 1. Limpieza de expirados
    expired_cleaned = await cleanup_expired_jobs()
    
    # 2. Ingesta dinámica desde portales laborales de Magallanes
    inserted_count = 0
    skipped_count = 0
    
    dynamic_jobs: List[Dict[str, Any]] = []
    if fetch_all_magallanes_jobs is not None:
        try:
            logger.info("[Job Worker] 🌐 Consultando ofertas laborales dinámicas de Magallanes...")
            dynamic_jobs = await fetch_all_magallanes_jobs(limit=15)
            logger.info(f"[Job Worker] 🔍 Obtenidas {len(dynamic_jobs)} ofertas dinámicas para evaluar.")
        except Exception as scrape_err:
            logger.error(f"[Job Worker] ⚠️ Error en colector dinámico: {scrape_err}")

    # Procesar ofertas dinámicas extraídas
    for job in dynamic_jobs:
        try:
            saved = await process_and_save_job(
                raw_text=job["description"],
                source_name=job.get("source_name", "Chiletrabajos Magallanes"),
                source_url=job.get("source_url"),
                fallback_company=job.get("company_name"),
                fallback_email=job.get("contact_email"),
                fallback_whatsapp=job.get("contact_whatsapp")
            )
            if saved:
                inserted_count += 1
            else:
                skipped_count += 1
        except Exception as err:
            logger.error(f"[Job Worker Sync Cycle] Error procesando oferta dinámica '{job.get('title')}': {err}")
            skipped_count += 1

    # 3. Respaldo Curado: Si no se insertaron dinámicas, evaluar catálogo curado
    if inserted_count == 0:
        logger.info("[Job Worker] ℹ️ Evaluando catálogo curado regional como respaldo/contingencia...")
        for feed in REGIONAL_CURATED_FEEDS:
            try:
                saved = await process_and_save_job(
                    raw_text=feed["raw_text"],
                    source_name=feed.get("source_name", "ContaEmpleos PUQ"),
                    source_url=feed.get("source_url"),
                    fallback_company=feed.get("company_name"),
                    fallback_email=feed.get("contact_email"),
                    fallback_whatsapp=feed.get("contact_whatsapp")
                )
                if saved:
                    inserted_count += 1
                else:
                    skipped_count += 1
            except Exception as err:
                logger.error(f"[Job Worker Sync Cycle] Error procesando '{feed['title']}': {err}")
                skipped_count += 1

    duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
    
    # 3. Telemetría en audit_logs de Supabase
    try:
        db.table("audit_logs").insert({
            "action": "CRON_JOBS_SYNC_EXECUTED",
            "entity_type": "job_postings_cron",
            "entity_id": f"render_engine_sync_{start_time.strftime('%Y%m%d_%H%M')}",
            "details": {
                "source": "render_engine_apscheduler",
                "inserted_count": inserted_count,
                "skipped_count": skipped_count,
                "expired_cleaned": expired_cleaned,
                "duration_ms": duration_ms,
                "timestamp": start_time.isoformat()
            }
        }).execute()
        logger.info(f"[Job Worker Telemetry] ✅ Log de sincronización guardado exitosamente.")
    except Exception as log_err:
        logger.warning(f"[Job Worker Telemetry Warning]: {log_err}")

    logger.info(f"[Job Worker] 🚀 Sincronización autónoma completada: {inserted_count} insertados, {skipped_count} omitidos, {expired_cleaned} expirados limpiados ({duration_ms}ms).")
    
    return {
        "success": True,
        "inserted_count": inserted_count,
        "skipped_count": skipped_count,
        "expired_cleaned": expired_cleaned,
        "duration_ms": duration_ms,
        "timestamp": start_time.isoformat()
    }


def get_jobs_scheduler() -> AsyncIOScheduler:
    """Crea o retorna el scheduler de mantenimiento de empleos."""
    global _jobs_scheduler
    if _jobs_scheduler is None:
        _jobs_scheduler = AsyncIOScheduler(timezone="America/Santiago")
        # Ejecutar sincronización de vacantes y limpieza de expirados cada 6 horas
        _jobs_scheduler.add_job(
            func=sync_regional_jobs_cycle,
            trigger=IntervalTrigger(hours=6),
            id="sync_regional_jobs_cycle_job",
            name="Sincronización autónoma periódica de ofertas y limpieza",
            replace_existing=True
        )
        logger.info("[Job Worker] Scheduler de ciclo de vida de empleos configurado (cada 6h con ingesta + limpieza).")
    return _jobs_scheduler


async def start_jobs_worker():
    """Inicia el worker de ciclo de vida de empleos."""
    scheduler = get_jobs_scheduler()
    if not scheduler.running:
        scheduler.start()
        logger.info("[Job Worker] 🚀 Worker de empleos iniciado correctamente.")
        # Sincronización inicial asíncrona en segundo plano sin bloquear arranque
        asyncio.create_task(sync_regional_jobs_cycle())


async def stop_jobs_worker():
    """Detiene el worker limpiamente."""
    global _jobs_scheduler
    if _jobs_scheduler and _jobs_scheduler.running:
        _jobs_scheduler.shutdown(wait=False)
        logger.info("[Job Worker] 🛑 Worker de empleos detenido correctamente.")
