import { Metadata } from 'next'
import { AdSelfServePublisher } from '@/components/ads/ad-self-serve-publisher'
import { Megaphone, Sparkles } from 'lucide-react'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Reservar Banner Publicitario en Magallanes | ContaPymePUQ Media Kit',
  description: 'Contrata espacios publicitarios en la Calculadora de Sueldos y Diario Regional de Magallanes. Precios desde $1.333/día con Mercado Pago.',
}

export default function AnunciarPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-12 selection:bg-amber-500/20">
      <div className="container mx-auto max-w-5xl space-y-10">
        
        {/* Cabecera */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/20 bg-amber-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-amber-800">
            <Sparkles className="h-3.5 w-3.5" /> Media Kit Digital • Reserva Inmediata
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.92] text-foreground">
            Anuncia tu Empresa <br />
            <span className="text-amber-600 font-serif">en el Portal #1 de Magallanes.</span>
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Espacios publicitarios limpios y sin saturación. Llega a miles de clientes en Punta Arenas, Puerto Natales y Tierra del Fuego desde solo <strong>$1.333 al día</strong>.
          </p>
        </div>

        {/* Formulario */}
        <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-muted-foreground">Cargando formulario...</div>}>
          <AdSelfServePublisher />
        </Suspense>

      </div>
    </div>
  )
}
