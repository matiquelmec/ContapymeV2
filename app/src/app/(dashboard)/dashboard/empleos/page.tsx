import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCompanyJobsAction } from '@/actions/jobs'
import { DashboardJobsClient } from '@/components/dashboard/dashboard-jobs-client'
import { Briefcase } from 'lucide-react'

export const revalidate = 0

export default async function DashboardEmpleosPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return redirect('/login?next=/dashboard/empleos')
  }

  // Obtener perfil y datos de la empresa
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, plan')
    .eq('id', user.id)
    .single()

  const jobsRes = await getCompanyJobsAction()
  const jobs = jobsRes.success ? jobsRes.data : []

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-wider">
          <Briefcase className="h-4 w-4" />
          <span>Gestión Laboral Regional</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
          Bolsa de Empleos de mi Empresa
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Publica ofertas de trabajo en Punta Arenas y Magallanes con auditoría legal Art. 2° DT y kits de difusión con IA.
        </p>
      </div>

      <DashboardJobsClient 
        initialJobs={jobs} 
        companyName={profile?.full_name || ''} 
      />
    </div>
  )
}
