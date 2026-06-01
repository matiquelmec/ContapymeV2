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

export interface VacationSummary {
  acumulados: number
  tomados: number
  saldo: number
  dias_legales_anuales: number
  fecha_ingreso?: string
}

const MAGALLANES_ANNUAL_VACATION_DAYS = 20

function calculateLegalVacationDays(fechaIngreso?: string | null) {
  if (!fechaIngreso) return 0

  const start = new Date(`${fechaIngreso}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  if (Number.isNaN(start.getTime()) || start > today) return 0

  const elapsedDays = Math.floor((today.getTime() - start.getTime()) / 86_400_000)
  return Number(((elapsedDays * MAGALLANES_ANNUAL_VACATION_DAYS) / 365.25).toFixed(2))
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

export async function getEmployeeVacationSummary(employeeId: string): Promise<VacationSummary> {
  const supabase = await createClient()

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('fecha_ingreso')
    .eq('id', employeeId)
    .single()

  if (employeeError) {
    console.error('Error al obtener fecha de ingreso del empleado:', employeeError)
    return { acumulados: 0, tomados: 0, saldo: 0, dias_legales_anuales: MAGALLANES_ANNUAL_VACATION_DAYS }
  }

  const legalAccrued = calculateLegalVacationDays(employee?.fecha_ingreso)

  // La base legal se calcula por fecha de ingreso. El ledger registra consumos y ajustes.
  const { data, error } = await supabase
    .from('vacation_ledger')
    .select('tipo, dias')
    .eq('employee_id', employeeId)

  if (error) {
    console.error('Error al obtener balance de vacaciones:', error)
    return {
      acumulados: legalAccrued,
      tomados: 0,
      saldo: legalAccrued,
      dias_legales_anuales: MAGALLANES_ANNUAL_VACATION_DAYS,
      fecha_ingreso: employee?.fecha_ingreso
    }
  }

  let ajustes = 0
  let tomados = 0

  for (const entry of data || []) {
    if (entry.tipo === 'usage') {
      tomados += Math.abs(Number(entry.dias))
    } else if (entry.tipo === 'adjustment') {
      ajustes += Number(entry.dias)
    }
  }

  const acumulados = Number((legalAccrued + Math.max(ajustes, 0)).toFixed(2))
  const totalTomados = Number((tomados + Math.abs(Math.min(ajustes, 0))).toFixed(2))
  const saldo = Number((acumulados - totalTomados).toFixed(2))

  return {
    acumulados,
    tomados: totalTomados,
    saldo,
    dias_legales_anuales: MAGALLANES_ANNUAL_VACATION_DAYS,
    fecha_ingreso: employee?.fecha_ingreso
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

export async function createVacationAdjustment(data: {
  organization_id: string
  employee_id: string
  fecha: string
  dias: number
  motivo: string
  comentarios: string
}) {
  const supabase = await createClient()
  const dias = Number(data.dias)
  const comentarios = data.comentarios?.trim()
  const motivo = data.motivo?.trim()

  if (!data.organization_id || !data.employee_id) {
    return { success: false, error: 'Debe seleccionar una organización y colaborador.' }
  }

  if (!data.fecha || Number.isNaN(new Date(`${data.fecha}T12:00:00`).getTime())) {
    return { success: false, error: 'La fecha del ajuste es inválida.' }
  }

  if (!Number.isFinite(dias) || dias === 0) {
    return { success: false, error: 'El ajuste debe ser distinto de cero.' }
  }

  if (!motivo) {
    return { success: false, error: 'Debe seleccionar un motivo de ajuste.' }
  }

  if (!comentarios || comentarios.length < 8) {
    return { success: false, error: 'Debe ingresar un comentario de respaldo de al menos 8 caracteres.' }
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id')
    .eq('id', data.employee_id)
    .eq('organization_id', data.organization_id)
    .single()

  if (employeeError || !employee) {
    return { success: false, error: 'El colaborador no pertenece a la organización activa.' }
  }

  const summary = await getEmployeeVacationSummary(data.employee_id)
  if (summary.saldo + dias < 0) {
    return {
      success: false,
      error: `El ajuste dejaría saldo negativo (${(summary.saldo + dias).toFixed(2)} días). Saldo actual: ${summary.saldo.toFixed(2)}.`
    }
  }

  const { error } = await supabase
    .from('vacation_ledger')
    .insert({
      organization_id: data.organization_id,
      employee_id: data.employee_id,
      fecha: data.fecha,
      tipo: 'adjustment',
      dias,
      comentarios: `${motivo}: ${comentarios}`
    })

  if (error) {
    console.error('Error al ajustar saldo de vacaciones:', error)
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

export interface VacationComprobanteData {
  request: {
    id: string
    fecha_inicio: string
    fecha_fin: string
    dias_solicitados: number
    comentarios?: string
  }
  employee: {
    nombres: string
    apellido_paterno: string
    apellido_materno?: string
    rut: string
    cargo?: string
    fecha_ingreso?: string
  }
  organization: {
    nombre: string
    rut_empresa?: string
    direccion?: string
    comuna?: string
    region?: string
  }
  rep_legal_nombre?: string
  rep_legal_rut?: string
}

/**
 * Reúne todos los datos necesarios para emitir el Comprobante de Feriado
 * Legal (Art. 74 CT) de una solicitud de vacaciones aprobada.
 */
export async function getVacationComprobanteData(
  orgId: string,
  requestId: string
): Promise<{ success: boolean; data?: VacationComprobanteData; error?: string }> {
  const supabase = await createClient()

  const { data: request, error: reqError } = await supabase
    .from('vacation_requests')
    .select(`
      id, fecha_inicio, fecha_fin, dias_solicitados, comentarios, status, employee_id,
      employees ( nombres, apellido_paterno, apellido_materno, rut, cargo, fecha_ingreso )
    `)
    .eq('id', requestId)
    .eq('organization_id', orgId)
    .single()

  if (reqError || !request) {
    return { success: false, error: reqError?.message || 'Solicitud no encontrada.' }
  }

  if (request.status !== 'approved') {
    return { success: false, error: 'Solo se emite comprobante de feriados aprobados.' }
  }

  const employee = (request as any).employees
  if (!employee) {
    return { success: false, error: 'No se encontró el colaborador asociado.' }
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('nombre, rut_empresa, direccion, comuna, region')
    .eq('id', orgId)
    .single()

  const { data: settings } = await supabase
    .from('organization_payroll_settings')
    .select('rep_legal_nombre, rep_legal_rut')
    .eq('organization_id', orgId)
    .maybeSingle()

  return {
    success: true,
    data: {
      request: {
        id: request.id,
        fecha_inicio: request.fecha_inicio,
        fecha_fin: request.fecha_fin,
        dias_solicitados: Number(request.dias_solicitados),
        comentarios: request.comentarios,
      },
      employee: {
        nombres: employee.nombres,
        apellido_paterno: employee.apellido_paterno,
        apellido_materno: employee.apellido_materno,
        rut: employee.rut,
        cargo: employee.cargo,
        fecha_ingreso: employee.fecha_ingreso,
      },
      organization: {
        nombre: organization?.nombre || 'Empresa',
        rut_empresa: organization?.rut_empresa,
        direccion: organization?.direccion,
        comuna: organization?.comuna,
        region: organization?.region,
      },
      rep_legal_nombre: settings?.rep_legal_nombre || undefined,
      rep_legal_rut: settings?.rep_legal_rut || undefined,
    },
  }
}
