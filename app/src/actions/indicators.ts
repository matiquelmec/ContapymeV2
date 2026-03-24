'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'

export async function getLatestIndicators() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('economic_indicators')
      .select('*')
    
    if (error) {
      if (error.code !== 'PGRST116') { 
        console.warn('[Indicators] Nota: Usando valores de referencia (fuera de línea).', error.message || '');
      }
      return { success: false, error: 'Servicio de indicadores temporalmente fuera de línea.' }
    }

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateIndicators() {
  try {
    const res = await engineFetch('/api/v1/indicators/update', {
      method: 'POST',
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.detail || 'Error al actualizar indicadores.' }
    }

    const data = await res.json()
    revalidatePath('/dashboard')
    return {
      success: true,
      total: data.total as number,
      errores: data.errores as string[]
    }
  } catch (err: any) {
    return { success: false, error: `Motor Python inalcanzable: ${err.message}` }
  }
}
