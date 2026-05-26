import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNewsClient } from './admin-news-client'
import Link from 'next/link'
import { BookOpen, LogOut, ArrowLeft, ShieldAlert, LogIn } from 'lucide-react'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'

export const revalidate = 0 // Evitar almacenamiento en caché para reflejar cambios del admin al instante

export default async function AdminPortalPage() {
  const supabase = await createClient()

  // 1. Obtener la sesión del usuario actual
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    // Redirigir al login guardando el parámetro de retorno
    return redirect('/login?next=/admin')
  }

  // 2. Obtener perfil de la base de datos
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, plan, full_name')
    .eq('id', user.id)
    .single()

  // Si no se encuentra perfil, asumimos que no tiene acceso
  if (profileError || !profile) {
    return redirect('/')
  }

  // 3. Validar permisos de administración (con soporte case-insensitive)
  const userRole = (profile.role || '').toLowerCase()
  const userPlan = (profile.plan || '').toLowerCase()
  const isAuthorized = userRole === 'admin' || userPlan === 'consorcio'

  // Pantalla de ACCESO RESTRINGIDO (UX Explicativa) si no cuenta con permisos
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
            Consola Editorial Contapymepuq
          </p>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left space-y-2 mb-6">
            <div className="text-xs">
              <span className="text-slate-400 font-bold block uppercase tracking-wider">Usuario Conectado:</span>
              <strong className="text-slate-700 font-extrabold text-[13px]">{profile.full_name || 'Usuario registrado'}</strong>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-200/50">
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider">Rol de Perfil:</span>
                <strong className="text-slate-700 capitalize">{profile.role || 'Sin rol asignado'}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase tracking-wider">Plan Comercial:</span>
                <strong className="text-slate-700 capitalize">{profile.plan || 'personal'}</strong>
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-8">
            Su cuenta no cuenta con privilegios editoriales. Requiere poseer el rol de <strong>Administrador</strong> del sistema o estar suscrito a una membresía de nivel <strong>Consorcio</strong> para publicar y corregir noticias.
          </p>

          <div className="flex flex-col gap-3">
            <form action={signOut} className="w-full">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 shadow-xs transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión / Cambiar Cuenta
              </button>
            </form>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs h-10 shadow-2xs transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la Portada
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 4. Si está autorizado, obtener el listado total de noticias
  const { data: news, error: newsError } = await supabase
    .from('regional_news')
    .select('*')
    .order('published_at', { ascending: false })

  if (newsError) {
    console.error('Error fetching regional news for admin:', newsError.message)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans animate-in fade-in duration-500">
      {/* CABECERA EDITORIAL EXCLUSIVA */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary border border-primary/10">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-primary block leading-none mb-0.5">Consola Editorial</span>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-800 uppercase leading-none">
                ContaPymePuq
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-xs font-semibold text-slate-500 mr-2">
              Editor: <strong className="text-slate-800 font-bold">{profile.full_name || 'Administrador'}</strong>
            </span>
            
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs px-3 h-8 shadow-2xs transition-all hover:scale-102 active:scale-98"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Portada</span>
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

      {/* CUERPO CENTRAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase leading-none">
            Administrar Diario Regional ⚓
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold italic mt-1.5">
            Gestión descentralizada de noticias, portadas, e imágenes del diario regional para Punta Arenas.
          </p>
        </div>

        <AdminNewsClient initialNews={news || []} />
      </main>
    </div>
  )
}
