import { NextRequest, NextResponse } from 'next/server'
import { createMercadoPagoPreference } from '@/lib/mercadopago'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planType, billingCycle, organizationId } = body // 'emprendedor' | 'pyme_pro' | 'estudio' | 'corporativo'

    if (!planType) {
      return NextResponse.json({ success: false, error: 'planType requerido' }, { status: 400 })
    }

    const plans: Record<string, { name: string; price: number; desc: string }> = {
      emprendedor: {
        name: 'Plan Emprendedor ERP',
        price: 9990,
        desc: 'Suscripción Software ERP & Nómina (Hasta 3 trabajadores)',
      },
      pyme_pro: {
        name: 'Plan Pyme Pro ERP (Recomendado)',
        price: 24990,
        desc: 'Suscripción Software ERP & Remuneraciones (Hasta 15 trabajadores + 1 empleo gratis bimestral)',
      },
      estudio: {
        name: 'Plan Estudio Contable ERP',
        price: 4990,
        desc: 'Suscripción Multi-Empresa para Estudios Contables (Hasta 100 trabajadores)',
      },
      corporativo: {
        name: 'Plan Corporativo ERP',
        price: 89990,
        desc: 'Suscripción Corporativa para Faenas y Grandes Empresas de Magallanes',
      },
    }

    const selected = plans[planType] || plans.emprendedor
    const isAnnual = billingCycle === 'annual'
    const finalPrice = isAnnual ? Math.round(selected.price * 12 * 0.8) : selected.price

    const preferenceRes = await createMercadoPagoPreference({
      items: [{
        id: `sub_${planType}_${billingCycle || 'monthly'}`,
        title: `${selected.name} (${isAnnual ? 'Cobro Anual -20%' : 'Cobro Mensual'})`,
        quantity: 1,
        unit_price: finalPrice,
        description: selected.desc,
      }],
      externalReference: `sub_${organizationId || 'org'}_${planType}`,
      metadata: {
        type: 'subscription',
        plan_type: planType,
        billing_cycle: billingCycle || 'monthly',
        organization_id: organizationId,
      },
      successUrl: 'https://www.contapymepuq.cl/checkout/success?type=subscription',
      failureUrl: 'https://www.contapymepuq.cl/checkout/failure',
    })

    if (!preferenceRes.success) {
      return NextResponse.json({ success: false, error: preferenceRes.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      init_point: preferenceRes.init_point,
      preference_id: preferenceRes.id,
    })
  } catch (err: any) {
    console.error('Error creating subscription preference:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
