'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../lib/supabase/server'

export async function calculateTerminationAction(data: {
  employee_id: string,
  organization_id: string,
  fecha_termino: string,
  causal_despido: string,
  aviso_previo: boolean,
  dias_vacaciones_tomados: number,
  pending_overtime_amount: number,
  other_bonuses: number
}) {
  try {
    const engineUrl = process.env.ENGINE_URL || 'http://localhost:8000'
    
    const response = await fetch(`${engineUrl}/api/v1/terminations/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      cache: 'no-store'
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error en el Motor Python' }))
      return { success: false, error: err.detail }
    }

    const result = await response.json()
    revalidatePath('/dashboard/payroll/terminations')
    
    return { 
      success: true, 
      data: result.data 
    }

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Error de red: ${errorMessage}` }
  }
}

export async function deleteTerminationAction(terminationId: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from('employee_terminations').delete().eq('id', terminationId)
        
        if (error) {
            console.error('Error deleting termination:', error)
            return { success: false, error: error.message }
        }
        
        revalidatePath('/dashboard/payroll/terminations')
        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Action error deleting termination:', error)
        return { success: false, error: errorMessage }
    }
}

export async function getTerminationDocumentAction(terminationId: string, docType: string) {
    try {
        const engineUrl = process.env.ENGINE_URL || 'http://localhost:8000'
        const response = await fetch(`${engineUrl}/api/v1/terminations/${terminationId}/document/${docType}`, {
            cache: 'no-store'
        })
        
        if (!response.ok) {
            return { success: false, error: 'Error al generar documento en el motor' }
        }
        
        const data = await response.json()
        return { success: true, data: data.data }
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        return { success: false, error: errorMessage }
    }
}

export async function getTerminationCausesAction() {
    try {
        const engineUrl = process.env.ENGINE_URL || 'http://localhost:8000'
        const response = await fetch(`${engineUrl}/api/v1/terminations/causes`, {
            cache: 'no-store'
        })
        
        if (!response.ok) {
            return { success: false, error: 'Error al obtener causales' }
        }
        
        const data = await response.json()
        return { success: true, data: data.data }
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        return { success: false, error: errorMessage }
    }
}
export async function finalizeTerminationAction(terminationId: string, employeeId: string, endDate: string) {
    try {
        const supabase = await createClient()
        
        // 1. Marcar el finiquito como firmado
        const { error: termError } = await supabase
            .from('employee_terminations')
            .update({ status: 'firmado' })
            .eq('id', terminationId)
        
        if (termError) throw termError

        // 2. Desactivar al empleado
        const { error: empError } = await supabase
            .from('employees')
            .update({ 
                activo: false, 
                fecha_termino: endDate 
            })
            .eq('id', employeeId)
        
        if (empError) throw empError

        revalidatePath('/dashboard/payroll')
        revalidatePath('/dashboard/payroll/terminations')
        
        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Action error finalizing termination:', error)
        return { success: false, error: errorMessage }
    }
}
