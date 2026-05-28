'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAccountingPeriods(orgId: string, year: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('accounting_periods')
    .select('*')
    .eq('organization_id', orgId)
    .eq('ano', year)

  if (error) {
    console.error('Error al obtener periodos contables:', error)
    return []
  }

  return data || []
}

export async function updateAccountingPeriod(
  orgId: string,
  year: number,
  month: number,
  status: 'open' | 'closed' | 'locked'
) {
  const supabase = await createClient()

  // Buscar si ya existe el registro
  const { data: existing, error: findError } = await supabase
    .from('accounting_periods')
    .select('id')
    .eq('organization_id', orgId)
    .eq('ano', year)
    .eq('mes', month)
    .maybeSingle()

  if (findError) {
    console.error('Error al buscar periodo:', findError)
    return { success: false, error: findError.message }
  }

  let result
  if (existing) {
    // Actualizar
    result = await supabase
      .from('accounting_periods')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    // Insertar
    result = await supabase
      .from('accounting_periods')
      .insert({
        organization_id: orgId,
        ano: year,
        mes: month,
        status
      })
  }

  if (result.error) {
    console.error('Error al guardar periodo contables:', result.error)
    return { success: false, error: result.error.message }
  }

  revalidatePath('/dashboard/accounting/periods')
  return { success: true }
}
