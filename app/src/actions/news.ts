'use server'

import { createClient } from '@/lib/supabase/server'
import { MOCK_NEWS } from '@/lib/news-mocks'

export async function getRegionalNews() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('regional_news')
      .select('*')
      .order('published_at', { ascending: false })
    
    // Si la tabla no existe (PGRST205) o hay error, devolvemos los mocks para no romper el UI Premium
    if (error || !data || data.length === 0) {
      console.warn('[GET NEWS WARNING] Usando Fallback de noticias mock.', error?.message)
      return { success: true, data: MOCK_NEWS, isFallback: true }
    }

    return { success: true, data }
  } catch (err: any) {
    return { success: true, data: MOCK_NEWS, isFallback: true }
  }
}
