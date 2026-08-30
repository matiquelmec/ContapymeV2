'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface AdBanner {
  id: string
  position: 'calculator' | 'news_sidebar' | 'header_top'
  sponsor_name: string
  title: string
  image_url: string
  target_url: string
  contact_whatsapp?: string
  status: 'active' | 'expired' | 'pending'
  starts_at?: string
  expires_at?: string
  created_at?: string
}

/**
 * Obtiene todos los banners activos para una posición publicitaria específica (para Pasarela / Carrusel).
 */
export async function getActiveAdBanners(position: 'calculator' | 'news_sidebar' | 'header_top'): Promise<AdBanner[]> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('ad_banners')
      .select('*')
      .eq('position', position)
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as AdBanner[]
  } catch (err) {
    return []
  }
}

/**
 * Obtiene el banner activo para una posición publicitaria específica.
 */
export async function getActiveAdBanner(position: 'calculator' | 'news_sidebar' | 'header_top'): Promise<AdBanner | null> {
  try {
    const banners = await getActiveAdBanners(position)
    if (banners.length === 0) return null
    const selectedIndex = Math.floor(Math.random() * banners.length)
    return banners[selectedIndex]
  } catch (err) {
    return null
  }
}

export interface SlotAvailability {
  position: 'calculator' | 'news_sidebar' | 'header_top'
  count: number
  max: number
  available: number
  isFull: boolean
  nextAvailableDate?: string | null
}

/**
 * Consulta en tiempo real la disponibilidad y cupos restantes de cada ubicación publicitaria (Máx 5 por slot).
 */
export async function getAdSlotsAvailabilityAction(): Promise<Record<string, SlotAvailability>> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    const { data } = await supabase
      .from('ad_banners')
      .select('position, expires_at')
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('expires_at', now)
      .order('expires_at', { ascending: true })

    const slots: ('calculator' | 'news_sidebar' | 'header_top')[] = ['calculator', 'news_sidebar', 'header_top']
    const result: Record<string, SlotAvailability> = {}
    const maxPerSlot = 5

    for (const s of slots) {
      const activeForSlot = (data || []).filter(item => item.position === s)
      const count = activeForSlot.length
      const isFull = count >= maxPerSlot
      const nextAvailableDate = isFull && activeForSlot.length > 0 ? activeForSlot[0].expires_at : null

      result[s] = {
        position: s,
        count,
        max: maxPerSlot,
        available: Math.max(0, maxPerSlot - count),
        isFull,
        nextAvailableDate,
      }
    }

    return result
  } catch (e) {
    return {
      calculator: { position: 'calculator', count: 0, max: 5, available: 5, isFull: false },
      news_sidebar: { position: 'news_sidebar', count: 0, max: 5, available: 5, isFull: false },
      header_top: { position: 'header_top', count: 0, max: 5, available: 5, isFull: false },
    }
  }
}

/**
 * Obtiene todos los banners gestionados en el panel de control.
 */
export async function getCompanyAdBannersAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, data: [] }

    const adminDb = createAdminClient()
    const { data, error } = await adminDb
      .from('ad_banners')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) return { success: true, data: [] }
    return { success: true, data: (data as AdBanner[]) || [] }
  } catch (err: any) {
    return { success: false, error: err.message, data: [] }
  }
}
