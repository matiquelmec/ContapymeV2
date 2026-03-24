'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrganizationId } from './organizations'
import { engineFetch } from '@/lib/engine-client'

export async function centralizePayroll(period: string) {
  const supabase = await createClient()
  
  // 1. Validar Sesión Activa
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { success: false, error: 'Sesión inválida.' }

  // 2. Obtener organización activa
  const activeOrgId = await getActiveOrganizationId()
  if (!activeOrgId) return { success: false, error: 'No se encontró empresa activa.' }

  // 3. Disparar centralización al Backend
  try {
    // Mantener string de periodo a YYYY-MM-DD igual que process_payroll
    const sqlPeriod = period.length === 7 ? `${period}-01` : period;

    const res = await engineFetch('/api/v1/accounting/generate-from-payroll', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: activeOrgId,
        periodo: sqlPeriod
      })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Fallo al centralizar remuneraciones.' }))
      return { success: false, error: errData.detail || 'Fallo contable.' }
    }

    const data = await res.json()

    // 4. Refrescar UI (Payroll y Accounting)
    revalidatePath('/dashboard/payroll')
    revalidatePath('/dashboard/accounting')
    
    return { success: data.success, created: data.entries_created, message: data.message }

  } catch (err: any) {
    console.error("Server Action Centralize Exception:", err)
    return { success: false, error: `Error interno de conexión o proceso: ${err.message}` }
  }
}
