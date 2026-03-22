'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cleanRUT } from '@/lib/utils/rut'

export async function createEmployee(formData: FormData) {
  const supabase = await createClient()

  // 1. Obtener sesión y empresa activa real
  const { getActiveOrganizationId } = await import('./organizations')
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) return { success: false, error: 'No se encontró empresa activa.' }

  // 2. Extraer y limpiar datos del formulario
  const rutInput = formData.get('rut') as string
  const cleanedRut = cleanRUT(rutInput)

  // En un entorno de producción estricto, aquí validaríamos con 'validateRUT()'.
  if (cleanedRut.length < 2) return { success: false, error: 'RUT inválido.' }

  const newEmployee = {
    organization_id: activeOrgId,
    rut: cleanedRut,
    nombres: formData.get('nombres') as string,
    apellido_paterno: formData.get('apellido_paterno') as string,
    apellido_materno: formData.get('apellido_materno') as string,
    cargo: formData.get('cargo') as string,
    tipo_contrato: formData.get('tipo_contrato') as string || 'indefinido',
    sueldo_base: parseInt(formData.get('sueldo_base') as string || '0', 10),
    gratificacion_legal: formData.get('gratificacion_legal') === 'on',
    afp: formData.get('afp') as string,
    prevision_salud: formData.get('prevision_salud') as string,
    fecha_ingreso: formData.get('fecha_ingreso') as string,
    descripcion_cargo: formData.get('descripcion_cargo') as string || '',
    horas_semanales: parseInt(formData.get('horas_semanales') as string || '44', 10),
    horario_detalle: formData.get('horario_detalle') as string || '',
    nacionalidad: formData.get('nacionalidad') as string || 'Chilena',
    sexo: formData.get('sexo') as string || 'Masculino',
    estado_civil: formData.get('estado_civil') as string || 'Soltero(a)',
    birth_date: formData.get('birth_date') as string || null,
    address: formData.get('address') as string || '',
    city: formData.get('city') as string || '',
    region: formData.get('region') as string || '',
    family_allowances: parseInt(formData.get('family_allowances') as string || '0', 10),
    afc_active: formData.get('afc_active') === 'on',
    asignacion_colacion: parseInt(formData.get('asignacion_colacion') as string || '0', 10),
    asignacion_movilizacion: parseInt(formData.get('asignacion_movilizacion') as string || '0', 10),
    bono_fijo: parseInt(formData.get('bono_fijo') as string || '0', 10),
    email: formData.get('email') as string || '',
    phone: formData.get('phone') as string || '',
    activo: true
  }

  // 3. Insertar en Base de Datos
  const { error: dbErr } = await supabase.from('employees').insert(newEmployee)

  if (dbErr) {
    if (dbErr.code === '23505') { // Violación de unicidad en PostgreSQL
      return { success: false, error: 'Ya existe un empleado con este RUT en la empresa.' }
    }
    return { success: false, error: `Error DB: ${dbErr.message}` }
  }

  // 4. Refrescar la caché de Next.js para que la tabla se actualice sin recargar la página
  revalidatePath('/dashboard/payroll')
  
  return { success: true }
}

export async function updateEmployee(formData: FormData) {
  const supabase = await createClient()

  // 1. Validar empresa activa
  const { getActiveOrganizationId } = await import('./organizations')
  const activeOrgId = await getActiveOrganizationId()
  if (!activeOrgId) return { success: false, error: 'No se encontró empresa activa.' }

  const id = formData.get('id') as string
  if (!id) return { success: false, error: 'ID de empleado no especificado.' }

  // 2. Extraer datos (Solo los editables en el formulario)
  const updatedData = {
    nombres: formData.get('nombres') as string,
    apellido_paterno: formData.get('apellido_paterno') as string,
    apellido_materno: formData.get('apellido_materno') as string,
    cargo: formData.get('cargo') as string,
    tipo_contrato: formData.get('tipo_contrato') as string,
    sueldo_base: parseInt(formData.get('sueldo_base') as string || '0', 10),
    afp: formData.get('afp') as string,
    prevision_salud: formData.get('prevision_salud') as string,
    fecha_ingreso: formData.get('fecha_ingreso') as string,
    asignacion_colacion: parseInt(formData.get('asignacion_colacion') as string || '0', 10),
    asignacion_movilizacion: parseInt(formData.get('asignacion_movilizacion') as string || '0', 10),
    bono_fijo: parseInt(formData.get('bono_fijo') as string || '0', 10),
    email: formData.get('email') as string || '',
    phone: formData.get('phone') as string || '',
  }

  // 3. Update en DB
  const { error } = await supabase
    .from('employees')
    .update(updatedData)
    .eq('id', id)
    .eq('organization_id', activeOrgId)

  if (error) return { success: false, error: `Error DB: ${error.message}` }

  revalidatePath('/dashboard/payroll')
  return { success: true }
}

export async function deleteEmployee(employeeId: string) {
  const supabase = await createClient()

  // 1. Validar Sesión y Empresa
  const { getActiveOrganizationId } = await import('./organizations')
  const activeOrgId = await getActiveOrganizationId()
  if (!activeOrgId) return { success: false, error: 'Sesión o empresa no válida.' }

  // 2. Eliminar Registro con Limpieza de Dependencias (Deep Delete)
  // Nota: Esto permite borrar registros ingresados por error incluso si ya se generaron borradores.
  
  try {
    // A. Eliminar Liquidaciones
    await supabase.from('liquidations').delete().eq('employee_id', employeeId).eq('organization_id', activeOrgId)
    
    // B. Eliminar Contratos
    await supabase.from('employment_contracts').delete().eq('employee_id', employeeId).eq('organization_id', activeOrgId)
    
    // C. Eliminar Finiquitos / Terminaciones
    await supabase.from('employee_terminations').delete().eq('employee_id', employeeId).eq('organization_id', activeOrgId)
    
    // D. Eliminar Documentos
    await supabase.from('employee_documents').delete().eq('employee_id', employeeId).eq('organization_id', activeOrgId)

    // E. Eliminar detalles de libro de remuneraciones
    await supabase.from('payroll_book_details').delete().eq('employee_id', employeeId)

    // F. Finalmente, eliminar el Empleado
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId)
      .eq('organization_id', activeOrgId)

    if (error) return { success: false, error: `Error al eliminar ficha: ${error.message}` }

    revalidatePath('/dashboard/payroll')
    return { success: true }

  } catch (err: any) {
    return { success: false, error: `Fallo crítico en limpieza: ${err.message}` }
  }
}

export async function deleteLiquidation(liquidationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('liquidations')
    .delete()
    .eq('id', liquidationId)

  if (error) return { success: false, error: error.message }

revalidatePath('/dashboard/payroll')
  return { success: true }
}

export async function updateLiquidationStatus(liquidationId: string, newStatus: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('liquidations')
    .update({ status: newStatus })
    .eq('id', liquidationId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/payroll')
  revalidatePath(`/dashboard/payroll/liquidations/${liquidationId}`)
  
  return { success: true }
}

/**
 * Resuelve un folio a los datos completos de la liquidación.
 * Lee la organización activa desde la cookie httpOnly (solo accesible server-side).
 * El folio es único por organización, no globalmente.
 */
export async function getLiquidationByFolio(folio: string) {
  const supabase = await createClient()

  const { getActiveOrganizationId } = await import('./organizations')
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) return { data: null, error: 'No se encontró organización activa.' }

  const { data, error } = await supabase
    .from('liquidations')
    .select('*, employees(*)')
    .eq('folio_number', folio)
    .eq('organization_id', activeOrgId)
    .single()

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}
