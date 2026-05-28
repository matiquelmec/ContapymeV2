'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface VacationRequest {
  id: string
  organization_id: string
  employee_id: string
  fecha_inicio: string
  fecha_fin: string
  dias_solicitados: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  comentarios?: string
  created_at: string
  employees?: {
    nombres: string
    apellido_paterno: string
    apellido_materno: string
  }
}

export interface VacationLedgerEntry {
  id: string
  organization_id: string
  employee_id: string
  fecha: string
  tipo: 'accrual' | 'usage' | 'adjustment'
  dias: number
  comentarios?: string
  created_at: string
}

export async function getVacationRequests(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vacation_requests')
    .select(`
      *,
      employees (
        nombres,
        apellido_paterno,
        apellido_materno
      )
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener solicitudes de vacaciones:', error)
    return []
  }

  return data as unknown as VacationRequest[]
}

export async function getEmployeeVacationLedger(orgId: string, employeeId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vacation_ledger')
    .select('*')
    .eq('organization_id', orgId)
    .eq('employee_id', employeeId)
    .order('fecha', { ascending: false })

  if (error) {
    console.error('Error al obtener ledger de vacaciones:', error)
    return []
  }

  return data as VacationLedgerEntry[]
}

export async function getEmployeeVacationSummary(employeeId: string) {
  const supabase = await createClient()

  // Calcular totales sumando directamente el ledger en la base de datos
  const { data, error } = await supabase
    .from('vacation_ledger')
    .select('tipo, dias')
    .eq('employee_id', employeeId)

  if (error) {
    console.error('Error al obtener balance de vacaciones:', error)
    return { acumulados: 0, tomados: 0, saldo: 0 }
  }

  let acumulados = 0
  let tomados = 0

  for (const entry of data || []) {
    if (entry.tipo === 'accrual') {
      acumulados += Number(entry.dias)
    } else if (entry.tipo === 'usage') {
      tomados += Math.abs(Number(entry.dias))
    } else if (entry.tipo === 'adjustment') {
      if (Number(entry.dias) > 0) {
        acumulados += Number(entry.dias)
      } else {
        tomados += Math.abs(Number(entry.dias))
      }
    }
  }

  return {
    acumulados,
    tomados,
    saldo: acumulados - tomados
  }
}

export async function createVacationRequest(data: {
  organization_id: string
  employee_id: string
  fecha_inicio: string
  fecha_fin: string
  dias_solicitados: number
  comentarios?: string
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('vacation_requests')
    .insert({
      organization_id: data.organization_id,
      employee_id: data.employee_id,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      dias_solicitados: data.dias_solicitados,
      comentarios: data.comentarios || '',
      status: 'pending'
    })

  if (error) {
    console.error('Error al solicitar vacaciones:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/payroll/vacations')
  return { success: true }
}

export async function updateVacationStatus(
  orgId: string,
  requestId: string,
  newStatus: 'pending' | 'approved' | 'rejected' | 'cancelled'
) {
  const supabase = await createClient()

  // Ejecutar actualización
  const { error } = await supabase
    .from('vacation_requests')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Error al actualizar estado de vacaciones:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/payroll/vacations')
  return { success: true }
}
