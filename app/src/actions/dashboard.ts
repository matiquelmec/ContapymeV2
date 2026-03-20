'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:8000'

export async function getExecutiveMetrics(year: number, providedOrgId?: string) {
  try {
    const supabase = await createClient()
    
    let orgId = providedOrgId
    if (!orgId) {
      const { getActiveOrganizationId } = await import('@/actions/organizations')
      orgId = await getActiveOrganizationId() || undefined
    }

    if (!orgId) {
      throw new Error("No hay organización activa configurada")
    }



    // Llamar al motor Python (FastAPI) para el cálculo pesado
    const response = await fetch(`${ENGINE_URL}/api/v1/dashboard/executive-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_id: orgId,
        year: year
      }),
      cache: 'no-store'
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Error en motor financiero: ${err}`)
    }

    const result = await response.json()

    
    if (!result.success) {
      throw new Error(result.error || "El motor financiero devolvió un error")
    }

    return result.data
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error obteniendo métricas ejecutivas:", errorMessage);
    return {
      error: errorMessage || 'Error desconocido al calcular métricas'
    }
  }
}
