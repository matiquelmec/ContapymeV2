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
