import httpx
import json
import logging
import asyncio

logger = logging.getLogger("contapyme.ai")

# Configuración de Ollama Local (Heredada de Slingshot Trading)
OLLAMA_URL = "http://localhost:11434/api/chat"
DEFAULT_MODEL = "gemma3:4b"  # El modelo que el usuario tiene configurado

async def process_news_with_local_llm(headline: str, content: str = "") -> dict:
    """
    Procesa una noticia usando el LLM local (Ollama) para resumirla,
    darle un tono ejecutivo y verificar su relevancia regional.
    """
    prompt = f"""
    Eres el editor principal de 'Contapyme V2', un portal de noticias institucional premium para la Región de Magallanes, Chile.
    Tu objetivo es transformar un texto ruidoso capturado de medios locales en una noticia COMPLETAMENTE ORIGINAL, estructurada y profesional.

    TEXTO CAPTURADO (CRUDO):
    Titular sugerido: {headline}
    Contenido detectado: {str(content)[0:3000]}...

    REGLAS DE ORO PARA EL REDACTOR:
    1. ORIGINALIDAD TOTAL: Reescribe la noticia desde cero con un lenguaje elegante, formal y periodístico. ¡Prohibido copiar frases del texto crudo!
    2. ESTILO VISUAL (CRÍTICO): Genera un prompt para imagen estilo "Studio Ghibli meets Cyberpunk 2077". Debe ser dinámico y artístico.
    3. ESTRUCTURA OBLIGATORIA (SI NO ESTÁ COMPLETO, SE RECHAZARÁ):
       - 'title': Titular potente, corto y vendedor (MÁXIMO 10 PALABRAS).
       - 'summary': Resumen ejecutivo de EXACTAMENTE 3 líneas.
       - 'full_content': Redacta un artículo de MÍNIMO 3 párrafos de alta calidad. Debe sonar a periodismo institucional de lujo. Omitir publicidad, teléfonos o links.
    4. TONO: Formal, profesional, optimista y orgullosamente regional de Magallanes.
    5. CATEGORÍAS: INVERSIONES, DEPORTES, CLIMA, ECONOMÍA, SOCIAL.

    RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
    {{
        "title": "Titular reescrito",
        "category": "CATEGORÍA",
        "summary": "Resumen para el portal.",
        "full_content": "Cuerpo extenso de la noticia totalmente original y sin ruido.",
        "is_featured": boolean,
        "visual_prompt": "Studio Ghibli style, soft cyberpunk, Punta Arenas, Magallanes, [detalles épicos de la escena], 8k, vibrant colors."
    }}
    """

    payload = {
        "model": DEFAULT_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "format": "json"
    }

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(OLLAMA_URL, json=payload)
            if response.status_code == 200:
                result = response.json()
                content_raw = result.get("message", {}).get("content", "{}")
                data = json.loads(content_raw)
                
                # Blindaje: Asegurar que TODAS las llaves necesarias existan
                return {
                    "title": data.get("title", headline),
                    "category": data.get("category", "REGIONAL"),
                    "summary": data.get("summary", ""),
                    "full_content": data.get("full_content", content),
                    "is_featured": data.get("is_featured", False),
                    "visual_prompt": data.get("visual_prompt", f"Studio Ghibli style, soft cyberpunk, Punta Arenas, Magallanes, 8k, vibrant colors.")
                }
            else:
                logger.error(f"[AI] Error en Ollama: {response.status_code}")
    except Exception as e:
        logger.error(f"[AI] No se pudo procesar con IA: {e}")
    
    # Si la IA falla, devolvemos NULL para no ensuciar el portal con basura.
    # El portal debe ser IMPECABLE o estar vacío.
    return None
