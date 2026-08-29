'use client'

import { Clock, ShieldCheck, MapPin } from 'lucide-react'

export function LiveSupportBadge() {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 shadow-sm backdrop-blur-md">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
      </span>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
        <span className="text-emerald-800">Soporte Local en Línea</span>
        <span className="text-emerald-600/70 font-semibold">• Resp: &lt; 15 min</span>
      </div>
    </div>
  )
}
