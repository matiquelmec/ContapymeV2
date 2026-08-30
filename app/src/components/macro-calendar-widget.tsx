'use client'

import { useEffect, useState } from 'react'
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Activity, 
  ChevronDown,
  ChevronUp,
  Flame,
  Radio,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Filter,
  BarChart3
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
  const [radarAngle, setRadarAngle] = useState(0)

  // Animación del Radar Sonar en Tiempo Real
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle(prev => (prev + 45) % 360)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

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
        implication: 'Define el costo del crédito en Magallanes. Una baja de tasas abarata el financiamiento pero puede impulsar al alza el tipo de cambio USD/CLP.'
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
        implication: 'Define el valor global del Dólar. Si Jerome Powell adopta un tono restrictivo, encarecerá las importaciones en la Zona Franca de Punta Arenas.'
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
        affectedAsset: 'Valor de la UF a 30 Días',
        implication: 'Calcula el reajuste del valor de la UF para los siguientes 30 días, impactando arriendos, leasing, seguros y dividendos de empresas australes.'
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
        affectedAsset: 'Libra de Cobre COMEX & Commodities',
        implication: 'Termómetro de la inflación mundial. Dicta la liquidez global y el precio de exportación de materias primas.'
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
        affectedAsset: 'Actividad Económica & Ventas Retail',
        implication: 'Mide la actividad productiva agregada del país. Clave para evaluar la demanda de consumo y proyecciones de flujo de caja.'
      }
    ]

    setEvents(localList)
  }, [])

  const filteredEvents = events.filter(e => {
    if (filter === 'CHILE') return e.country === 'CHILE'
    if (filter === 'USA') return e.country === 'EE.UU.'
    if (filter === 'HIGH') return e.impact === 'High'
    return true
  })

  return (
    <div className="w-full rounded-[2.5rem] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white border-2 border-slate-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden group">
      
      {/* Auroras y resplandores neón de fondo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Rejilla de alta tecnología sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

      <div className="p-5 sm:p-7 relative z-10 space-y-5">
        
        {/* CABECERA RADAR DE ALTO IMPACTO */}
        <div className="space-y-4 border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 font-mono">
                Radar Macroeconómico
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full text-[9px] font-black tracking-wider text-emerald-300 font-mono shadow-inner">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>LIVE FEED</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h3 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase text-white leading-none flex items-center gap-2">
                <span>Eventos Críticos</span>
                <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
              </h3>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
                Monitoreo de Decisiones de Tasas, IPC y Volatilidad Cambiaria
              </p>
            </div>
          </div>

          {/* FILTROS RÁPIDOS DE ALTO CONTRASTE */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'ALL', label: '🌐 Todos' },
              { id: 'CHILE', label: '🇨🇱 Chile' },
              { id: 'USA', label: '🇺🇸 EE.UU.' },
              { id: 'HIGH', label: '⚡ Alto Impacto' },
            ].map(tab => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-extrabold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* LISTADO DE EVENTOS CON ESTILO TERMINAL */}
        <div className="space-y-3">
          {filteredEvents.map((event, idx) => {
            const isExpanded = expandedIndex === idx
            const isHigh = event.impact === 'High'

            return (
              <div 
                key={event.id || idx}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'bg-slate-900/95 border-amber-500/60 shadow-lg shadow-amber-500/5' 
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Fila Principal / Trigger */}
                <div 
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0 drop-shadow-sm">{event.flag}</span>
                    
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md font-mono ${
                          isHigh 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {isHigh ? '🔴 ALTO IMPACTO' : '🟡 MEDIO IMPACTO'}
                        </span>
                        <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {event.timeRelative}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-tight leading-snug">
                        {event.title}
                      </h4>

                      <div className="text-[9px] font-bold text-slate-400 font-mono">
                        {event.date}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 h-8 w-8 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-amber-400" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* DETALLE EXPANDIDO: TRANSMISIÓN FINANCIERA & MÉTRICAS */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/60 space-y-3 animate-in fade-in duration-300">
                    
                    {/* Caja de Explicación Táctica */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-amber-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-amber-400 animate-pulse" />
                          Transmisión a Magallanes:
                        </span>
                        <span className="text-slate-400">{event.affectedAsset}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                        {event.implication}
                      </p>
                    </div>

                    {/* Matriz de Datos Comparativos */}
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[8px] font-bold uppercase text-slate-400 block mb-0.5">Previsto</span>
                        <span className="text-xs sm:text-sm font-black text-amber-400">{event.forecast}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[8px] font-bold uppercase text-slate-400 block mb-0.5">Previo</span>
                        <span className="text-xs sm:text-sm font-black text-slate-300">{event.previous}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[8px] font-bold uppercase text-slate-400 block mb-0.5">Sesgo / Delta</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-400">{event.tendency}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* PIE DE FIRMA INSTITUCIONAL */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Sincronizado con Banco Central & Fed
          </span>
          <span className="text-amber-400 font-black tracking-wider uppercase">
            ContaPyme PUQ
          </span>
        </div>

      </div>
    </div>
  )
}
