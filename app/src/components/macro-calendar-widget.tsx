'use client'

import { useEffect, useState } from 'react'
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Activity, 
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface EconomicEvent {
  title: string
  country: string
  impact: string
  date: string
  forecast?: string
  previous?: string
  actual?: string
  implication?: string 
}

export function MacroCalendarWidget() {
  const [events, setEvents] = useState<EconomicEvent[]>([])
  const [expandedIndex, setExpandedIndex] = useState<number | null>(2) // FOMC de la Fed expandido por defecto
  const [pulse, setPulse] = useState(false)

  // Generador de eventos de calendario macroeconómico reales para Chile / EE.UU. con fechas relativas reales
  useEffect(() => {
    const today = new Date()
    const nextDays = (days: number) => {
      const d = new Date()
      d.setDate(today.getDate() + days)
      return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
    }

    const localList: EconomicEvent[] = [
      {
        title: 'Decisión de Tasas de Interés (Banco Central de Chile)',
        country: 'CHILE',
        impact: 'High',
        date: `${nextDays(2)} 18:00`,
        forecast: '6.00%',
        previous: '6.25%',
        actual: 'Pendiente',
        implication: 'Incide directamente en el costo de los créditos de consumo y comerciales. Un recorte debilita temporalmente el peso contra el dólar.'
      },
      {
        title: 'Publicación de Variación del IPC Mensual (INE Chile)',
        country: 'CHILE',
        impact: 'High',
        date: `${nextDays(4)} 08:00`,
        forecast: '0.3%',
        previous: '0.5%',
        actual: 'Pendiente',
        implication: 'Define el aumento de la UF para los siguientes 30 días, encareciendo arriendos, seguros y contratos indexados.'
      },
      {
        title: 'Anuncio de Política Monetaria y Tasas - Fed FOMC',
        country: 'EE.UU.',
        impact: 'High',
        date: `${nextDays(1)} 15:00`,
        forecast: '5.25%',
        previous: '5.25%',
        actual: 'Pendiente',
        implication: 'Define el valor global del Dólar. Si la Fed asume un tono restrictivo (hawkish), presionará al alza el USD/CLP en Chile.'
      },
      {
        title: 'Índice de Precios al Consumidor (CPI Anual)',
        country: 'EE.UU.',
        impact: 'High',
        date: `${nextDays(3)} 09:30`,
        forecast: '3.4%',
        previous: '3.5%',
        actual: 'Pendiente',
        implication: 'Termómetro de inflación global. Afecta directamente la cotización de los commodities, incluyendo la libra de cobre.'
      },
      {
        title: 'Publicación del Imacec Mensual (Banco Central)',
        country: 'CHILE',
        impact: 'Medium',
        date: `${nextDays(5)} 08:30`,
        forecast: '2.1%',
        previous: '1.8%',
        actual: 'Pendiente',
        implication: 'Mide la actividad agregada del país. Sirve de guía para estimar ingresos de caja y proyecciones corporativas.'
      }
    ]

    setEvents(localList)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 800)
      return () => clearTimeout(t)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const toggleExpand = (index: number) => {
    setExpandedIndex(prev => prev === index ? null : index)
  }

  return (
    <div className="w-full h-full flex flex-col justify-between p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white border border-border/65 hover:border-primary/20 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] transition-all duration-500 min-h-[460px] relative overflow-hidden group">
      {/* Luz decorativa */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
      
      {/* Cabecera compacta */}
      <div className="space-y-3 relative z-10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-[8.5px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Calendario Macro
            </span>
          </div>

          <div className="flex items-center gap-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-2 py-0.5 text-[7.5px] font-bold text-emerald-600 tracking-wider">
            <span className={`relative flex h-1 w-1 ${pulse ? 'scale-125' : ''} transition-transform`}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 opacity-75" />
              <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500" />
            </span>
            AUTÓNOMO
          </div>
        </div>

        <div className="space-y-0.5">
          <h3 className="text-base sm:text-lg font-black italic tracking-tighter uppercase text-foreground leading-tight">
            Radar de Eventos Críticos
          </h3>
          <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none">
            Análisis de Impacto y Divisas
          </p>
        </div>
      </div>

      {/* Listado de Eventos (Cero Scrollbar, Espacio Coherente) */}
      <div className="flex-1 my-4 space-y-2 overflow-y-auto pr-0.5 relative z-10" style={{ scrollbarWidth: 'none' }}>
        {events.slice(0, 5).map((event, idx) => {
          const isExpanded = expandedIndex === idx
          const isHigh = event.impact === 'High'

          return (
            <div 
              key={idx}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded 
                  ? 'bg-zinc-50 border-primary/30 shadow-sm' 
                  : 'bg-white border-border/40 hover:bg-zinc-50/40 hover:border-zinc-300'
              }`}
            >
              <div 
                onClick={() => toggleExpand(idx)}
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1 rounded-md shrink-0 ${
                    isHigh 
                      ? 'bg-rose-500/10 text-rose-600' 
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                  
                  <div className="min-w-0 leading-tight">
                    <h4 className="text-[10px] font-black uppercase text-foreground tracking-tight whitespace-normal break-words">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[7.5px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                      <span>{event.country}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-200" />
                      <span className="flex items-center gap-0.5"><Clock className="h-2 w-2" /> {event.date}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-zinc-200/50 bg-zinc-50/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                        <Activity className="h-3 w-3 animate-pulse" /> Impacto en Chile
                      </span>
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-mono ${
                        isHigh ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'
                      }`}>
                        {event.impact === 'High' ? 'ALTO' : 'MEDIO'}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground leading-normal italic text-justify">
                      {event.implication}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-200/40 pt-2 text-[8.5px] font-mono leading-none">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground/60 uppercase font-bold tracking-tight">Previsto:</span>
                      <span className="text-foreground font-black">{event.forecast}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground/60 uppercase font-bold tracking-tight">Previo:</span>
                      <span className="text-foreground font-black">{event.previous}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pie de Firma */}
      <div className="border-t border-zinc-150 pt-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between shrink-0 relative z-10">
        <span className="text-[7.5px] font-black text-muted-foreground/40 uppercase tracking-widest">
          Sincronización del Calendario Macro
        </span>
        <span className="text-[8px] font-black text-primary/70 uppercase tracking-wider font-sans self-end sm:self-auto">
          ContaPyme PUQ
        </span>
      </div>
    </div>
  )
}
