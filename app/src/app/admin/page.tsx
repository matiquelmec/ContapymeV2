import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNewsClient } from './admin-news-client'
import { AdminJobsClient } from './admin-jobs-client'
import Link from 'next/link'
import { 
  BookOpen, 
  LogOut, 
  ArrowLeft, 
  ShieldAlert, 
  Newspaper, 
  Briefcase, 
  Building2, 
  Users, 
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { signOut } from '@/actions/auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const revalidate = 0

export default async function AdminPortalPage() {
  const supabase = await createClient()

  // 1. Obtener la sesión del usuario actual
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return redirect('/login?next=/admin')
  }

  // 2. Obtener perfil de la base de datos
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, plan, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return redirect('/login?next=/admin&error=' + encodeURIComponent('Sesión expirada o perfil no encontrado.'))
  }

  // 3. Validar permisos de administración
  const userRole = (profile.role || '').toLowerCase()
  const userPlan = (profile.plan || '').toLowerCase()
  const isAuthorized = userRole === 'admin' || userPlan === 'consorcio'

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl p-8 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-rose-500" />
          
          <div className="flex justify-center mb-6">
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
          </div>

          <h1 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-2">
            Acceso Restringido ⚓
          </h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-6">
            Consola de Superadministración ContaPymePUQ
          </p>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left space-y-2 mb-6">
            <div className="text-xs">
              <span className="text-slate-400 font-bold block uppercase tracking-wider">Usuario Conectado:</span>
              <strong className="text-slate-700 font-extrabold text-[13px]">{profile.full_name || 'Usuario registrado'}</strong>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-200/50">
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider">Rol:</span>
                <strong className="text-slate-700 capitalize">{profile.role || 'Sin rol'}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider">Plan:</span>
                <strong className="text-slate-700 capitalize">{profile.plan || 'personal'}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <form action={signOut} className="w-full">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 shadow-xs cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </form>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs h-10 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la Portada
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 4. Obtener listados para la consola de superadmin
  const [newsRes, jobsRes, profilesRes] = await Promise.all([
    supabase.from('regional_news').select('*').order('published_at', { ascending: false }),
    supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, role, plan, updated_at').order('updated_at', { ascending: false }).limit(20),
  ])

  const news = newsRes.data || []
  const jobs = jobsRes.data || []
  const profiles = profilesRes.data || []

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans animate-in fade-in duration-500">
      {/* CABECERA EDITORIAL EXCLUSIVA */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary border border-primary/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-primary block leading-none mb-0.5">
                Consola Central de Superadmin
              </span>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-800 uppercase leading-none">
                ContaPymePUQ Magallanes
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden lg:inline-block text-xs font-semibold text-slate-500 mr-2">
              Superadmin: <strong className="text-slate-800 font-bold">{profile.full_name || 'Administrador'}</strong>
            </span>
            
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-black text-xs px-3 h-8 shadow-2xs transition-all hover:scale-102 active:scale-98"
            >
              <span>📊 Ir al Dashboard ERP</span>
            </Link>

            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs px-3 h-8 shadow-2xs transition-all hover:scale-102 active:scale-98"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Portada</span>
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-rose-700 font-bold text-xs px-3 h-8 shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* CUERPO CENTRAL CON PESTAÑAS MULTI-MÓDULO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase leading-none">
            Panel de Control Global ⚓
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold italic">
            Administración unificada del diario regional, bolsa de empleos, organizaciones y membresías.
          </p>
        </div>

        {/* METRICAS GLOBALES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Noticias Publicadas</span>
                <span className="text-2xl font-black text-slate-900">{news.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Newspaper className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Ofertas Laborales Activas</span>
                <span className="text-2xl font-black text-emerald-600">{jobs.filter(j => j.status === 'active').length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Briefcase className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Empresas & Cuentas</span>
                <span className="text-2xl font-black text-slate-900">{profiles.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PESTAÑAS DE ADMINISTRACIÓN */}
        <Tabs defaultValue="news" className="space-y-4">
          <TabsList className="grid grid-cols-3 gap-1 bg-slate-200/80 p-1 rounded-2xl w-full max-w-lg">
            <TabsTrigger value="news" className="rounded-xl text-xs font-black uppercase tracking-wider gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-xs py-2">
              <Newspaper className="h-4 w-4 text-blue-600" />
              <span>Noticias ({news.length})</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="rounded-xl text-xs font-black uppercase tracking-wider gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-xs py-2">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              <span>Empleos ({jobs.length})</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="rounded-xl text-xs font-black uppercase tracking-wider gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-xs py-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span>Directorio</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: NOTICIAS */}
          <TabsContent value="news" className="space-y-4">
            <AdminNewsClient initialNews={news} />
          </TabsContent>

          {/* TAB 2: EMPLEOS */}
          <TabsContent value="jobs" className="space-y-4">
            <AdminJobsClient initialJobs={jobs} />
          </TabsContent>

          {/* TAB 3: EMPRESAS & PERFILES */}
          <TabsContent value="companies" className="space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-800">
                Directorio de Empresas & Membresías
              </h3>
              <div className="divide-y divide-slate-100">
                {profiles.map((p: any) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-slate-900 truncate">
                          {p.full_name || 'Sin nombre'}
                        </strong>
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider">
                          {p.role || 'user'}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        Plan: <span className="font-bold text-primary capitalize">{p.plan || 'personal'}</span>
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('es-CL') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
