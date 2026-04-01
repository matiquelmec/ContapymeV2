'use server'

import { createClient } from '@/lib/supabase/server'

export async function getRegionalNews() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('regional_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(20)
    
    if (error || !data || data.length === 0) {
      if (error && error.code !== 'PGRST116') {
        console.error('[DATABASE ERROR] Fallo al obtener noticias:', error.message)
      }
      // Veracidad Absoluta: Devolvemos array vacío si no hay datos reales
      return { success: true, data: [], isFallback: false }
    }

    return { success: true, data, isFallback: false }
  } catch (err: any) {
    console.error("[News Action Error]:", err.message);
    return { success: true, data: [], isFallback: false }
  }
}

export async function getNewsBySlug(slug: string) {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('regional_news')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error || !data) {
      return { success: false, error: 'Noticia no encontrada en los registros oficiales' }
    }

    return { success: true, data, isFallback: false }
  } catch (err: any) {
    return { success: false, error: 'Error de conexión con la central de noticias' }
  }
}
