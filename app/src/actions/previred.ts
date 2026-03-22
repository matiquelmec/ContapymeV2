'use server'

import { getActiveOrganizationId } from './organizations'

export async function exportPreviredAction(clientOrgId: string, periodo: string) {
  try {
    // BLINDAJE DE SEGURIDAD: Nunca confiar en el ID enviado desde el cliente.
    // Extraemos el organization_id directamente desde la cookie HttpOnly encriptada.
    const activeOrgId = await getActiveOrganizationId()
    
    if (!activeOrgId) {
      return { success: false, error: 'Sesión no válida o sin empresa activa.' }
    }

    const engineUrl = process.env.ENGINE_URL || 'http://localhost:8000'
    
    // El periodo debe venir como YYYY-MM-01
    const response = await fetch(`${engineUrl}/api/v1/previred/export-previred/${activeOrgId}?periodo=${periodo}`, {
      method: 'GET',
      cache: 'no-store'
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error en el Motor Python' }))
      return { success: false, error: err.detail }
    }

    const text = await response.text()
    
    return { 
      success: true, 
      content: text,
      filename: `previred_${activeOrgId.substring(0,4)}_${periodo}.txt` 
    }

  } catch (err: any) {
    return { success: false, error: `Error de red: ${err.message}` }
  }
}
