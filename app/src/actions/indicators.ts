'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'

export async function getLatestIndicators() {
  try {
    // Audit: Migrando de acceso directo a Supabase hacia el Engine (Source of Truth)
    // Cache: Aplicamos 1 hora de revalidación para indicadores del día
    const response = await engineFetch('/api/v1/indicators/latest', {
      next: { 
        revalidate: 3600,
        tags: ['indicators'] 
      }
    });

    if (!response.ok) {
        throw new Error("No se pudo obtener indicadores del motor");
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (err: any) {
    console.error("[Indicators Action Error]:", err.message);
    return { success: false, error: err.message };
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
