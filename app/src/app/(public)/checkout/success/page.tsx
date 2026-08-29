import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Sparkles, ArrowRight, Briefcase, Building2, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mpPayment } from '@/lib/mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Confirmación de Publicación | ContaPymePUQ',
  description: 'Verificación del estado de tu publicación y pago en ContaPymePUQ.',
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string; status?: string; external_reference?: string; slug?: string }>
}) {
  const params = await searchParams
  const paymentId = params.payment_id
  let slug = params.slug
  let isApproved = !paymentId // Si no viene payment_id pero viene slug, es publicación gratis ($0)
  let isPending = false
  let isRejected = false

  if (paymentId) {
    try {
      const paymentInfo = await mpPayment.get({ id: paymentId })
      
      if (paymentInfo.status === 'approved') {
        isApproved = true
        const extRef = paymentInfo.external_reference
        const supabase = createAdminClient()

        if (extRef && extRef.startsWith('job_')) {
          const jobId = extRef.replace('job_', '')
          const { data: updatedJob } = await supabase
            .from('job_postings')
            .update({
              status: 'active',
              is_verified: true,
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', jobId)
            .select('slug')
            .single()

          if (updatedJob?.slug) {
            slug = updatedJob.slug
          }
        } else if (extRef && extRef.startsWith('news_')) {
          const newsId = extRef.replace('news_', '')
          await supabase
            .from('regional_news')
            .update({
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', newsId)
        }
      } else if (paymentInfo.status === 'in_process' || paymentInfo.status === 'pending') {
        isPending = true
      } else {
        isRejected = true
      }
    } catch (err) {
      console.warn('Error verificando pago en success page:', err)
      // Si falla la consulta directa, asumimos pending para no dar falso positivo
      isPending = true
    }
  }

  // Caso: Pago Rechazado o Cancelado
  if (isRejected) {
    return (
      <div className="min-h-screen bg-zinc-50 py-16 sm:py-24 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full p-8 sm:p-12 rounded-[2.5rem] bg-white border border-red-200 shadow-2xl space-y-6 text-center">
          <div className="h-20 w-20 rounded-full bg-red-50 text-red-600 border-2 border-red-200 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-foreground">
            Pago no completado
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            El pago fue rechazado o cancelado. Tu aviso no ha sido publicado. Puedes intentar nuevamente.
          </p>
          <div className="pt-4">
            <Link href="/publicar-empleo">
              <Button size="lg" className="rounded-2xl h-12 text-xs font-black uppercase tracking-wider bg-zinc-900 text-white">
                Reintentar Publicación ➔
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Caso: Pago en Proceso / Pendiente de Acreditación
  if (isPending) {
    return (
      <div className="min-h-screen bg-zinc-50 py-16 sm:py-24 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full p-8 sm:p-12 rounded-[2.5rem] bg-white border border-amber-200 shadow-2xl space-y-6 text-center">
          <div className="h-20 w-20 rounded-full bg-amber-50 text-amber-600 border-2 border-amber-200 flex items-center justify-center mx-auto">
            <Clock className="h-10 w-10 animate-spin" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-foreground">
            Pago en Proceso de Validación
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tu pago está siendo procesado por el banco. En cuanto Mercado Pago confirme la acreditación, tu aviso se publicará automáticamente.
          </p>
          <div className="pt-4">
            <Link href="/empleos">
              <Button size="lg" className="rounded-2xl h-12 text-xs font-black uppercase tracking-wider bg-primary text-white">
                Ir a la Bolsa de Empleos ➔
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Caso: Pago Aprobado o Publicación Gratuita
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
            ¡Tu Publicación ya está en Vivo!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            Tu anuncio ha sido validado, publicado exitosamente y enviado para indexación oficial en Google.
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
