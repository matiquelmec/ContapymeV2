'use client'

import { useEffect, useState } from 'react'
import { 
  ArrowUp,
  ArrowDown
} from 'lucide-react'

import { Indicator } from '@/lib/types/dashboard'
import { createClient } from '@/lib/supabase/client'

export function MarketTicker({ indicators = [] }: { indicators: Indicator[] }) {
  const [mounted, setMounted] = useState(false)
  const [windSpeed, setWindSpeed] = useState(54) 
  
  const [liveIndicators, setLiveIndicators] = useState<Indicator[]>(indicators)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [updatedCodes, setUpdatedCodes] = useState<Record<string, boolean>>({})

  // Buscar la fecha de actualización más reciente
  const getLatestTimestamp = (inds: Indicator[]) => {
    if (!inds || inds.length === 0) return null
    const dates = inds
      .map(i => (i as any).updated_at ? new Date((i as any).updated_at).getTime() : 0)
      .filter(t => t > 0)
    if (dates.length === 0) return null
    return new Date(Math.max(...dates))
  }

  const [lastSync, setLastSync] = useState<Date | null>(() => getLatestTimestamp(indicators))

  // Simulación de fluctuación de mercado en tiempo real para dar dinamismo a la cinta (Dólar, Euro, IPSA, Cobre, WTI)
  useEffect(() => {
    const ticksInterval = setInterval(() => {
      setLiveIndicators(prev => 
        prev.map(ind => {
          // UF y UTM son estables por definición diaria/mensual, pero los mercados fluctúan
          if (['dolar', 'euro', 'libra_cobre', 'wti', 'ipsa', 'sp500', 'oro'].includes(ind.codigo)) {
            const valNum = Number(ind.valor)
            let delta = 0
            
            if (ind.codigo === 'dolar' || ind.codigo === 'euro') {
              delta = (Math.random() - 0.5) * 0.95 // Cambios de hasta 0.95 pesos
            } else if (ind.codigo === 'libra_cobre') {
              delta = (Math.random() - 0.5) * 0.008 // Cambios de centavos de dólar
            } else if (ind.codigo === 'wti' || ind.codigo === 'oro') {
              delta = (Math.random() - 0.5) * 0.15 // Cambios de centavos de crudo / oz de oro
            } else if (ind.codigo === 'ipsa' || ind.codigo === 'sp500') {
              delta = (Math.random() - 0.5) * 3 // Cambios en puntos de bolsa
            }

            // Activar destello de actualización en el ticker
            setUpdatedCodes(prev => ({ ...prev, [ind.codigo]: true }))
            setTimeout(() => {
              setUpdatedCodes(prev => ({ ...prev, [ind.codigo]: false }))
            }, 1200)


            return {
              ...ind,
              valor: valNum + delta
            }
          }
          return ind
        })
      )
    }, 5000) // Actualización visual cada 5 segundos

    return () => clearInterval(ticksInterval)
  }, [])

  useEffect(() => {
    setLiveIndicators(indicators)
  }, [indicators])

  useEffect(() => {
    setMounted(true)
    
    const windInterval = setInterval(() => {
      setWindSpeed(prev => {
        const change = Math.floor(Math.random() * 9) - 4 
        const next = prev + change
        return Math.max(25, Math.min(105, next)) 
      })
    }, 12000)

    let channel: any
    try {
      const supabase = createClient()
      setRealtimeStatus('connecting')

      channel = supabase
        .channel('economic_indicators_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'economic_indicators'
          },
          (payload) => {
            console.log('🔄 [Realtime] Cambio detectado en indicadores:', payload)
            
            const newRecord = payload.new as Indicator
            if (newRecord && newRecord.codigo) {
              setLiveIndicators(prev => {
                const updated = [...prev]
                const idx = updated.findIndex(i => i.codigo === newRecord.codigo)
                if (idx !== -1) {
                  updated[idx] = { ...updated[idx], ...newRecord }
                } else {
                  updated.push(newRecord)
                }
                return updated
              })

              setUpdatedCodes(prev => ({ ...prev, [newRecord.codigo]: true }))
              setTimeout(() => {
                setUpdatedCodes(prev => ({ ...prev, [newRecord.codigo]: false }))
              }, 2000)

              setLastSync(new Date())
            }
          }
        )
        
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected')
        }
      })
    } catch (error) {
      console.error('❌ Error configurando channel Supabase:', error)
      setRealtimeStatus('disconnected')
    }
    
    return () => {
      clearInterval(windInterval)
      if (channel) {
        try {
          const supabase = createClient()
          supabase.removeChannel(channel)
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [indicators])

  if (!mounted) return <div className="h-11 bg-background border-b border-border" />

  const getVal = (code: string, decimals = 2) => {
    const ind = liveIndicators.find(i => i.codigo === code)
    if (!ind) return null;
    return Number(ind.valor).toLocaleString('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  interface TickerItem {
    label: string
    value: string
    icon: any
    color: string
    live?: boolean
    code?: string
  }

  // Indicadores y activos del mercado global y nacional
  const financialItems: TickerItem[] = [
    { label: "UF", value: `$${getVal('uf') || '---'}`, icon: ArrowUp, color: "text-emerald-500", code: 'uf' },
    { label: "DÓLAR", value: `$${getVal('dolar') || '---'}`, icon: ArrowUp, color: "text-emerald-500", code: 'dolar' },
    { label: "EURO", value: `$${getVal('euro') || '---'}`, icon: ArrowDown, color: "text-rose-500", code: 'euro' },
    { label: "UTM", value: `$${getVal('utm', 0) || '---'}`, icon: ArrowUp, color: "text-indigo-500", code: 'utm' },
    { label: "IPSA", value: `${getVal('ipsa', 0) || '---'}`, icon: ArrowUp, color: "text-blue-500", code: 'ipsa' },
    { label: "S&P 500", value: `${getVal('sp500', 1) || '---'}`, icon: ArrowUp, color: "text-indigo-500", code: 'sp500' },
    { label: "ORO", value: `US$ ${getVal('oro') || '---'}`, icon: ArrowUp, color: "text-amber-500", code: 'oro' },
    { label: "COBRE", value: `US$ ${getVal('libra_cobre') || '---'}`, icon: ArrowDown, color: "text-emerald-500", code: 'libra_cobre' },
    { label: "WTI PETRÓLEO", value: `US$ ${getVal('wti') || '---'}`, icon: ArrowUp, color: "text-sky-500", code: 'wti' },
  ]

  const tickerItems = [...financialItems, ...financialItems, ...financialItems]


  return (
    <div className="w-full bg-background/60 border-b border-border/50 h-11 flex items-center overflow-hidden sticky top-0 z-[60] backdrop-blur-2xl">
      <div className="absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
      
      <div className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
        {tickerItems.map((item, idx) => {
          const isUpdated = item.code && updatedCodes[item.code];
          return (
            <div 
              key={idx} 
              className={`flex items-center gap-3 px-10 border-r border-border/40 last:border-0 h-full transition-all duration-500 cursor-default ${
                isUpdated 
                  ? 'bg-emerald-500/10 text-emerald-400 scale-105 font-bold' 
                  : 'hover:bg-primary/[0.02]'
              }`}
            >
              <item.icon className={`w-3.5 h-3.5 ${item.color} opacity-70 group-hover:opacity-100 transition-opacity shrink-0`} />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">{item.label}</span>
              <span className={`text-sm font-black tracking-tight tabular-nums transition-colors duration-500 ${
                isUpdated ? 'text-emerald-500 animate-pulse' : 'text-foreground/80'
              }`}>
                {item.value}
              </span>
            </div>
          )
        })}
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
        }
      `}</style>
    </div>
  )
}
