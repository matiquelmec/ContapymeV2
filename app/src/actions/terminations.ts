'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'
import { parseError } from '@/lib/utils/errors'

export async function calculateTerminationAction(data: {
  employee_id: string,
  organization_id: string,
  fecha_termino: string,
  causal_despido: string,
  aviso_previo: boolean,
  dias_vacaciones_tomados: number,
  pending_overtime_amount: number,
  other_bonuses: number,
  asignacion_colacion?: number,
  asignacion_movilizacion?: number,
  viaticos?: number,
  prestamo_ccaf?: number,
  anticipo_sueldo?: number,
  banco_transferencia?: string,
  tipo_cuenta?: string,
  cuenta_transferencia?: string
}) {
  try {
    const response = await engineFetch('/api/v1/terminations/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
      cache: 'no-store'
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error en el Motor Python' }))
      return { success: false, error: parseError(err.detail || 'Error en el Motor Python') }
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
        const response = await engineFetch(`/api/v1/terminations/${terminationId}/document/${docType}`, {
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
        const response = await engineFetch('/api/v1/terminations/causes', {
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
export async function finalizeTerminationAction(terminationId: string, employee_id: string, endDate: string, signature_base64?: string) {
    try {
        const supabase = await createClient()
        
        // 1. Marcar el finiquito como firmado y guardar la firma
        const { error: termError } = await supabase
            .from('employee_terminations')
            .update({ 
                status: 'firmado',
                signature_base64: signature_base64 || null // Asumimos que la columna existe o la usaremos en el engine
            })
            .eq('id', terminationId)
        
        if (termError) throw termError

        // 2. Desactivar al empleado
        const { error: empError } = await supabase
            .from('employees')
            .update({ 
                activo: false, 
                fecha_termino: endDate 
            })
            .eq('id', employee_id)
        
        if (empError) throw empError

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/payroll')
        revalidatePath('/dashboard/payroll/terminations')
        revalidatePath('/dashboard/payroll/contracts')
        
        return { success: true }
    } catch (error: any) {
        const errorMessage = error?.message || error?.details || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        console.error('Action error finalizing termination:', error);
        return { success: false, error: errorMessage };
    }
}

export async function downloadTerminationDocAction(terminationId: string, docType: string) {
  try {
    const response = await engineFetch(`/api/v1/terminations/${terminationId}/download/${docType}`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error en el Motor Python' }));
      return { success: false, error: parseError(err.detail || 'Error en el Motor Python') };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return { 
      success: true, 
      base64Doc: base64,
      filename: `${docType}_${terminationId.substring(0,8)}.docx` 
    };

  } catch (err: any) {
    return { success: false, error: `Error de red: ${err.message}` };
  }
}

export async function exportTerminationCsvAction(terminationId: string) {
  try {
    const response = await engineFetch(`/api/v1/terminations/${terminationId}/export-dt-csv`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error en el Motor Python' }));
      return { success: false, error: parseError(err.detail || 'Error en el Motor Python') };
    }

    const text = await response.text();
    return { 
      success: true, 
      content: text,
      filename: `FINIQUITO_DT_${terminationId.substring(0,8)}.csv` 
    };

  } catch (err: any) {
    return { success: false, error: `Error de red: ${err.message}` };
  }
}

