'use server'

import { createClient } from '@/lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'
import { revalidatePath } from 'next/cache'

import { parseError } from '@/lib/utils/errors'
import { recordAuditAction } from '@/actions/audit'

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
    return { success: false, error: parseError(err), data: [] }
  }
}

export async function getDTEStats(organizationId: string) {
  try {
    const supabase = await createClient()

    const { count: totalDTEs } = await supabase
      .from('dte_issued')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['signed', 'accepted', 'sent'])

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
      .in('status', ['signed', 'accepted', 'sent'])

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
    return { success: false, error: parseError(err), data: null }
  }
}

export async function issueDTE(formData: {
  organization_id: string
  tipo_dte: number
  receptor_rut: string
  receptor_razon_social: string
  receptor_giro?: string
  receptor_direccion?: string
  receptor_comuna?: string
  receptor_ciudad?: string
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
      let errorMessage = 'Error al emitir DTE.'
      try {
        const err = await response.json()
        errorMessage = err.detail || errorMessage
      } catch (jsonErr) {
        try {
          const textErr = await response.text()
          errorMessage = textErr.substring(0, 150) || errorMessage
        } catch (textErr) {
          // ignore
        }
      }
      return { success: false, error: parseError(errorMessage) }
    }

    const data = await response.json()
    revalidatePath('/dashboard/billing')
    revalidatePath('/dashboard/accounting/journal')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: `Motor Python inalcanzable: ${err.message}` }
  }
}

export async function exportDTEToCSV(organizationId: string) {
  try {
    const res = await getDTEsForOrganization(organizationId)
    if (!res.success) return { success: false, error: res.error }

    const dtes = res.data.filter((d: any) => ['signed', 'accepted', 'sent'].includes(d.status))
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

export async function getDTEConfig(organizationId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('dte_companies')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { success: true, data: null }
      throw error
    }
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: parseError(err), data: null }
  }
}

export async function updateDTEConfig(organizationId: string, formData: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const payload = { ...formData }

    if (payload.id) {
      // Actualizar registro existente
      const { id, ...updateData } = payload;
      const { error } = await supabase
        .from('dte_companies')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('organization_id', organizationId);
      
      if (error) throw error;
    } else {
      // Crear nuevo registro
      delete payload.id;
      const { error } = await supabase
        .from('dte_companies')
        .insert({
          organization_id: organizationId,
          ...payload,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
    }

    await recordAuditAction({
      action: 'UPDATE_DTE_CONFIG',
      entity_type: 'DTE_COMPANY',
      entity_id: organizationId,
      details: { rut: formData.rut }
    })

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: parseError(err) }
  }
}

export async function uploadCAF(organizationId: string, xmlContent: string, environment: string = 'certification') {
  try {
    const response = await engineFetch('/api/v1/dte/upload-caf', {
      method: 'POST',
      body: {
        organization_id: organizationId,
        xml_content: xmlContent,
        environment
      }
    })

    if (!response.ok) {
      const errData = await response.json()
      return { success: false, error: parseError(errData.detail || 'Error al subir CAF') }
    }

    const data = await response.json()

    if (data.success) {
      await recordAuditAction({
        action: 'UPLOAD_CAF',
        entity_type: 'DTE_CAF',
        entity_id: organizationId,
        details: data.details
      })
      revalidatePath('/dashboard/settings')
    }

    return data
  } catch (err: any) {
    return { success: false, error: parseError(err) }
  }
}

export async function getCAFRecords(organizationId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('dte_caf_folios')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: parseError(err), data: [] }
  }
}

export async function uploadPFX(organizationId: string, base64Content: string, certPassword: string) {
  try {
    const response = await engineFetch('/api/v1/dte/upload-pfx', {
      method: 'POST',
      body: {
        organization_id: organizationId,
        pfx_base64: base64Content,
        cert_password: certPassword
      }
    })

    if (!response.ok) {
      const errData = await response.json()
      return { success: false, error: parseError(errData.detail || 'Error al procesar el certificado PFX') }
    }

    const data = await response.json()

    if (data.success) {
      await recordAuditAction({
        action: 'UPLOAD_PFX',
        entity_type: 'DTE_CERT',
        entity_id: organizationId,
        details: 'Certificado digital actualizado'
      })
      revalidatePath('/dashboard/settings')
    }

    return data
  } catch (err: any) {
    return { success: false, error: parseError(err) }
  }
}
