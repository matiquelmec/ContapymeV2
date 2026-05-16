'use server'

import { revalidatePath } from 'next/cache'
import { engineFetch } from '@/lib/engine-client'
import { parseError } from '@/lib/utils/errors'

export async function getLatestIndicators() {
  try {
    const response = await engineFetch('/api/v1/indicators/latest', {
      cache: 'no-store'
    })
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { success: false, error: parseError(errorData.detail || 'No se pudieron obtener indicadores.') }
    }
    const result = await response.json()
    return { success: true, data: result.data || [] }
  } catch (err: any) {
    return { success: false, error: 'Motor fuera de línea.' }
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
