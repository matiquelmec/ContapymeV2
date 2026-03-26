'use server'

import { createClient } from '@/lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'

export async function generateContractAction(employeeId: string, signature_base64?: string, type: string = 'contrato') {
  try {
    const supabase = await createClient()

    // 1. Get current session to verify auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'No autorizado' }
    }
    
    // 2. Guardar la firma en la DB si existe
    if (signature_base64) {
      await supabase.from('employment_contracts')
        .update({ 
            signature_base64,
            status: 'firmado'
        })
        .eq('employee_id', employeeId)
        .eq('tipo_documento', type)
    }
    
    // 3. Call Python Engine to generate the DOCX
    const response = await engineFetch(`/api/v1/documents/generate`, {
      method: 'POST',
      body: JSON.stringify({
        employee_id: employeeId,
        type: type,
        signature_base64: signature_base64,
        description: "" // Opcional
      }),
      cache: 'no-store'
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error en el Motor Python' }))
      return { success: false, error: err.detail }
    }

    // 3. Return the arrayBuffer to be downloaded by the client
    const arrayBuffer = await response.arrayBuffer()
    
    // We can't return ArrayBuffer directly from Server Action to Client Component in Next.js
    // So we convert it to base64
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return { 
      success: true, 
      base64Doc: base64,
      filename: `Contrato_${employeeId.substring(0,6)}.docx` 
    }

  } catch (err: any) {
    return { success: false, error: `Error de red: ${err.message}` }
  }
}
