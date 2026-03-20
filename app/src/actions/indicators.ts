'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getLatestIndicators() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('economic_indicators')
      .select('*')
    
    if (error) {
      // Solo loguear si hay un error real y no es un problema de sesión expirada
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
    const engineUrl = process.env.ENGINE_URL || 'http://localhost:8000'
    const res = await fetch(`${engineUrl}/api/v1/indicators/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
