'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function refreshAccountBalances() {
  const supabase = await createClient()

  // Invocar la función RPC 'refresh_accounting_balances' definida en Supabase
  const { error } = await supabase.rpc('refresh_accounting_balances')

  if (error) {
    console.error('Error al refrescar la vista materializada de balances:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/accounting/trial-balance')
  return { success: true }
}

export async function getBalancesFromMaterializedView(organizationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mv_account_balances')
    .select(`
      total_debe,
      total_haber,
      saldo,
      account_id,
      chart_of_accounts:account_id (
        codigo,
        nombre
      )
    `)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error al obtener balances de la vista materializada:', error)
    return []
  }

  // Mapear al mismo formato que espera el TrialBalanceClient
  return (data || []).map((row: any) => {
    const coa = Array.isArray(row.chart_of_accounts) ? row.chart_of_accounts[0] : row.chart_of_accounts
    const debe = Number(row.total_debe || 0)
    const haber = Number(row.total_haber || 0)
    const saldoVal = Number(row.saldo || 0)
    return {
      codigo: coa?.codigo || 'N/A',
      nombre: coa?.nombre || 'Cuenta Desconocida',
      debe,
      haber,
      saldo_deudor: saldoVal > 0 ? saldoVal : 0,
      saldo_acreedor: saldoVal < 0 ? Math.abs(saldoVal) : 0
    }
  }).sort((a: any, b: any) => a.codigo.localeCompare(b.codigo))
}

