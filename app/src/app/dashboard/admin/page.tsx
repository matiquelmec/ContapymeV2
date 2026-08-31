import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNewsClient } from '@/app/admin/admin-news-client'
import { AdminJobsClient } from '@/app/admin/admin-jobs-client'
import Link from 'next/link'
import { 
  ShieldAlert, 
  Newspaper, 
  Briefcase, 
  Building2, 
  ShieldCheck,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const revalidate = 0

export default async function DashboardSuperadminPage() {
  const supabase = await createClient()

  // 1. Obtener la sesión del usuario actual
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return redirect('/login?next=/dashboard/admin')
  }

  // 2. Obtener perfil de la base de datos
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, plan, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return redirect('/login?next=/dashboard/admin&error=' + encodeURIComponent('Sesión expirada o perfil no encontrado.'))
  }

  // 3. Validar permisos de administración
  const userRole = (profile.role || '').toLowerCase()
  const userPlan = (profile.plan || '').toLowerCase()
  const isAuthorized = userRole === 'admin' || userPlan === 'consorcio'

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center p-6 min-h-[60vh]">
        <div className="bg-white border border-border rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl w-fit mx-auto border border-rose-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
              Acceso Restringido ⚓
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Esta sección está reservada exclusivamente para Superadministradores de ContaPymePUQ.
            </p>
          </div>
          <div className="p-4 bg-muted/40 rounded-2xl text-left space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground font-bold block uppercase text-[10px]">Usuario Conectado:</span>
              <strong className="text-foreground font-black text-xs">{profile.full_name || 'Usuario'}</strong>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>
                <span className="text-muted-foreground font-bold block uppercase text-[10px]">Rol:</span>
                <strong className="text-foreground capitalize">{profile.role || 'user'}</strong>
              </div>
              <div>
                <span className="text-muted-foreground font-bold block uppercase text-[10px]">Plan:</span>
                <strong className="text-foreground capitalize">{profile.plan || 'personal'}</strong>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-10 px-5 w-full shadow-md transition-all"
          >
            Volver a Mi Empresa
          </Link>
        </div>
      </div>
    )
  }

  // 4. Obtener listados para la consola de superadmin
  const [newsRes, jobsRes, profilesRes] = await Promise.all([
    supabase.from('regional_news').select('*').order('published_at', { ascending: false }),
    supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, role, plan, updated_at').order('updated_at', { ascending: false }).limit(30),
  ])

  const news = newsRes.data || []
  const jobs = jobsRes.data || []
  const profiles = profilesRes.data || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Rol Activo: Superadministrador ({profile.full_name || 'Admin'})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
            Consola Central de Superadmin
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Panel de control unificado para moderar el Diario Regional, ofertas de empleo y directorio de empresas.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-border bg-white hover:bg-slate-50 text-foreground font-bold text-xs shadow-2xs transition-all hover:scale-105 shrink-0"
        >
          <span>Ver Portada Pública</span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-border shadow-xs bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Noticias Publicadas</span>
              <span className="text-3xl font-black text-foreground">{news.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Newspaper className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border shadow-xs bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Empleos Activos</span>
              <span className="text-3xl font-black text-emerald-600">{jobs.filter(j => j.status === 'active').length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border shadow-xs bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Cuentas Registradas</span>
              <span className="text-3xl font-black text-foreground">{profiles.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="news" className="space-y-4">
        <TabsList className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1.5 rounded-2xl w-full max-w-md h-auto">
          <TabsTrigger value="news" className="rounded-xl text-xs font-black uppercase tracking-wider gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <Newspaper className="h-4 w-4 text-blue-600" />
            <span>Noticias ({news.length})</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-xl text-xs font-black uppercase tracking-wider gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <Briefcase className="h-4 w-4 text-emerald-600" />
            <span>Empleos ({jobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="rounded-xl text-xs font-black uppercase tracking-wider gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span>Directorio</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Noticias */}
        <TabsContent value="news" className="space-y-4">
          <AdminNewsClient initialNews={news} />
        </TabsContent>

        {/* Tab Empleos */}
        <TabsContent value="jobs" className="space-y-4">
          <AdminJobsClient initialJobs={jobs} />
        </TabsContent>

        {/* Tab Empresas & Perfiles */}
        <TabsContent value="companies" className="space-y-4">
          <div className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-black uppercase tracking-tight text-foreground">
              Directorio de Empresas & Membresías
            </h3>
            <div className="divide-y divide-border/60">
              {profiles.map((p: any) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-foreground truncate">
                        {p.full_name || 'Sin nombre'}
                      </strong>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider">
                        {p.role || 'user'}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono block">
                      Plan: <span className="font-bold text-primary capitalize">{p.plan || 'personal'}</span>
                    </span>
                  </div>

                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {p.updated_at ? new Date(p.updated_at).toLocaleDateString('es-CL') : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
