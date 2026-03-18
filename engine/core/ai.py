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
    Eres un editor experto de 'Contapyme V2', un portal de noticias institucional para la Región de Magallanes, Chile.
    Tu misión es transformar el siguiente titular y contenido en una noticia breve, pero COMPLETAMENTE INFORMATIVA.

    NOTICIA ORIGINAL:
    Titular: {headline}
    Contenido: {str(content)[0:1000]}...

    REGLAS DE EDICIÓN:
    1. El tono debe ser formal, optimista y orientado al progreso regional.
    2. REDACCIÓN COMPLETA: El resumen debe ser de 3 a 4 oraciones. NO dejes la noticia abierta. 
       - Si mencionas "estrategias", "medidas" o "planes", DEBES detallar brevemente cuáles son.
       - El lector debe entender el QUÉ, CÓMO y POR QUÉ sin necesidad de leer más.
    3. Clasifica en: INVERSIONES, DEPORTES, CLIMA, CULTURA, ECONOMÍA, SOCIAL.
    4. Crea un visual_prompt para nuestra IA local (GPU) siguiendo este estilo:
       - ESTILO: Animación híbrida 2D/3D (Estilo Ghibli futurista / Cyberpunk suave).
       - ELEMENTOS: Luces de neón azul/cian, arquitectura de vanguardia en Punta Arenas, tecnología limpia.

    RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
    {{
        "title": "Titular optimizado",
        "category": "CATEGORÍA",
        "summary": "Resumen ejecutivo detallado y CERRADO (incluye el 'cómo' y los puntos clave).",
        "is_featured": boolean,
        "visual_style": "ANIMACION_FUTURISTA",
        "visual_prompt": "Digital high-tech 2D/3D animation, Ghibli vibes, neon cyberpunk Punta Arenas, [SCENE_DETAILS], 8k."
    }}
    """

    try:
        payload = {
            "model": DEFAULT_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "format": "json"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(OLLAMA_URL, json=payload)
            if response.status_code == 200:
                result = response.json()
                content_res = result.get("message", {}).get("content", "{}")
                return json.loads(content_res)
            else:
                logger.error(f"[AI] Error en Ollama: {response.status_code}")
    except Exception as e:
        logger.error(f"[AI] No se pudo conectar con Ollama Local: {e}")
    
    # Fallback básico si la IA falla
    return {
        "title": headline,
        "category": "REGIONAL",
        "summary": content[:150] if content else "Noticia capturada desde medios locales.",
        "is_featured": False
    }
