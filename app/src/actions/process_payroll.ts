'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrganizationId } from './organizations'
import { engineFetch } from '@/lib/engine-client'

export async function processPayroll(period?: string) {
  const supabase = await createClient()
  
  // 1. Validar Sesión Activa (Server-side)
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { success: false, error: 'Sesión inválida.' }

  // 2. Obtener organización activa real del contexto (Cookies)
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) return { success: false, error: 'No se encontró empresa activa seleccionada.' }

  // 3. Disparar Motor Matemático Python
  try {
    const now = new Date()
    const currentPeriod = period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const res = await engineFetch('/api/v1/payroll/process', {
      method: 'POST',
      body: JSON.stringify({
        org_id: activeOrgId,
        periodo: currentPeriod
      })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Fallo en Motor Matemático Payroll.' }))
      return { success: false, error: errData.detail || 'Fallo en Motor Matemático Payroll.' }
    }

    const payrollData = await res.json()

    // 4. El Motor Python ya guardó y generó los datos. Ordenamos refrescar la UI.
    revalidatePath('/dashboard/payroll')
    return { success: true, count: payrollData.processed_count }

  } catch (err: any) {
    console.error("Server Action Payroll Exception:", err)
    return { success: false, error: `Error interno de conexión o proceso: ${err.message}` }
  }
}
