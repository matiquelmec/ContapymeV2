import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000'

export const mpClient = new MercadoPagoConfig({
  accessToken,
  options: { timeout: 7000 }
})

export const mpPreference = new Preference(mpClient)
export const mpPayment = new Payment(mpClient)

export interface CheckoutItemPayload {
  title: string
  quantity: number
  unit_price: number
  description?: string
  id: string
  category_id?: string
}

export interface CreatePreferenceOptions {
  items: CheckoutItemPayload[]
  payerEmail?: string
  payerName?: string
  externalReference: string
  metadata?: Record<string, any>
  successUrl?: string
  failureUrl?: string
  pendingUrl?: string
}

/**
 * 💳 Crea una preferencia de pago en Mercado Pago para Checkout Pro (Chile).
 */
export async function createMercadoPagoPreference(options: CreatePreferenceOptions) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.contapymepuq.cl'

  const body = {
    items: options.items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: 'CLP',
      description: item.description || item.title,
    })),
    payer: {
      email: options.payerEmail || 'contacto@contapymepuq.cl',
      name: options.payerName || 'Cliente ContaPymePUQ',
    },
    back_urls: {
      success: options.successUrl || `${baseUrl}/checkout/success`,
      failure: options.failureUrl || `${baseUrl}/checkout/failure`,
      pending: options.pendingUrl || `${baseUrl}/checkout/pending`,
    },
    auto_return: 'approved',
    external_reference: options.externalReference,
    statement_descriptor: 'CONTAPYMEPUQ',
    metadata: options.metadata || {},
    notification_url: `${baseUrl}/api/checkout/webhook`,
  }

  try {
    const preference = await mpPreference.create({ body })
    return {
      success: true,
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    }
  } catch (error: any) {
    console.error('Error creating Mercado Pago preference:', error)
    return {
      success: false,
      error: error?.message || 'Error al conectar con Mercado Pago',
    }
  }
}
