'use server'

import { createClient } from '@/lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'
import { parseError } from '@/lib/utils/errors'

export async function processF29Document(storagePath: string, periodo: string, orgId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return { success: false, error: 'Sesión inválida.' }
  }

  try {
    const res = await engineFetch(`/api/v1/f29/process`, {
      method: 'POST',
      body: JSON.stringify({
        storage_path: storagePath,
        org_id: orgId
      })
    })

    if (!res.ok) {
      const errData = await res.json()
      return { success: false, error: parseError(errData.detail || 'Fallo en Motor Matemático Python.') }
    }

    const resData = await res.json()
    const { data: parsedData, audit } = resData

    const { data: dbResult, error: dbErr } = await supabase.from('f29_forms').upsert({
        organization_id: orgId,
        periodo: periodo,
        ventas_netas: parsedData.ventas_netas,
        debito_fiscal: parsedData.debito_fiscal,
        credito_fiscal: parsedData.credito_fiscal,
        iva_determinado: parsedData.iva_determinado,
        iva_a_pagar: parsedData.iva_a_pagar,
        ppm_neto: parsedData.ppm_neto,
        retencion_honorarios: parsedData.retencion_honorarios,
        prestamo_solidario: parsedData.prestamo_solidario,
        total_a_pagar: parsedData.total_a_pagar,
        total_a_favor: parsedData.total_a_favor,
        storage_path: storagePath,
        extraction_method: 'pdfplumber',
        extraction_confidence: 0.95,
        parsed_at: new Date().toISOString()
    }, { onConflict: 'organization_id, periodo' }).select().single()

    if (dbErr) {
        console.error('DB Error saving F29:', dbErr)
        return { success: false, error: 'Fallo al guardar en DB.' }
    }

    // DISPARO AUTOMÁTICO: Centralización Contable Idempotente del Impuesto
    try {
        await engineFetch(`/api/v1/f29/centralize`, {
            method: 'POST',
            body: JSON.stringify({ org_id: orgId, periodo: periodo })
        });
    } catch (centralizeErr) {
        console.error('⚠️ Automagic F29 Centralize failed, but document was saved.', centralizeErr);
    }

    return { success: true, data: { ...dbResult, audit } }

  } catch (err: unknown) {
    return { success: false, error: 'Motor Python fuera de línea.' }
  }
}

export async function getF29History(organizationId: string) {
  try {
    const url = `/api/v1/f29/analysis/history?organization_id=${organizationId}`

    const response = await engineFetch(url, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
        console.error('❌ Engine F29 History Error:', response.status)
        return { success: false, history: [], insights: {} }
    }
    const data = await response.json()

    return data
  } catch (error) {
    console.error('❌ Engine connection failed:', error)
    return { success: false, history: [], insights: {} }
  }
}

export async function getF29List(organizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('f29_forms')
    .select('*')
    .eq('organization_id', organizationId)
    .order('periodo', { ascending: false })
  
  if (error) return []
  return data
}
