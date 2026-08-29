import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Sparkles, ArrowRight, Share2, Briefcase, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '¡Publicación Exitosa! | ContaPymePUQ',
  description: 'Tu pago y publicación han sido procesados correctamente.',
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string; status?: string; external_reference?: string; slug?: string }>
}) {
  const params = await searchParams
  const slug = params.slug

  return (
    <div className="min-h-screen bg-zinc-50 py-16 sm:py-24 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full p-8 sm:p-12 rounded-[2.5rem] bg-white border border-border shadow-2xl space-y-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-primary to-blue-500" />
        
        <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="h-10 w-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> Transacción Confirmada
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tight text-foreground">
            ¡Tu Aviso ya está en Vivo!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            Tu oferta ha sido publicada exitosamente en ContaEmpleos y enviada para indexación oficial en Google for Jobs.
          </p>
        </div>

        {slug && (
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs font-mono text-foreground break-all">
            https://www.contapymepuq.cl/empleos/{slug}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {slug ? (
            <Link href={`/empleos/${slug}`} className="w-full sm:w-auto">
              <Button size="lg" className="w-full rounded-2xl h-12 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                <Briefcase className="mr-2 h-4 w-4" /> Ver Mi Aviso en Vivo
              </Button>
            </Link>
          ) : (
            <Link href="/empleos" className="w-full sm:w-auto">
              <Button size="lg" className="w-full rounded-2xl h-12 text-xs font-black uppercase tracking-wider bg-primary text-white">
                <Briefcase className="mr-2 h-4 w-4" /> Ir a la Bolsa de Empleos
              </Button>
            </Link>
          )}

          <Link href="/crear-empresa" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full rounded-2xl h-12 text-xs font-black uppercase tracking-wider border-border hover:bg-muted">
              <Building2 className="mr-2 h-4 w-4" /> Crear Empresa ($35K)
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
