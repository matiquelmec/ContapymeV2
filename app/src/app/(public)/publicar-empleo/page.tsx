import { Metadata } from 'next'
import { JobSelfServePublisher } from '@/components/jobs/job-self-serve-publisher'
import { Briefcase, ShieldCheck, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Publicar Oferta de Empleo en Magallanes (Gratis o Destacado) | ContaEmpleos',
  description: 'Publica tu aviso laboral en Punta Arenas, Natales y Faenas de Magallanes. Sin registros obligatorios. Indexación oficial en Google for Jobs y postulación directa por WhatsApp.',
  keywords: [
    'publicar empleo punta arenas',
    'publicar aviso de trabajo magallanes',
    'ofertas laborales punta arenas gratis',
    'contaempleos publicar',
    'google for jobs magallanes'
  ],
  alternates: {
    canonical: 'https://www.contapymepuq.cl/publicar-empleo',
  },
}

export default function PublicarEmpleoPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-12 selection:bg-primary/20">
      <div className="container mx-auto max-w-5xl space-y-10">
        
        {/* Cabecera */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" /> Autoservicio Rápido • Sin Registro Previo
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.92] text-foreground">
            Publica tu Oferta Laboral <br />
            <span className="text-emerald-600 font-serif">en ContaEmpleos Magallanes.</span>
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Completa los datos de tu vacante. Elige publicación <strong>100% Gratis ($0)</strong> o destaca tu aviso en redes sociales por solo <strong>$2.990 / $4.990</strong> con pago instantáneo vía Mercado Pago.
          </p>
        </div>

        {/* Formulario Interactivo */}
        <JobSelfServePublisher />

      </div>
    </div>
  )
}
