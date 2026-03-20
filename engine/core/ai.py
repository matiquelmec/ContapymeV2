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
    Eres el editor y Analista Financiero principal de 'Contapymepuq', un portal institucional de noticias en Magallanes, Chile.
    Tu audiencia son contadores, dueños de empresas y profesionales que buscan información estratégica.
    Tu objetivo es transformar textos crudosen artículos profesionales, sobrios y útiles.
    
    ¡IMPORTANTE!: Si la noticia es sobre farándula, chismes, curiosidades mundiales virales o temas que no afectan a la economía, al derecho o a la vida en Magallanes, NO LA REDACTES. En su lugar, responde con un JSON que tenga "category": "IGNORE".

    TEXTO CAPTURADO (CRUDO):
    Titular sugerido: {headline}
    Contenido detectado: {str(content)[0:3000]}...

    REGLAS DE ORO PARA EL ANALISTA:
    1. ORIGINALIDAD Y VALOR: Redacta desde una perspectiva institucional. Si la noticia es económica, resalta el impacto (ej. cómo afecta el dólar al comercio local).
    2. PERSPECTIVA EDITORIAL: Habla desde el noticiero de 'Contapymepuq'. Usa un tono ejecutivo y serio.
    3. ESTILO VISUAL: Prompt de imagen "Studio Ghibli meets Cyberpunk 2077", elegante, con un toque tecnológico/financiero pero siempre regional (Patagonia).
    4. ESTRUCTURA:
       - 'title': Titular profesional (MÁX. 10 PALABRAS). No usar mayúsculas sostenidas.
       - 'summary': Resumen de 3 líneas enfocado en lo que el lector necesita saber.
       - 'full_content': MÍNIMO 3 párrafos de redacción experta.
    5. CATEGORÍAS PERMITIDAS: INVERSIONES, ECONOMÍA, FINANZAS, SII/LEGAL, MAGALLANES ACTUAL, DEPORTES REGIONALES.
    6. TONO: Ejecutivo, sobrio y analítico.

    RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
    {{
        "title": "Titular reescrito",
        "category": "CATEGORÍA",
        "summary": "Resumen ejecutivo.",
        "full_content": "Cuerpo completo de la noticia.",
        "is_featured": boolean,
        "visual_prompt": "Studio Ghibli style, soft cyberpunk, Punta Arenas, Magallanes, professional business atmosphere, 8k."
    }}
    """

    payload = {
        "model": DEFAULT_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "format": "json",
        "options": {
            "num_predict": 2048,  # Aumento del límite de tokens para evitar cortes
            "temperature": 0.3,   # Más determinismo para evitar divagaciones
            "top_p": 0.9          # Estabilidad en la elección de palabras
        }
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
