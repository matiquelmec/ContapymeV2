import { Metadata } from 'next'
import Link from 'next/link'
import { XCircle, RefreshCw, ArrowLeft, LayoutDashboard, Briefcase, Newspaper, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Pago No Completado | ContaPymePUQ',
  description: 'El pago no pudo ser procesado o fue cancelado.',
}

export default async function CheckoutFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; external_reference?: string; payment_id?: string; return_to?: string }>
}) {
  const params = await searchParams
  const type = params.type || (params.external_reference?.startsWith('sub_') ? 'subscription' : params.external_reference?.startsWith('news_') ? 'press_release' : params.external_reference?.startsWith('banner_') ? 'ad_banner' : 'job')

  const config = {
    subscription: {
      title: 'Pago de Suscripción Cancelado',
      desc: 'No se realizó ningún cobro en tu tarjeta. Puedes reintentar el pago de tu Plan ERP o continuar utilizando el panel en tu periodo activo.',
      retryText: 'Reintentar Pago de Plan',
      retryHref: '/dashboard',
      backText: 'Volver al Dashboard',
      backHref: '/dashboard',
      icon: LayoutDashboard,
    },
    press_release: {
      title: 'Pago de Nota de Prensa Cancelado',
      desc: 'La transacción fue cancelada o rechazada. Tu noticia no ha sido publicada. Puedes reintentar cuando gustes.',
      retryText: 'Reintentar Publicación',
      retryHref: '/publicar-comunicado',
      backText: 'Volver al Diario Regional',
      backHref: '/noticias',
      icon: Newspaper,
    },
    ad_banner: {
      title: 'Pago de Banner Cancelado',
      desc: 'No se realizó ningún cobro. Tu espacio publicitario no ha sido reservado.',
      retryText: 'Reintentar Reserva',
      retryHref: '/anunciar',
      backText: 'Volver al Portal',
      backHref: '/',
      icon: Megaphone,
    },
    job: {
      title: 'Pago de Aviso no Procesado',
      desc: 'La transacción fue cancelada o rechazada por la entidad emisora. No se realizó ningún cargo en tu tarjeta.',
      retryText: 'Reintentar Publicación',
      retryHref: '/publicar-empleo',
      backText: 'Volver a Mis Empleos',
      backHref: '/dashboard/empleos',
      icon: Briefcase,
    },
  }[type as 'subscription' | 'press_release' | 'ad_banner' | 'job'] || {
    title: 'Pago no Procesado',
    desc: 'La transacción fue cancelada o rechazada. No se realizó ningún cargo en tu tarjeta.',
    retryText: 'Reintentar',
    retryHref: '/precios',
    backText: 'Volver al Dashboard',
    backHref: '/dashboard',
    icon: LayoutDashboard,
  }

  const returnTo = params.return_to || config.backHref
  const BackIcon = config.icon

  return (
    <div className="min-h-screen bg-zinc-50 py-16 sm:py-24 px-4 flex items-center justify-center">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-[2.5rem] bg-white border border-border shadow-2xl space-y-6 text-center">
        <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-600 border-2 border-rose-200 flex items-center justify-center mx-auto">
          <XCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
            {config.title}
          </h1>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            {config.desc}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link href={config.retryHref}>
            <Button size="lg" className="w-full rounded-2xl h-12 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer">
              <RefreshCw className="mr-2 h-4 w-4" /> {config.retryText}
            </Button>
          </Link>
          <Link href={returnTo}>
            <Button size="lg" variant="ghost" className="w-full rounded-2xl h-12 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground border border-zinc-200 cursor-pointer">
              <BackIcon className="mr-2 h-4 w-4" /> {config.backText}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
