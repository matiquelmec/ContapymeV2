'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'
import { parseError } from '@/lib/utils/errors'
import { Indicator } from '@/lib/types/dashboard'

export async function getLatestIndicators() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('economic_indicators')
      .select('*')
      .order('codigo')
    
    if (error) {
      console.error('[DATABASE ERROR] Fallo al obtener indicadores:', error.message)
      return { success: false, error: 'No se pudieron obtener indicadores de la base de datos.', data: [] }
    }

    return { success: true, data: (data as Indicator[]) || [] }
  } catch (err: any) {
    console.error("[Indicators Action Error]:", err.message);
    return { success: false, error: 'Error de conexión con la central de indicadores.', data: [] }
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
      return { success: false, error: parseError(err.detail || 'Error al actualizar indicadores.') }
    }

    const data = await res.json()
    revalidatePath('/dashboard')
    revalidatePath('/')
    return {
      success: true,
      total: data.total as number,
      errores: data.errores as string[]
    }
  } catch (err: any) {
    return { success: false, error: `Motor Python inalcanzable: ${err.message}` }
  }
}
