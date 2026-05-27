'use server'

import { createClient } from '@/lib/supabase/server'
import { checkAdminPermission } from './news'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

interface AssistInput {
  draftTitle?: string
  draftContent: string
  draftCategory?: string
}

interface AssistResult {
  success: boolean
  error?: string
  data?: {
    title: string
    category: string
    summary: string
    content: string
  }
}

/**
 * Server Action que utiliza Groq Cloud AI para pulir, redactar de forma experta
 * y estructurar un borrador de noticia ingresado por el usuario.
 */
export async function assistNewsWritingAction(input: AssistInput): Promise<AssistResult> {
  const apiKey = process.env.GROQ_API_KEY || ''

  try {
    // 1. Validar que el usuario sea administrador
    const authCheck = await checkAdminPermission()
    if (!authCheck.authorized) {
      return { success: false, error: 'No autorizado: requiere privilegios editoriales' }
    }

    if (!apiKey) {
      console.error('[AI Assist] GROQ_API_KEY no configurado en el servidor Next.js')
      return { 
        success: false, 
        error: 'El servicio de asistencia por IA no está disponible temporalmente (Motivo: GROQ_API_KEY vacía o no detectada)' 
      }
    }

    if (!input.draftContent || input.draftContent.trim().length < 10) {
      return { success: false, error: 'El texto borrador debe tener al menos 10 caracteres' }
    }

    // 2. Armar el Prompt enfocado en el estilo editorial de Contapymepuq
    const systemPrompt = `
    Eres el redactor jefe e Inteligencia Artificial editorial de 'Contapymepuq', el principal diario digital de Punta Arenas y la región de Magallanes, Chile.
    Tu audiencia son contadores, gerentes, empresarios y profesionales de la Patagonia que buscan información seria y estructurada.

    TAREA:
    Tu tarea es transformar el borrador o apuntes crudos ingresados por el usuario en un artículo de prensa profesional y pulido de nivel periodístico.

    REGLAS EDITORIALES DE ORO:
    1. TONO: Sobrio, formal, analítico y altamente periodístico. Evita sensacionalismos y clickbaits.
    2. ENFOQUE REGIONAL: Si el borrador menciona a Punta Arenas, Magallanes, Tierra del Fuego, Puerto Natales o aspectos locales de la Patagonia, dale un realce especial al impacto local.
    3. ESTRUCTURA:
       - 'title': Titular profesional (máximo 10 palabras), con mayúsculas y minúsculas adecuadas (no todo mayúsculas). Debe ser directo y descriptivo.
       - 'summary': Resumen ejecutivo en un solo párrafo corto (máximo 3 líneas) enfocado en lo esencial.
       - 'content': Cuerpo completo de la noticia, redactado de forma experta en 3 o 4 párrafos bien estructurados (mínimo 200 palabras en total).
    4. CATEGORÍA: Clasifica el artículo estrictamente en una de las siguientes 3 categorías oficiales:
       - 'MAGALLANES ACTUAL' (Para noticias locales, comunidad, clima, deportes, eventos, etc.)
       - 'ECONOMÍA' (Para noticias financieras, mercado, inversiones, PYMEs, IPC, dólar, etc.)
       - 'SII / LEGAL' (Para noticias de impuestos, circulares del SII, leyes tributarias, laboral, etc.)
    5. SEGURIDAD DE FORMATO: NUNCA uses comillas dobles (") dentro de las respuestas de texto. Si necesitas citar algo, usa comillas simples ('). Esto es extremadamente crítico para que el formato JSON de respuesta no se rompa al deserializar.

    RESPONDE EXCLUSIVAMENTE EN FORMATO JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA:
    {
      "title": "Titular profesional del artículo",
      "category": "MAGALLANES ACTUAL o ECONOMÍA o SII / LEGAL",
      "summary": "Resumen ejecutivo del artículo...",
      "content": "Cuerpo completo del artículo en párrafos expertos..."
    }
    `

    const userPrompt = `
    BORRADOR O APUNTES DEL USUARIO:
    Título tentativo: ${input.draftTitle || 'Sin título'}
    Categoría elegida: ${input.draftCategory || 'Sin categoría fija'}
    Contenido borrador:
    """
    ${input.draftContent}
    """
    `

    // 3. Consultar a la API de Groq Cloud
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[AI Assist] Error de API de Groq (${response.status}):`, errText)
      return { 
        success: false, 
        error: `Error de API de Groq (Status: ${response.status}): ${errText.substring(0, 150)}` 
      }
    }

    const result = await response.json()
    const rawContent = result.choices?.[0]?.message?.content || '{}'
    const parsedData = JSON.parse(rawContent)

    return {
      success: true,
      data: {
        title: parsedData.title || input.draftTitle || 'Artículo Asistido por IA',
        category: parsedData.category || input.draftCategory || 'MAGALLANES ACTUAL',
        summary: parsedData.summary || '',
        content: parsedData.content || input.draftContent
      }
    }

  } catch (err: any) {
    console.error('[AI Assist] Error crítico en Server Action:', err.message)
    return { success: false, error: `Error crítico en la asistencia por IA (Diagnóstico: ${err.message})` }
  }
}
