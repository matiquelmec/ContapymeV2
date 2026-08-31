import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCompanyAdBannersAction } from '@/actions/ads'
import { DashboardAdsClient } from '@/components/dashboard/dashboard-ads-client'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mis Banners & Publicidad | ContaPymePUQ',
  description: 'Gestiona tus espacios publicitarios en la Calculadora de Sueldos, Noticias y Portada.',
}

export default async function DashboardPublicidadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard/publicidad')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('is_superadmin, raw_user_meta_data')
    .eq('id', user.id)
    .single()

  const isSuperadmin = userProfile?.is_superadmin || false
  const userFullName = userProfile?.raw_user_meta_data?.full_name || user.email

  const res = await getCompanyAdBannersAction()
  const initialBanners = res.data || []

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Superadmin Banner */}
      {isSuperadmin && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-indigo-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-black text-xs uppercase tracking-wider block text-indigo-900">
                Rol de Superadministrador Activo ({userFullName}):
              </span>
              <p className="text-[11px] text-indigo-700 font-medium">
                Tienes permisos para supervisar y moderar todos los banners y contratos de publicidad en Magallanes.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider shrink-0 transition-all"
          >
            <span>Consola Superadmin</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
          Media Kit & Publicidad Digital Regional
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
          Mis Banners y Espacios Publicitarios
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          Difunde tu marca ante más de 45.000 profesionales y Pymes en la Calculadora de Sueldos, Noticias y Portada de Magallanes.
        </p>
      </div>

      {/* 🎨 Banner Concierge WhatsApp para Clientes del Dashboard */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-zinc-900 border border-emerald-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
            🎨 ¿Necesitas que diseñemos tu Banner?
          </span>
          <h3 className="text-sm sm:text-base font-black text-white">
            Nosotros creamos tu creatividad con tu logo y gestionamos tu publicidad
          </h3>
          <p className="text-xs text-zinc-300 font-medium max-w-xl">
            Si no tienes diseñador gráfico, nuestro equipo crea tu banner a medida y optimizado en WebP. Escríbenos directamente por WhatsApp.
          </p>
        </div>
        <a
          href={`https://wa.me/56944444565?text=${encodeURIComponent("¡Hola! Tengo cuenta en ContaPymePUQ y me gustaría que ustedes diseñen el banner publicitario y gestionen la pauta de mi marca.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs uppercase tracking-wider shrink-0 transition-all hover:scale-105 active:scale-95 shadow-md"
        >
          <span>💬 Contactar por WhatsApp ➔</span>
        </a>
      </div>

      <DashboardAdsClient initialBanners={initialBanners} />
    </div>
  )
}
