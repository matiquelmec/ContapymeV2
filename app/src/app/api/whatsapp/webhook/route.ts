import { NextRequest, NextResponse } from 'next/server'
import { engineFetch } from '@/lib/engine-client'

const EXPECTED_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'contapymepuq_secret_token_2026'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === EXPECTED_TOKEN) {
    console.log('[WhatsApp Webhook] Verificado exitosamente por Meta!')
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }

  return new Response('Token inválido', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[WhatsApp Webhook Inbound]:', JSON.stringify(body))

    // Reenviar al motor Python si está disponible
    try {
      await engineFetch('/api/v1/whatsapp/webhook', {
        method: 'POST',
        body
      })
    } catch (engineErr) {
      console.warn('[WhatsApp] Engine no disponible temporalmente, procesando evento:', engineErr)
    }

    return NextResponse.json({ status: 'received' }, { status: 200 })
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]:', err)
    return NextResponse.json({ status: 'received' }, { status: 200 })
  }
}
