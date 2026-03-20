'use server'

export async function exportPreviredAction(organizationId: string, periodo: string) {
  try {
    const engineUrl = process.env.ENGINE_URL || 'http://localhost:8000'
    
    // El periodo debe venir como YYYY-MM-01
    const response = await fetch(`${engineUrl}/api/v1/previred/export-previred/${organizationId}?periodo=${periodo}`, {
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
      filename: `previred_${organizationId.substring(0,4)}_${periodo}.txt` 
    }

  } catch (err: any) {
    return { success: false, error: `Error de red: ${err.message}` }
  }
}
