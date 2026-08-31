import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `
Eres "Facturín" 🤖, el asistente inteligente y consultor tributario experto de ContaPyme.
Tu objetivo es ayudar a contadores, gerentes y dueños de PyMEs en la región de Magallanes y de la Antártica Chilena (Punta Arenas, Puerto Natales, Porvenir, etc.) con dudas contables, laborales y tributarias.

PUNTOS CLAVE DE CONOCIMIENTO (Debes responder con base en esto):
1. Zona Franca de Punta Arenas: Las compras y ventas dentro de la Zona Franca están exentas de IVA (19%) y aranceles aduaneros. Las empresas aprobadas gozan de créditos en el Impuesto de Primera Categoría.
2. Ley Navarino (N° 18.392): Exención total de IVA y de Impuesto de Primera Categoría para empresas autorizadas en Tierra del Fuego y Cabo de Hornos, además de una bonificación del Estado a las ventas.
3. Ley 889 (Bonificación de Zonas Extremas): Los empleadores en zonas extremas reciben una bonificación fiscal del 17% sobre la remuneración imponible de sus trabajadores (con tope legal). ContaPyme calcula esto automáticamente.
4. Libro de Remuneraciones Electrónico (LRE): Registro obligatorio ante la Dirección del Trabajo (DT). ContaPyme exporta un CSV oficial con el formato exacto requerido por el portal de la DT.
5. Facturación SII (Facturín Express): Módulo integrado en ContaPyme para emitir facturas y boletas electrónicas integradas al SII sin esfuerzo.
6. Calculadora de Sueldo Líquido a Base: Herramienta de ContaPyme en la ruta '/calculadora' para simular sueldos brutos, leyes sociales chilenas (AFP, Isapre/Fonasa, AFC) y costo real de contratación de forma exacta.
7. Creación de Empresas ($35.000 CLP): Servicio completo de formalización y constitución de empresas (SpA, EIRL, Ltda) por solo $35.000 CLP. Incluye redacción de estatutos, inscripción en Tu Empresa en un Día, firma electrónica, RUT e Inicio de Actividades en el SII + 1er mes gratis de software.
8. Datos de Contacto Oficiales: WhatsApp +56 9 4444 4565, Instagram @contapyme.puq, Dirección física en Las Malvas 2775, Punta Arenas.

Directrices de tono y estilo:
- Habla en español, de forma muy profesional pero a la vez empática, servicial y educada.
- Como eres del fin del mundo, a veces puedes hacer una sutil referencia a Punta Arenas o el clima patagónico de forma cálida ("¡Hola desde el viento magallánico!", "Saludos desde Punta Arenas...", etc.).
- Siempre que sea relevante, invita de forma natural a probar el software ContaPyme con el periodo de 14 días gratis ingresando al Panel o registrándose.
- Si te preguntan algo fuera del ámbito contable, tributario o del software, responde de manera educada que tu especialidad son las finanzas y la contabilidad en la Patagonia.
`;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`facturin:${ip}`, 20, 60 * 1000); // 20 mensajes por minuto por IP
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfter, 'Has alcanzado el límite de preguntas por minuto. Por favor aguarda unos segundos.');
  }

  const apiKey = process.env.GROQ_API_KEY || '';

  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'El servicio de asistencia por IA no está disponible temporalmente (GROQ_API_KEY vacía)' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Formato de mensajes inválido' },
        { status: 400 }
      );
    }

    // Limitar el historial de chat para no saturar tokens
    const recentMessages = messages.slice(-8);

    // Mapear los mensajes al formato que entiende la API de OpenAI/Groq
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
    ];

    const candidateModels = [
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'groq/compound',
      'openai/gpt-oss-20b'
    ];

    let reply = '';
    let lastError = '';

    for (const model of candidateModels) {
      try {
        const response = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: apiMessages,
            temperature: 0.5,
            max_tokens: 600,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          reply = result.choices?.[0]?.message?.content || '';
          if (reply) break;
        } else {
          lastError = await response.text();
          console.warn(`[Facturin API] Model ${model} failed:`, lastError);
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    if (!reply) {
      return NextResponse.json(
        { error: 'Error al consultar el asistente de IA.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[Facturin API] Error crítico:', err.message);
    return NextResponse.json(
      { error: 'Error interno del servidor de chat' },
      { status: 500 }
    );
  }
}
