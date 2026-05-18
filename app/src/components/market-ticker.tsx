'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  Building2, 
  BarChart3, 
  Package, 
  Zap, 
  Activity, 
  Globe,
  ArrowUp,
  ArrowDown,
  Wind,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react'

import { Indicator } from '@/lib/types/dashboard'
import { createClient } from '@/lib/supabase/client'

export function MarketTicker({ indicators = [] }: { indicators: Indicator[] }) {
  const [mounted, setMounted] = useState(false)
  const [windSpeed, setWindSpeed] = useState(54) // Velocidad del viento típica en Punta Arenas (km/h)
  
  // Sincronización Dinámica de Indicadores en Tiempo Real
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

  useEffect(() => {
    setMounted(true)
    
    // Simular fluctuación del famoso viento patagónico en tiempo real
    const windInterval = setInterval(() => {
      setWindSpeed(prev => {
        const change = Math.floor(Math.random() * 9) - 4 // -4 a +4 km/h
        const next = prev + change
        return Math.max(25, Math.min(105, next)) // Rangos realistas de viento austral
      })
    }, 12000)

    // Inicializar canal de Supabase Realtime para recibir cambios del motor Python
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
              // 1. Actualizar el estado con el nuevo valor
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

              // 2. Marcar el código para la micro-animación de destello verde
              setUpdatedCodes(prev => ({ ...prev, [newRecord.codigo]: true }))
              setTimeout(() => {
                setUpdatedCodes(prev => ({ ...prev, [newRecord.codigo]: false }))
              }, 2000)

              // 3. Actualizar la fecha de última sincronización al instante actual
              setLastSync(new Date())
            }
          }
        )
        
      channel.subscribe((status: string) => {
        console.log(`📡 [Realtime] Suscripción estado: ${status}`)
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected')
        }
      })
    } catch (error) {
      console.error('❌ Error configurando canal en tiempo real:', error)
      setRealtimeStatus('disconnected')
    }
    
    return () => {
      clearInterval(windInterval)
      if (channel) {
        try {
          const supabase = createClient()
          supabase.removeChannel(channel)
        } catch (e) {
          console.error('Error removiendo canal de tiempo real:', e)
        }
      }
    }
  }, [indicators])

  if (!mounted) return <div className="h-11 bg-background border-b border-border" />

  /** 🛡️ Protocolo de Veracidad Absoluta */
  const isDataReady = Array.isArray(liveIndicators) && liveIndicators.length > 0;

  const getVal = (code: string, decimals = 2) => {
    const ind = liveIndicators.find(i => i.codigo === code)
    if (!ind) return null;
    return Number(ind.valor).toLocaleString('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const formatSyncTime = (date: Date | null) => {
    if (!date) return '---'
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const formatSyncDate = (date: Date | null) => {
    if (!date) return '---'
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit'
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

  // Estilo y valor del estado de conexión
  const getStatusItem = (): TickerItem => {
    switch (realtimeStatus) {
      case 'connected':
        return {
          label: "CONEXIÓN",
          value: "EN VIVO",
          icon: Wifi,
          color: "text-emerald-500",
          live: true,
          code: 'conexion'
        }
      case 'connecting':
        return {
          label: "CONEXIÓN",
          value: "CONECTANDO...",
          icon: RefreshCw,
          color: "text-amber-500 animate-spin",
          live: false,
          code: 'conexion'
        }
      case 'disconnected':
      default:
        return {
          label: "CONEXIÓN",
          value: "FUERA DE LÍNEA",
          icon: WifiOff,
          color: "text-rose-500",
          live: false,
          code: 'conexion'
        }
    }
  }

  const items: TickerItem[] = [
    { label: "UF", value: `$${getVal('uf') || '---'}`, icon: ArrowUp, color: "text-emerald-500", code: 'uf' },
    { label: "DÓLAR", value: `$${getVal('dolar') || '---'}`, icon: ArrowUp, color: "text-emerald-500", code: 'dolar' },
    { label: "EURO", value: `$${getVal('euro') || '---'}`, icon: ArrowDown, color: "text-rose-500", code: 'euro' },
    { label: "UTM", value: `$${getVal('utm', 0) || '---'}`, icon: ArrowUp, color: "text-indigo-500", code: 'utm' },
    { label: "VIENTO PUQ", value: `${windSpeed} km/h`, icon: Wind, color: "text-sky-400 font-bold", code: 'viento' },
    { label: "IPSA", value: `${getVal('ipsa', 0) || '---'}`, icon: ArrowUp, color: "text-blue-500", code: 'ipsa' },
    { label: "COBRE", value: `US$ ${getVal('libra_cobre') || '---'}`, icon: ArrowDown, color: "text-emerald-500", code: 'libra_cobre' },
    { label: "PETRÓLEO", value: `US$ ${getVal('wti') || '---'}`, icon: ArrowUp, color: "text-orange-500", code: 'wti' },
    { 
      label: "SINCRO", 
      value: lastSync ? `${formatSyncDate(lastSync)} ${formatSyncTime(lastSync)}` : '---', 
      icon: Clock, 
      color: "text-amber-500/80 font-mono",
      code: 'sincro' 
    },
    getStatusItem()
  ]

  const tickerItems = [...items, ...items, ...items]

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
              {item.live ? (
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                </div>
              ) : (
                <item.icon className={`w-3.5 h-3.5 ${item.color} opacity-70 group-hover:opacity-100 transition-opacity shrink-0`} />
              )}
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">{item.label}</span>
              <span className={`text-sm font-black tracking-tight tabular-nums transition-colors duration-500 ${
                isUpdated ? 'text-emerald-500' : 'text-foreground/80'
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
