'use server'

import { createClient } from '@/lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'
import { revalidatePath } from 'next/cache'
import { parseError } from '@/lib/utils/errors'

export async function getWhatsAppSettings(organizationId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('whatsapp_org_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) throw error

    return {
      success: true,
      settings: data || {
        organization_id: organizationId,
        is_active: false,
        provider_type: 'meta_cloud',
        welcome_message: '¡Hola! Bienvenido al portal de autoatención laboral de tu empresa. ¿En qué te puedo ayudar hoy?',
        allow_liquidation_download: true,
        allow_vacation_query: true,
        allow_certificate_download: true,
        allow_ai_riohs: true,
        require_2fa: true
      }
    }
  } catch (err: any) {
    return { success: false, error: parseError(err), settings: null }
  }
}

export async function updateWhatsAppSettings(organizationId: string, settings: any) {
  try {
    const supabase = await createClient()
    const payload = {
      ...settings,
      organization_id: organizationId,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('whatsapp_org_settings')
      .upsert(payload)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/payroll/whatsapp')
    return { success: true, settings: data }
  } catch (err: any) {
    return { success: false, error: parseError(err) }
  }
}

export async function simulateWhatsAppMessage(payload: {
  organization_id: string
  phone_number?: string
  message: string
}) {
  try {
    const response = await engineFetch('/api/v1/whatsapp/simulate', {
      method: 'POST',
      body: {
        organization_id: payload.organization_id,
        phone_number: payload.phone_number || '56912345678',
        message: payload.message
      }
    })

    if (!response.ok) {
      const errData = await response.json()
      return { success: false, error: parseError(errData.detail || 'Error en simulador') }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: parseError(err) }
  }
}
