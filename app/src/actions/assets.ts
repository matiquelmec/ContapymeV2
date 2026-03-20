'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Crear un activo fijo nuevo
export async function createAsset(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { success: false, error: 'Sesión inválida.' }

  const { data: orgs } = await supabase.from('organizations').select('id').limit(1)
  const activeOrgId = orgs?.[0]?.id
  if (!activeOrgId) return { success: false, error: 'No se encontró empresa activa.' }

  const nombre = formData.get('nombre') as string
  const fecha_adquisicion = formData.get('fecha_adquisicion') as string
  const valor_adquisicion = parseInt(formData.get('valor_adquisicion') as string)
  const vida_util_meses = parseInt(formData.get('vida_util_meses') as string)
  const valor_residual = parseInt(formData.get('valor_residual') as string) || 0
  const metodo_depreciacion = formData.get('metodo_depreciacion') as string
  const descripcion = formData.get('descripcion') as string

  // Llamar al Engine Python para crear con los cálculos iniciales
  try {
    const engineUrl = process.env.ENGINE_URL || 'http://localhost:8000'
    const res = await fetch(`${engineUrl}/api/v1/assets/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: activeOrgId,
        nombre,
        descripcion,
        fecha_adquisicion,
        valor_adquisicion,
        vida_util_meses,
        valor_residual,
        metodo_depreciacion,
        condicion: 'activo'
      })
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.detail || 'Error al crear activo.' }
    }

    revalidatePath('/dashboard/assets')
    return { success: true }

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Error de conexión: ${errorMessage}` }
  }
}

// Calcular depreciación del período sobre todos los activos
export async function depreciateAssets() {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { success: false, error: 'Sesión inválida.' }

  const { data: orgs } = await supabase.from('organizations').select('id').limit(1)
  const activeOrgId = orgs?.[0]?.id
  if (!activeOrgId) return { success: false, error: 'No se encontró empresa activa.' }

  try {
    const engineUrl = process.env.ENGINE_URL || 'http://localhost:8000'
    const periodo = new Date().toISOString().split('T')[0].substring(0, 8) + '01'

    const res = await fetch(`${engineUrl}/api/v1/assets/depreciate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: activeOrgId, periodo })
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.detail || 'Error al calcular depreciación.' }
    }

    const data = await res.json()
    revalidatePath('/dashboard/assets')
    return { success: true, count: data.processed_count as number, skipped: data.skipped_count as number }

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Motor Python inalcanzable: ${errorMessage}` }
  }
}
