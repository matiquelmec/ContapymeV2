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

import { Indicator } from '@/lib/types/dashboard'

export function MarketTicker({ indicators = [] }: { indicators: Indicator[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-11 bg-background border-b border-border" />

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

  if (!isDataReady) {
    return (
      <div className="w-full bg-background/95 border-b border-border h-11 flex items-center justify-center overflow-hidden sticky top-0 z-[60] backdrop-blur-2xl">
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-1 duration-1000">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/60" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
            Sincronizando con Mercados Globales — Verificando Canales Contapymepuq
          </span>
        </div>
      </div>
    );
  }

  const items = [
    { label: "UF", value: `$${getVal('uf') || '---'}`, icon: ArrowUp, color: "text-emerald-500" },
    { label: "DÓLAR", value: `$${getVal('dolar') || '---'}`, icon: ArrowUp, color: "text-emerald-500" },
    { label: "EURO", value: `$${getVal('euro') || '---'}`, icon: ArrowDown, color: "text-rose-500" },
    { label: "UTM", value: `$${getVal('utm', 0) || '---'}`, icon: ArrowUp, color: "text-indigo-500" },
    { label: "IPSA", value: `${getVal('ipsa', 0) || '---'}`, icon: ArrowUp, color: "text-blue-500" },
    { label: "COBRE", value: `US$ ${getVal('libra_cobre') || '---'}`, icon: ArrowDown, color: "text-emerald-500" },
    { label: "PETRÓLEO", value: `US$ ${getVal('wti') || '---'}`, icon: ArrowUp, color: "text-orange-500" },
    { label: "ESTADO", value: "EN VIVO", icon: Globe, color: "text-emerald-500", live: true },
  ]

  const tickerItems = [...items, ...items, ...items]

  return (
    <div className="w-full bg-background/95 border-b border-border h-11 flex items-center overflow-hidden sticky top-0 z-[60] backdrop-blur-2xl">
      <div className="absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
      
      <div className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
        {tickerItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 px-10 border-r border-border/40 last:border-0 h-full hover:bg-primary/[0.02] transition-colors cursor-default">
            {item.live ? (
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>
            ) : (
              <item.icon className={`w-3 h-3 ${item.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
            )}
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">{item.label}</span>
            <span className="text-xs font-black tracking-tight text-foreground/80 tabular-nums">{item.value}</span>
          </div>
        ))}
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
