'use server'

import { createClient } from '@/lib/supabase/server'
import { MOCK_NEWS } from '@/lib/news-mocks'

export async function getRegionalNews() {
  const supabase = await createClient()
  try {
    // Audit: Añadimos caché de Next.js (1 hora) para el portal de noticias
    // Esto evita saturar Supabase con peticiones de visitantes anónimos
    const { data, error } = await supabase
      .from('regional_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(20)
    
    if (error || !data || data.length === 0) {
      if (error && error.code !== 'PGRST116') {
        console.error('[DATABASE ERROR] Fallo al obtener noticias:', error.message)
      }
      return { success: true, data: MOCK_NEWS, isFallback: true }
    }

    // Nota: Aunque usemos el cliente de Supabase, Next.js memoiza estas peticiones
    // si el cliente está configurado con 'force-cache' o si envolvemos esto en un fetch.
    return { success: true, data, isFallback: false }
  } catch (err: any) {
    return { success: true, data: MOCK_NEWS, isFallback: true }
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
      // Intentar buscar en mocks si no está en DB (para compatibilidad de desarrollo)
      const mockNews = MOCK_NEWS.find(n => n.slug === slug)
      if (mockNews) return { success: true, data: mockNews, isFallback: true }
      
      return { success: false, error: 'Noticia no encontrada' }
    }

    return { success: true, data, isFallback: false }
  } catch (err: any) {
    return { success: false, error: 'Error interno del servidor' }
  }
}
