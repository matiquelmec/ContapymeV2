import { createClient } from '@/lib/supabase/server'
import { getActiveOrganizationId } from '@/actions/organizations'
import { getAccountingPeriods } from '@/actions/accounting-periods'
import { PeriodsClient } from './periods-client'

export default async function PeriodsPage() {
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return (
      <div className="p-8 text-center text-muted-foreground font-bold italic">
        Seleccione una empresa en el encabezado para configurar los periodos contables.
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
  const year = new Date().getFullYear()
  const periods = await getAccountingPeriods(activeOrgId, year)

  return (
    <PeriodsClient
      initialPeriods={periods}
      activeOrgId={activeOrgId}
      activeOrgName={activeOrgName}
    />
  )
}
