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
