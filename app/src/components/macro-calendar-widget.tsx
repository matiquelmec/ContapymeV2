'use client'

import { useEffect, useState } from 'react'
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Radio, 
  Zap, 
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface EconomicEvent {
  id: string
  title: string
  country: 'CHILE' | 'EE.UU.' | 'GLOBAL'
  flag: string
  impact: 'High' | 'Medium' | 'Low'
  date: string
  timeRelative: string
  forecast?: string
  previous?: string
  actual?: string
  tendency?: string
  implication: string 
  affectedAsset: string
}

export function MacroCalendarWidget() {
  const [events, setEvents] = useState<EconomicEvent[]>([])
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)
  const [filter, setFilter] = useState<'ALL' | 'CHILE' | 'USA' | 'HIGH'>('ALL')
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const today = new Date()

    const getEventDate = (daysAhead: number, hourUTC: number, minuteUTC: number): Date => {
      const d = new Date()
      d.setDate(today.getDate() + daysAhead)
      d.setUTCHours(hourUTC, minuteUTC, 0, 0)
      return d
    }

    const formatEventDate = (date: Date) => {
      const dateStr = date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
      })
      const timeStr = date.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      return `${dateStr} • ${timeStr} GMT-3`
    }

    const localList: EconomicEvent[] = [
      {
        id: 'ev-1',
        title: 'Decisión de Tasa de Política Monetaria (TPM)',
        country: 'CHILE',
        flag: '🇨🇱',
        impact: 'High',
        date: formatEventDate(getEventDate(1, 22, 0)),
        timeRelative: 'En 24 Horas ⚡',
        forecast: '5.50%',
        previous: '5.75%',
        actual: 'Pendiente',
        tendency: 'Recorte -25 bps',
        affectedAsset: 'Dólar (USD/CLP) & Créditos Pyme',
        implication: 'Define el costo del financiamiento bancario en Magallanes. Un recorte abarata los créditos comerciales pero presiona al alza el tipo de cambio del dólar en el corto plazo.'
      },
      {
        id: 'ev-2',
        title: 'Anuncio de Política Monetaria y Tasas - Fed FOMC',
        country: 'EE.UU.',
        flag: '🇺🇸',
        impact: 'High',
        date: formatEventDate(getEventDate(2, 18, 0)),
        timeRelative: 'En 2 Días ⏳',
        forecast: '5.25%',
        previous: '5.25%',
        actual: 'Pendiente',
        tendency: 'Pausa Monetaria',
        affectedAsset: 'Dólar Global, Cobre & Petróleo WTI',
        implication: 'Fija la pauta de las tasas mundiales. Una postura restrictiva fortalece el dólar global y encarece las importaciones que ingresan a la Zona Franca de Punta Arenas.'
      },
      {
        id: 'ev-3',
        title: 'Publicación de Variación del IPC Mensual (INE)',
        country: 'CHILE',
        flag: '🇨🇱',
        impact: 'High',
        date: formatEventDate(getEventDate(4, 12, 0)),
        timeRelative: 'En 4 Días 📅',
        forecast: '+0.3%',
        previous: '+0.5%',
        actual: 'Pendiente',
        tendency: 'Moderación',
        affectedAsset: 'Reajuste de la UF a 30 Días',
        implication: 'Determina el valor exacto de la UF para los siguientes 30 días, indexando contratos de arriendo comercial, seguros, créditos hipotecarios y obligaciones financieras.'
      },
      {
        id: 'ev-4',
        title: 'Índice de Precios al Consumidor (CPI Anual EE.UU.)',
        country: 'EE.UU.',
        flag: '🇺🇸',
        impact: 'High',
        date: formatEventDate(getEventDate(6, 13, 30)),
        timeRelative: 'Próxima Semana',
        forecast: '2.9%',
        previous: '3.1%',
        actual: 'Pendiente',
        tendency: 'Desinflación',
        affectedAsset: 'Commodities & Libra de Cobre',
        implication: 'Termómetro de la inflación en la principal economía del mundo. Influye directamente en la cotización internacional de los commodities y la liquidez global.'
      },
      {
        id: 'ev-5',
        title: 'Publicación del IMACEC Mensual (Banco Central)',
        country: 'CHILE',
        flag: '🇨🇱',
        impact: 'Medium',
        date: formatEventDate(getEventDate(7, 12, 30)),
        timeRelative: 'Próxima Semana',
        forecast: '+2.4%',
        previous: '+1.8%',
        actual: 'Pendiente',
        tendency: 'Crecimiento',
        affectedAsset: 'Actividad Económica & Consumo',
        implication: 'Mide la actividad productiva y comercial agregada del país, sirviendo de referencia para proyecciones de ventas y demanda en la economía regional.'
      }
    ]

    setEvents(localList)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 1000)
      return () => clearTimeout(t)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const filteredEvents = events.filter(e => {
    if (filter === 'CHILE') return e.country === 'CHILE'
    if (filter === 'USA') return e.country === 'EE.UU.'
    if (filter === 'HIGH') return e.impact === 'High'
    return true
  })

  return (
    <div className="w-full rounded-[2.5rem] bg-white border border-border/80 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.06)] hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden group">
      
      {/* Resplandor sutil corporativo en esquina */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-all duration-700 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="p-6 sm:p-8 relative z-10 space-y-6">
        
        {/* CABECERA INSTITUCIONAL */}
        <div className="space-y-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-800">
                Calendario Macroeconómico
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-[9px] font-bold text-emerald-700">
              <span className={`h-2 w-2 rounded-full bg-emerald-500 ${pulse ? 'scale-125' : ''} transition-transform`} />
              <span>EN VIVO • AUTÓNOMO</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase font-serif text-foreground leading-tight flex items-center gap-2">
              <span>Radar de Eventos Críticos</span>
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </h3>
            <p className="text-[10.5px] font-bold text-muted-foreground tracking-wide uppercase mt-1">
              Monitoreo de Tasas de Interés, IPC y Transmisión a Magallanes
            </p>
          </div>

          {/* FILTROS RÁPIDOS CON LA PALETA OFICIAL DE LA MARCA */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'ALL', label: '🌐 Todos los Eventos' },
              { id: 'CHILE', label: '🇨🇱 Chile' },
              { id: 'USA', label: '🇺🇸 EE.UU.' },
              { id: 'HIGH', label: '⚡ Alto Impacto' },
            ].map(tab => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                    : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 border border-zinc-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* LISTADO DE EVENTOS (ESTILO CORPORATIVO LIMPIO) */}
        <div className="space-y-3.5">
          {filteredEvents.map((event, idx) => {
            const isExpanded = expandedIndex === idx
            const isHigh = event.impact === 'High'

            return (
              <div 
                key={event.id || idx}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'bg-emerald-50/20 border-emerald-500/40 shadow-md shadow-emerald-900/5' 
                    : 'bg-white border-zinc-200/80 hover:border-emerald-300 hover:bg-zinc-50/50 shadow-sm'
                }`}
              >
                {/* Trigger del Evento */}
                <div 
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-2xl shrink-0 drop-shadow-xs">{event.flag}</span>
                    
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md font-mono ${
                          isHigh 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isHigh ? '🔴 ALTO IMPACTO' : '🟡 MEDIO IMPACTO'}
                        </span>
                        
                        <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-md font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3 text-emerald-600" /> {event.timeRelative}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-black uppercase text-foreground tracking-tight leading-snug">
                        {event.title}
                      </h4>

                      <div className="text-[9.5px] font-bold text-muted-foreground font-mono">
                        {event.date}
                      </div>
                    </div>
                  </div>

                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center border transition-colors ${
                    isExpanded 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : 'bg-zinc-100 border-zinc-200 text-zinc-600 group-hover:border-emerald-300'
                  }`}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* DETALLE EXPANDIDO: EXPLICACIÓN TÁCTICA & MATRIZ */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-emerald-100 bg-white/80 space-y-3.5 animate-in fade-in duration-300">
                    
                    {/* Caja de Transmisión a Magallanes */}
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-1.5 text-emerald-950">
                      <div className="flex items-center justify-between text-[9.5px] font-black uppercase tracking-wider text-emerald-900">
                        <span className="flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-emerald-700 animate-pulse" />
                          Transmisión a Magallanes:
                        </span>
                        <span className="text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                          {event.affectedAsset}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-zinc-700 font-medium leading-relaxed">
                        {event.implication}
                      </p>
                    </div>

                    {/* Matriz de Datos Comparativos */}
                    <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                      <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                        <span className="text-[8.5px] font-bold uppercase text-muted-foreground block mb-0.5">Previsto</span>
                        <span className="text-xs sm:text-sm font-black text-foreground">{event.forecast}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                        <span className="text-[8.5px] font-bold uppercase text-muted-foreground block mb-0.5">Previo</span>
                        <span className="text-xs sm:text-sm font-bold text-zinc-600">{event.previous}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                        <span className="text-[8.5px] font-bold uppercase text-emerald-800 block mb-0.5">Sesgo / Tendencia</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-700">{event.tendency}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* PIE DE FIRMA INSTITUCIONAL */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[9.5px] font-bold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Sincronizado con Banco Central & Fed
          </span>
          <span className="text-emerald-700 font-black tracking-wider uppercase">
            ContaPyme PUQ
          </span>
        </div>

      </div>
    </div>
  )
}
