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

        {/* 🎨 SERVICIO CONCIERGE DE DISEÑO PUBLICITARIO POR WHATSAPP */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-zinc-900 border-2 border-emerald-500/40 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 shrink-0">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                🎨 Servicio de Diseño Incluido
              </div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                ¿No tienes diseñador? ¡Nosotros creamos tu banner con tu marca!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-2xl">
                Envíanos tu logo, colores y la oferta o mensaje que deseas promocionar. Nuestro equipo diseña tu banner en alta resolución y se encarga de publicar y gestionar toda la pauta de tu marca.
              </p>
            </div>
          </div>
          <a
            href={`https://wa.me/56944444565?text=${encodeURIComponent("¡Hola! Me gustaría que ustedes diseñen el banner publicitario y se encarguen de la publicidad con mi marca en ContaPymePUQ.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs uppercase tracking-wider px-6 h-13 shadow-xl shadow-emerald-500/20 shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer w-full md:w-auto"
          >
            <span>💬 Diseñar mi Banner por WhatsApp ➔</span>
          </a>
        </div>

        {/* Formulario */}
        <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-muted-foreground">Cargando formulario...</div>}>
          <AdSelfServePublisher />
        </Suspense>

      </div>
    </div>
  )
}
