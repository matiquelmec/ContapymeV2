'use server'

import { createClient } from '@/lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'

export async function generateContractAction(employeeId: string) {
  try {
    const supabase = await createClient()

    // 1. Get current session to verify auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'No autorizado' }
    }
    
    // 2. Call Python Engine to generate the DOCX
    const response = await engineFetch(`/api/v1/documents/generate?employee_id=${employeeId}&type=contrato`, {
      method: 'GET',
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
