import { NextRequest, NextResponse } from 'next/server'
import { mpPayment } from '@/lib/mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    if (topic === 'payment' && id) {
      // 1. Obtener detalles del pago desde Mercado Pago
      const paymentInfo = await mpPayment.get({ id })
      
      if (paymentInfo.status === 'approved') {
        const extRef = paymentInfo.external_reference // e.g. 'job_UUID'
        const supabase = createAdminClient()

        if (extRef && extRef.startsWith('job_')) {
          const jobId = extRef.replace('job_', '')
          
          // Activar y destacar el aviso de empleo
          await supabase
            .from('job_postings')
            .update({
              status: 'active',
              is_featured: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', jobId)

          console.log(`✅ Empleo ${jobId} activado y destacado exitosamente por pago MP ${id}`)
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
