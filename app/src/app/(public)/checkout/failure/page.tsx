import { Metadata } from 'next'
import Link from 'next/link'
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Pago No Completado | ContaPymePUQ',
  description: 'El pago no pudo ser completado.',
}

export default function CheckoutFailurePage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-16 sm:py-24 px-4 flex items-center justify-center">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-[2.5rem] bg-white border border-border shadow-2xl space-y-6 text-center">
        <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-600 border-2 border-rose-200 flex items-center justify-center mx-auto">
          <XCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
            Pago No Procesado
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            La transacción fue cancelada o rechazada por la entidad emisora. No se realizó ningún cargo en tu tarjeta.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link href="/publicar-empleo">
            <Button size="lg" className="w-full rounded-2xl h-11 text-xs font-black uppercase tracking-wider bg-primary text-white">
              <RefreshCw className="mr-2 h-4 w-4" /> Reintentar Publicación
            </Button>
          </Link>
          <Link href="/empleos">
            <Button size="lg" variant="ghost" className="w-full rounded-2xl h-11 text-xs font-black uppercase tracking-wider text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Empleos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
