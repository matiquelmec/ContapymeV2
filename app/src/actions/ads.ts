'use server'

import { createAdminClient } from '@/lib/supabase/admin'

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
}

/**
 * Obtiene el banner activo para una posición publicitaria específica.
 */
export async function getActiveAdBanner(position: 'calculator' | 'news_sidebar' | 'header_top'): Promise<AdBanner | null> {
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
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return data as AdBanner
  } catch (err) {
    // Si no existe la tabla o hay error, fallback elegante
    return null
  }
}
