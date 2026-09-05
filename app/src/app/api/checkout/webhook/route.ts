import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { mpPayment } from '@/lib/mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'

function verifySignature(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // Bypass solo en desarrollo si no hay secreto configurado

  const xSignature = req.headers.get('x-signature')
  if (!xSignature) return false

  try {
    const parts = xSignature.split(',')
    let ts = ''
    let hash = ''
    for (const part of parts) {
      const [k, v] = part.split('=')
      if (k && v) {
        if (k.trim() === 'ts') ts = v.trim()
        if (k.trim() === 'v1') hash = v.trim()
      }
    }

    if (!ts || !hash) return false

    const manifest = `id:${dataId};request-id:${req.headers.get('x-request-id') || ''};ts:${ts};`
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

    return hmac === hash
  } catch (err) {
    console.warn('Error verificando x-signature:', err)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    if ((topic === 'payment' || topic === 'merchant_order') && id) {
      // 1. Verificación estricta de firma HMAC (Fail-Closed para proteger contra pagos falsos)
      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET
      if (secret && !verifySignature(req, id)) {
        console.warn(`[Webhook MP] Rechazado: Firma criptográfica HMAC inválida para ID: ${id}`)
        return NextResponse.json({ error: 'Firma HMAC inválida' }, { status: 401 })
      }

      // 2. Obtener detalles del pago desde Mercado Pago
      const paymentInfo = await mpPayment.get({ id })
      
      if (paymentInfo.status === 'approved') {
        const extRef = paymentInfo.external_reference // e.g. 'job_UUID'
        const supabase = createAdminClient()

        if (extRef && extRef.startsWith('job_')) {
          const jobId = extRef.replace('job_', '')
          
          // Activar y verificar el aviso de empleo
          await supabase
            .from('job_postings')
            .update({
              status: 'active',
              is_verified: true,
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', jobId)

          console.log(`✅ Empleo ${jobId} activado y verificado exitosamente por pago MP ${id}`)
        }

        if (extRef && extRef.startsWith('news_')) {
          const newsId = extRef.replace('news_', '')
          
          // Publicar y verificar la nota de prensa
          await supabase
            .from('regional_news')
            .update({
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', newsId)

          console.log(`✅ Noticia ${newsId} publicada exitosamente por pago MP ${id}`)
        }

        if (extRef && extRef.startsWith('banner_')) {
          const meta = paymentInfo.metadata || {}
          try {
            // 🛡️ IDEMPOTENCIA: Verificar si ya se registró este banner para evitar duplicados ante reintentos
            const bannerTitle = `Publicidad ${meta.sponsor_name || 'Comercial'} [${extRef}]`
            const { data: existingBanner } = await supabase
              .from('ad_banners')
              .select('id')
              .eq('title', bannerTitle)
              .maybeSingle()

            if (!existingBanner) {
              await supabase
                .from('ad_banners')
                .insert({
                  position: meta.position || 'calculator',
                  sponsor_name: meta.sponsor_name || paymentInfo.payer?.first_name || 'Anunciante',
                  title: bannerTitle,
                  image_url: meta.image_url || '',
                  target_url: meta.target_url || '#',
                  status: 'active',
                  amount_clp: meta.amount_clp || 39990,
                  starts_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + (Number(meta.duration_days) || 30) * 24 * 60 * 60 * 1000).toISOString(),
                })
              console.log(`✅ Banner publicitario activado (${meta.duration_days || 30} días) exitosamente por pago MP ${id}`)
            } else {
              console.log(`ℹ️ Banner [${extRef}] ya activado previamente. Ignorando reintento del webhook.`)
            }
          } catch (e) {
            console.warn('Tabla ad_banners no lista para inserción directa:', e)
          }
        }

        if (extRef && extRef.startsWith('sub_')) {
          const meta = paymentInfo.metadata || {}
          const planType = meta.plan_type || 'pyme_pro'
          const organizationId = meta.organization_id
          if (organizationId) {
            try {
              await supabase
                .from('organizations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', organizationId)

              await supabase
                .from('audit_logs')
                .insert({
                  organization_id: organizationId,
                  action: 'ERP_SUBSCRIPTION_PAID',
                  entity_type: 'subscription',
                  entity_id: String(id),
                  details: {
                    plan_type: planType,
                    billing_cycle: meta.billing_cycle || 'monthly',
                    amount: paymentInfo.transaction_amount
                  }
                })
            } catch (subErr) {
              console.warn('Registro de suscripción en logs:', subErr)
            }
          }
          console.log(`✅ Suscripción ERP ${planType} activada exitosamente por pago MP ${id} (Org: ${organizationId})`)
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
