import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyJobsAction } from '@/actions/jobs'
import { DashboardJobsClient } from '@/components/dashboard/dashboard-jobs-client'
import { Briefcase, Shield, ArrowRight } from 'lucide-react'

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

  const isAdmin = (profile?.role || '').toLowerCase() === 'admin' || (profile?.plan || '').toLowerCase() === 'consorcio'
  const jobsRes = await getCompanyJobsAction()
  const jobs = jobsRes.success ? jobsRes.data : []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {isAdmin && (
        <div className="p-4 rounded-3xl bg-indigo-50/80 border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 text-indigo-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
              <Shield className="h-5 w-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <strong className="font-black uppercase tracking-wider block text-indigo-900">
                Rol de Superadministrador Activo ({profile?.full_name})
              </strong>
              <p className="text-indigo-700 font-medium">
                En esta pestaña gestionas las vacantes privadas de tu empresa. Para ver y moderar todas las vacantes de la región, ingresa al panel global.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 shrink-0 shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>Consola Superadmin</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

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
