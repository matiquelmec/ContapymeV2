'use server'

import { getActiveOrganizationId } from './organizations'
import { engineFetch } from '@/lib/engine-client'

export async function exportDJ1887Action(anio: number, type: 'xml' | 'excel') {
  try {
    const activeOrgId = await getActiveOrganizationId()
    if (!activeOrgId) {
      return { success: false, error: 'Sesión no válida o sin empresa activa.' }
    }

    const endpoint = `/api/v1/dj1887/export-${type}/${activeOrgId}?anio=${anio}`
    const response = await engineFetch(endpoint, {
      method: 'GET',
      cache: 'no-store'
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error en el Motor Python al generar DJ1887' }))
      return { success: false, error: err.detail }
    }

    // Convertir el stream binario en base64 para poder enviarlo de forma segura a través de Server Actions
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    
    const filename = type === 'xml' 
      ? `DJ1887_${activeOrgId.substring(0,4)}_${anio}.xml`
      : `DJ1887_${activeOrgId.substring(0,4)}_${anio}.xlsx`

    return {
      success: true,
      base64,
      filename,
      mediaType: type === 'xml' ? 'application/xml' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

  } catch (err: any) {
    return { success: false, error: `Error de red: ${err.message}` }
  }
}

export async function uploadPreviredPDFAction(formData: FormData) {
  try {
    const activeOrgId = await getActiveOrganizationId()
    if (!activeOrgId) {
      return { success: false, error: 'Sesión no válida o sin empresa activa.' }
    }

    const response = await fetch(`${process.env.INTERNAL_ENGINE_URL || 'http://localhost:8000'}/api/v1/previred-importer/upload/${activeOrgId}`, {
      method: 'POST',
      body: formData,
      // Nota: No configuramos headers para dejar que el navegador o Node detecten el límite de multipart/form-data
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error parseando el PDF de Previred' }))
      return { success: false, error: err.detail }
    }

    const data = await response.json()
    return {
      success: true,
      periodo: data.periodo,
      empleados_creados: data.empleados_creados,
      liquidaciones_creadas: data.liquidaciones_creadas,
      message: data.message
    }
  } catch (err: any) {
    return { success: false, error: `Error de red al importar PDF: ${err.message}` }
  }
}
