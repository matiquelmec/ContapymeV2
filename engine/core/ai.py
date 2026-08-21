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

async def process_news_with_local_llm(headline: str, content: str = "") -> dict:
    """
    Procesa una noticia usando Groq Cloud para resumirla,
    darle un tono ejecutivo y verificar su relevancia regional.
    """
    if not GROQ_API_KEY:
        logger.error("[AI] ⚠️ Falta GROQ_API_KEY. Abortando procesamiento de IA.")
        return None

    prompt = f"""
    Eres el editor y Analista Financiero principal de 'Contapymepuq', un portal institucional de noticias en Magallanes, Chile.
    Tu audiencia son contadores, dueños de empresas y profesionales que buscan información estratégica.
    Tu objetivo es transformar textos crudos en artículos profesionales, sobrios y útiles.
    
    ¡IMPORTANTE!: Si la noticia es sobre farándula, chismes, curiosidades mundiales virales o temas que no afectan a la economía, al derecho o a la vida en Magallanes, NO LA REDACTES. En su lugar, responde con un JSON que tenga "category": "IGNORE".

    TEXTO CAPTURADO (CRUDO):
    Titular sugerido: {headline}
    Contenido detectado: {str(content)[0:3000]}...

    REGLAS DE ORO PARA EL ANALISTA:
    1. ORIGINALIDAD Y VALOR: Redacta desde una perspectiva institucional. Si la noticia es económica, resalta el impacto (ej. cómo afecta el dólar al comercio local).
    2. PERSPECTIVA EDITORIAL: Habla desde el noticiero de 'Contapymepuq'. Usa un tono ejecutivo y serio.
    3. ESTILO VISUAL: Prompt de imagen de estilo fotografía de prensa fotorrealista e hiperrealista, seria y documental, con iluminación cinematográfica y detalles reales del entorno de la Patagonia (Magallanes).
    4. ESTRUCTURA:
       - 'title': Titular profesional (MÁX. 10 PALABRAS). No usar mayúsculas sostenidas.
       - 'summary': Resumen de 3 líneas enfocado en lo que el lector necesita saber.
       - 'full_content': MÍNIMO 3 párrafos de redacción experta.
    5. CATEGORÍAS PERMITIDAS: INVERSIONES, ECONOMÍA, FINANZAS, SII/LEGAL, MAGALLANES ACTUAL, DEPORTES REGIONALES.
    6. TONO: Ejecutivo, sobrio y analítico.
    7. SEGURIDAD JSON: NUNCA uses comillas dobles (") dentro de los valores de texto. Si necesitas citar algo, usa comillas simples ('). Esto es CRÍTICO para que el formato JSON no se rompa.

    RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
    {{
        "title": "Titular reescrito",
        "category": "CATEGORÍA",
        "summary": "Resumen ejecutivo.",
        "full_content": "Cuerpo completo de la noticia.",
        "is_featured": boolean,
        "brand_name": "Nombre de la marca o tienda local/nacional involucrada si aplica (ej: H&M, Cerveza Austral, SII), de lo contrario null",
        "visual_prompt": "Descripción visual detallada en inglés. Si la noticia involucra una tienda, marca o negocio local, el prompt debe describir una escena fotorrealista mostrando la fachada o el interior del negocio con sus elementos característicos, o un dispositivo móvil mostrando una captura de su sitio/marca. El prompt DEBE seguir este ADN: 'A hyperrealistic, high-fidelity news documentary photograph, natural ambient lighting, authentic environments of Punta Arenas/Magallanes, Patagonia, [detalles específicos de la tienda, marca o locación], shot on 35mm lens, f/2.8, raw photo, lifelike details, 8k'.",
        "seo_keywords": "Palabras clave separadas por comas (máximo 5) relevantes para SEO y contexto local/financiero.",
        "seo_description": "Una meta descripción breve orientada a SEO de menos de 160 caracteres."
    }}
    """

    payload = {
        "model": DEFAULT_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
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
