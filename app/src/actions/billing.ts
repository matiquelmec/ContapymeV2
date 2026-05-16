'use server'

import { createClient } from '@/lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'
import { revalidatePath } from 'next/cache'

export async function getDTEsForOrganization(organizationId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('dte_issued')
      .select('*, dte_companies(razon_social, rut)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('[DTE Action Error]:', err.message)
    return { success: false, error: err.message, data: [] }
  }
}

export async function getDTEStats(organizationId: string) {
  try {
    const supabase = await createClient()

    const { count: totalDTEs } = await supabase
      .from('dte_issued')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    const { count: acceptedDTEs } = await supabase
      .from('dte_issued')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'accepted')

    const { count: signedDTEs } = await supabase
      .from('dte_issued')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'signed')

    const { data: totalRow } = await supabase
      .from('dte_issued')
      .select('monto_total')
      .eq('organization_id', organizationId)

    const totalFacturado = (totalRow || []).reduce((sum: number, r: any) => sum + (r.monto_total || 0), 0)

    const { count: availableFolios } = await supabase
      .from('dte_caf_folios')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    return {
      success: true,
      data: {
        totalDTEs: totalDTEs || 0,
        acceptedDTEs: acceptedDTEs || 0,
        signedDTEs: signedDTEs || 0,
        totalFacturado,
        availableFolios: availableFolios || 0,
      }
    }
  } catch (err: any) {
    console.error('[DTE Stats Error]:', err.message)
    return { success: false, error: err.message, data: null }
  }
}

export async function issueDTE(formData: {
  organization_id: string
  tipo_dte: number
  receptor_rut: string
  receptor_razon_social: string
  receptor_giro?: string
  monto_neto: number
  monto_iva: number
  monto_total: number
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
    total_amount: number
  }>
}) {
  try {
    const response = await engineFetch('/api/v1/dte/issue', {
      method: 'POST',
      body: JSON.stringify(formData),
      cache: 'no-store',
    })

    if (!response.ok) {
      const err = await response.json()
      return { success: false, error: err.detail || 'Error al emitir DTE.' }
    }

    const data = await response.json()
    revalidatePath('/dashboard/billing')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: `Motor Python inalcanzable: ${err.message}` }
  }
}

export async function exportDTEToCSV(organizationId: string) {
  try {
    const res = await getDTEsForOrganization(organizationId)
    if (!res.success) return { success: false, error: res.error }

    const dtes = res.data
    const headers = ['Tipo Docto', 'Folio', 'RUT Receptor', 'Razón Social', 'Fecha', 'Monto Neto', 'Monto IVA', 'Monto Total']
    
    const rows = dtes.map((d: any) => [
      d.tipo_dte,
      d.folio,
      d.receptor_rut,
      d.receptor_razon_social,
      new Date(d.fecha_emision).toLocaleDateString('es-CL'),
      d.monto_neto,
      d.monto_iva,
      d.monto_total
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map((row: any) => row.join(';'))
    ].join('\n')

    return { success: true, data: csvContent }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
