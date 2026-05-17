'use server'

import { createClient } from '@/lib/supabase/server'

export async function getExecutiveMetrics(year: number, providedOrgId?: string, refresh: boolean = false) {
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

    const { engineFetch } = await import('@/lib/engine-client')

    // Llamar al motor Python (FastAPI) para el cálculo pesado
    const response = await engineFetch('/api/v1/dashboard/executive-metrics', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: orgId,
        year: year,
        refresh: refresh
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error obteniendo métricas ejecutivas:", errorMessage)
    return {
      error: errorMessage || 'Error desconocido al calcular métricas'
    }
  }
}

export async function getRegionalNews() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('regional_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(6)
      
    if (error) {
       console.log("Error regional_news:", error.message)
       return { success: false, data: [] }
    }
    return { success: true, data: data || [] }
  } catch (err) {
    console.error("error fetching news:", err)
    return { success: false, data: [] }
  }
}
