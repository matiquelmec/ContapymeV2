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
  ArrowDown
} from 'lucide-react'

interface Indicator {
  codigo: string
  valor: number
  fecha: string
}

export function MarketTicker({ indicators = [] }: { indicators: Indicator[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-10 bg-zinc-950" />

  /** 🛡️ Protocolo de Veracidad Absoluta */
  const isDataReady = Array.isArray(indicators) && indicators.length > 0;

  const getVal = (code: string, decimals = 2) => {
    const ind = indicators.find(i => i.codigo === code)
    if (!ind) return null;
    return Number(ind.valor).toLocaleString('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  // Si no hay datos reales, mostramos un mensaje de integridad profesional
  if (!isDataReady) {
    return (
      <div className="w-full bg-background/80 border-b border-border h-11 flex items-center justify-center overflow-hidden sticky top-0 z-[60] backdrop-blur-xl">
        <div className="flex items-center gap-4 animate-in fade-in duration-1000">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 italic">
            Sincronizando con Mercados Globales — Verificando Canales de Datos Contapymepuq
          </span>
        </div>
      </div>
    );
  }

  const items = [
    { label: "UF", value: `$${getVal('uf') || '---'}`, icon: ArrowUp, color: "text-blue-600" },
    { label: "DÓLAR", value: `$${getVal('dolar') || '---'}`, icon: ArrowUp, color: "text-emerald-600" },
    { label: "EURO", value: `$${getVal('euro') || '---'}`, icon: ArrowDown, color: "text-rose-600" },
    { label: "UTM", value: `$${getVal('utm', 0) || '---'}`, icon: ArrowUp, color: "text-purple-600" },
    { label: "IPSA", value: `${getVal('ipsa', 0) || '---'}`, icon: ArrowUp, color: "text-blue-600" },
    { label: "COBRE", value: `US$ ${getVal('libra_cobre') || '---'}`, icon: ArrowDown, color: "text-emerald-600" },
    { label: "PETRÓLEO", value: `US$ ${getVal('wti') || '---'}`, icon: ArrowUp, color: "text-orange-600" },
    { label: "ESTADO", value: "EN VIVO", icon: Globe, color: "text-emerald-600", live: true },
  ]

  const tickerItems = [...items, ...items, ...items]

  return (
    <div className="w-full bg-background/80 border-b border-border h-11 flex items-center overflow-hidden sticky top-0 z-[60] relative group backdrop-blur-xl">
      <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent z-10" />
      
      <div className="flex animate-marquee whitespace-nowrap pause-group-hover:pause">
        {tickerItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5 px-8 border-r border-border/50 last:border-0 h-full hover:bg-primary/[0.03] transition-colors cursor-default">
            {item.live ? (
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" suppressHydrationWarning />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" suppressHydrationWarning />
              </div>
            ) : (
              <item.icon className={`w-3 h-3 ${item.color} opacity-80`} />
            )}
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{item.label}</span>
            <span className="text-xs font-black tracking-tight text-foreground/90 tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 45s linear infinite;
        }
        .pause-group-hover\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
