import os
import httpx
import json
import logging
import asyncio

logger = logging.getLogger("contapyme.ai")

# Configuración de Groq Cloud (v8.7 Smart Cloud)
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
DEFAULT_MODEL = "openai/gpt-oss-120b"
FALLBACK_MODEL = "openai/gpt-oss-20b"
TERTIARY_MODEL = "qwen/qwen3.6-27b"

async def groq_chat_completion(messages: list, temperature: float = 0.0, json_mode: bool = True) -> str | None:
    """
    Función genérica para ejecutar inferencia en Groq Cloud con reintentos y fallbacks.
    """
    if not GROQ_API_KEY:
        logger.error("[AI] ⚠️ Falta GROQ_API_KEY. Abortando llamada a Groq.")
        return None

    payload = {
        "model": DEFAULT_MODEL,
        "messages": messages,
        "temperature": temperature,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    models_to_try = [DEFAULT_MODEL, FALLBACK_MODEL, TERTIARY_MODEL]
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for current_model in models_to_try:
                payload["model"] = current_model
                try:
                    resp = await client.post(GROQ_URL, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if resp.status_code == 429:
                        logger.warning(f"[AI] ⏱️ Rate limit en {current_model}. Probando siguiente modelo...")
                        await asyncio.sleep(1.5)
                    else:
                        logger.warning(f"[AI] ⚠️ Groq {resp.status_code} con {current_model}...")
                except Exception as ex:
                    logger.warning(f"[AI] Excepción en modelo {current_model}: {ex}")
    except Exception as e:
        logger.error(f"[AI] Error ejecutando groq_chat_completion: {e}")

    return None


async def process_news_with_local_llm(headline: str, content: str = "") -> dict:
    """
    Procesa una noticia usando Groq Cloud para resumirla,
    darle un tono ejecutivo y verificar su relevancia regional.
    """
    if not GROQ_API_KEY:
        logger.error("[AI] ⚠️ Falta GROQ_API_KEY. Abortando procesamiento de IA.")
        return None

    prompt = f"""
    Eres el editor y Analista Principal de 'Contapymepuq', un portal institucional y financiero de noticias de Magallanes, Chile.
    Tu audiencia son contadores, directores de empresas y profesionales que exigen rigor, veracidad y análisis estratégico.
    Tu misión es transformar hechos noticiosos en artículos de alta calidad periodística, con redacción propia y original (evitando cualquier plagio o copia textual), pero con una FIDELIDAD FACTUAL ABSOLUTA AL 100% (cero alucinaciones).
    
    ¡FILTRO DE RELEVANCIA!: Si la noticia es sobre farándula, chismes, curiosidades mundiales virales o temas que no afectan a la economía, al derecho o a la vida en Magallanes, NO LA REDACTES. Responde con un JSON que tenga "category": "IGNORE".

    TEXTO BASE CAPTURADO:
    Titular de referencia: {headline}
    Hechos reportados: {str(content)[0:3500]}

    REGLAS DE ORO EDITORIALES (BLINDAJE FACTUAL Y ANTI-PLAGIO):
    1. REESCRITURA ORIGINAL (CERO PLAGIO): Redacta la noticia con tu propia estructura sintáctica y vocabulario ejecutivo. No copies frases completas de la fuente. Transforma la información en una pieza periodística original de Contapymepuq.
    2. FIDELIDAD FACTUAL ESTRICTA (CERO ALUCINACIÓN): 
       - Cíñete ÚNICA Y EXCLUSIVAMENTE a los hechos, cifras, lugares, nombres y procedimientos descritos en el texto base.
       - NUNCA inventes, supongas ni extrapoles argumentos de defensa, descargos de abogados, motivos personales ni justificaciones de las partes involucradas si no están explícitamente detallados en el texto.
       - Si la noticia menciona una investigación o denuncia (ej. Aduanas, PDI, SII, Fiscalía), expón los hechos objetivos de forma neutral, sin calificar ni inventar explicaciones de los acusados o instituciones.
    3. LONGITUD PROPORCIONAL Y SIN RELLENO: Desarrolla el texto de manera concisa y sustanciosa, proporcional a la cantidad de información real del texto base. No agregues párrafos vacíos o redundantes para inflar el texto.
    4. TONO: Ejecutivo, sobrio, formal e institucional.
    5. ESTRUCTURA REQUERIDA:
       - 'title': Titular profesional (MÁX. 10 PALABRAS). No usar mayúsculas sostenidas.
       - 'summary': Resumen ejecutivo directo de 2 a 3 oraciones con los puntos clave.
       - 'full_content': Redacción fluida y completa dividida en párrafos bien estructurados con análisis del contexto regional/económico cuando aplique.
    6. CATEGORÍAS PERMITIDAS: INVERSIONES, ECONOMÍA, FINANZAS, SII/LEGAL, MAGALLANES ACTUAL, DEPORTES REGIONALES.
    7. SEGURIDAD JSON: NUNCA uses comillas dobles (") dentro de los valores de texto. Si necesitas citar algo, usa comillas simples (').

    RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
    {{
        "title": "Titular reescrito profesional",
        "category": "CATEGORÍA",
        "summary": "Resumen ejecutivo directo.",
        "full_content": "Cuerpo completo de la noticia.",
        "is_featured": boolean,
        "brand_name": "Nombre de la marca o entidad involucrada si aplica (ej: EDELMAG, ENAP, SII), de lo contrario null",
        "visual_prompt": "Detailed visual description in English for authentic editorial press photography in Magallanes, Chile (e.g. 'Documentary press photo of cargo trucks in Punta Arenas port, overcast Magallanes cold sky, shot on 35mm lens, natural daylight'). Do NOT include cartoon, 3d, or CGI terms.",
        "seo_keywords": "Palabras clave separadas por comas (máximo 5) relevantes para SEO.",
        "seo_description": "Meta descripción breve de menos de 160 caracteres."
    }}
    """

    payload = {
        "model": DEFAULT_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.0,
        "response_format": {"type": "json_object"}
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            
            models_to_try = [DEFAULT_MODEL, FALLBACK_MODEL, TERTIARY_MODEL]
            response = None
            
            for current_model in models_to_try:
                payload["model"] = current_model
                try:
                    response = await client.post(GROQ_URL, json=payload, headers=headers)
                    if response.status_code == 200:
                        break
                    
                    if response.status_code == 429:
                        # Si hay límite de tasa, esperar brevemente
                        logger.warning(f"[AI] ⏱️ Rate limit en {current_model}. Probando siguiente modelo...")
                        await asyncio.sleep(2.0)
                    else:
                        logger.warning(f"[AI] ⚠️ Groq {response.status_code} con {current_model}. Probando siguiente modelo...")
                except Exception as req_ex:
                    logger.warning(f"[AI] Error solicitando modelo {current_model}: {req_ex}")
            
            if response and response.status_code == 200:
                result = response.json()
                content_raw = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                data = json.loads(content_raw)
                
                if data.get("category") == "IGNORE":
                    logger.info(f"[AI] Noticia ignorada por irrelevancia: {headline}")
                    return None

                return {
                    "title": data.get("title", headline),
                    "category": data.get("category", "REGIONAL"),
                    "summary": data.get("summary", ""),
                    "full_content": data.get("full_content", content),
                    "is_featured": data.get("is_featured", False),
                    "brand_name": data.get("brand_name", None),
                    "visual_prompt": data.get("visual_prompt", f"A hyperrealistic news photograph of Punta Arenas, Magallanes, Patagonia, 8k, cinematic lighting, realistic colors."),
                    "seo_keywords": data.get("seo_keywords", "contapymepuq, magallanes, punta arenas, chile"),
                    "seo_description": data.get("seo_description", data.get("summary", "")[:155])
                }
            else:
                logger.error(f"[AI] Error en Groq: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"[AI] No se pudo procesar con IA: {e}")
    
    return None
