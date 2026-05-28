'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveOrganizationId } from '@/actions/organizations'
import { getVacationRequests } from '@/actions/vacations'
import { VacationsClient } from './vacations-client'

export default async function VacationsPage() {
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return (
      <div className="p-8 text-center text-muted-foreground font-bold italic">
        Seleccione una empresa en el encabezado para gestionar las vacaciones.
      </div>
    )
  }

  const supabase = await createClient()
  const { data: orgData } = await supabase
    .from('organizations')
    .select('nombre')
    .eq('id', activeOrgId)
    .single()

  const activeOrgName = orgData?.nombre || 'Ninguna'

  // Cargar todos los empleados activos de la organización para el formulario
  const { data: employees } = await supabase
    .from('employees')
    .select('id, nombres, apellido_paterno, apellido_materno, fecha_ingreso, region, activo')
    .eq('organization_id', activeOrgId)
    .eq('activo', true)
    .order('apellido_paterno', { ascending: true })

  // Cargar solicitudes de vacaciones
  const requests = await getVacationRequests(activeOrgId)

  return (
    <VacationsClient
      initialRequests={requests}
      employees={employees || []}
      activeOrgId={activeOrgId}
      activeOrgName={activeOrgName}
    />
  )
}
