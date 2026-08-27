'use client'

import { useState, useMemo } from 'react'
import { Calculator, DollarSign, ShieldCheck, Info, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface JobSalaryCalculatorProps {
  initialGrossSalary: number
  salaryRaw?: string
}

export function JobSalaryCalculator({ initialGrossSalary, salaryRaw }: JobSalaryCalculatorProps) {
  const [gross, setGross] = useState<number>(initialGrossSalary || 1000000)

  const calculation = useMemo(() => {
    const afp = Math.round(gross * 0.1145) // AFP promedio (Habitat/Cuprum/Modelo)
    const salud = Math.round(gross * 0.07) // Fonasa o 7% legal Isapre
    const afc = Math.round(gross * 0.006) // AFC trabajador contrato indefinido (0.6%)

    const imponible = Math.max(0, gross - afp - salud - afc)

    // Impuesto Único de Segunda Categoría (Tramos mensuales Chile 2026)
    let impuesto = 0
    if (imponible > 950000 && imponible <= 2100000) {
      impuesto = Math.round((imponible - 950000) * 0.04)
    } else if (imponible > 2100000 && imponible <= 3500000) {
      impuesto = Math.round(46000 + (imponible - 2100000) * 0.08)
    } else if (imponible > 3500000) {
      impuesto = Math.round(158000 + (imponible - 3500000) * 0.135)
    }

    const totalDescuentos = afp + salud + afc + impuesto
    const liquido = Math.max(0, gross - totalDescuentos)

    return {
      afp,
      salud,
      afc,
      impuesto,
      totalDescuentos,
      liquido
    }
  }, [gross])

  return (
    <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-zinc-950 text-white shadow-2xl space-y-6 border border-zinc-800 box-border overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Calculator className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-[0.25em] text-zinc-300 truncate">
            Calculadora de Sueldo Líquido Regional
          </span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
          Normativa Chile 2026
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Sueldo Bruto Imponible Ofertado
          </label>
          <span className="text-lg font-black text-emerald-400 tabular-nums">
            ${gross.toLocaleString('es-CL')} CLP
          </span>
        </div>

        {/* Input numérico */}
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="number"
            step={50000}
            min={500000}
            max={10000000}
            value={gross}
            onChange={(e) => setGross(Number(e.target.value) || 0)}
            className="pl-10 h-12 rounded-xl bg-zinc-800/80 border-zinc-700 text-white font-mono text-sm focus-visible:ring-emerald-400 w-full box-border"
          />
        </div>
      </div>

      {/* Desglose de Descuentos Legales */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-3 text-xs box-border">
        <div className="flex justify-between items-center text-zinc-400 font-medium">
          <span>AFP Obligatoria (11.45% aprox):</span>
          <span className="text-zinc-200 tabular-nums font-mono">-${calculation.afp.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-400 font-medium">
          <span>Salud Legal (Fonasa / Isapre 7%):</span>
          <span className="text-zinc-200 tabular-nums font-mono">-${calculation.salud.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-400 font-medium">
          <span>Seguro de Cesantía AFC (0.6%):</span>
          <span className="text-zinc-200 tabular-nums font-mono">-${calculation.afc.toLocaleString('es-CL')}</span>
        </div>
        {calculation.impuesto > 0 && (
          <div className="flex justify-between items-center text-amber-400/90 font-medium">
            <span>Impuesto Único 2da Categoría (SII):</span>
            <span className="tabular-nums font-mono">-${calculation.impuesto.toLocaleString('es-CL')}</span>
          </div>
        )}
        <div className="border-t border-zinc-800 pt-2 flex justify-between items-center text-zinc-400 font-bold text-[11px] uppercase tracking-wider">
          <span>Total Descuentos Previsionales:</span>
          <span className="text-rose-400 tabular-nums font-mono">-${calculation.totalDescuentos.toLocaleString('es-CL')}</span>
        </div>
      </div>

      {/* Resultado Líquido Destacado */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-zinc-900 border border-emerald-500/30 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 box-border">
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 block">
            Sueldo Líquido Estimado en Bolsillo
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white italic tracking-tight tabular-nums truncate">
            ${calculation.liquido.toLocaleString('es-CL')} <span className="text-xs text-emerald-400 font-normal">CLP / mes</span>
          </p>
        </div>
        <ShieldCheck className="h-8 w-8 text-emerald-400 shrink-0 opacity-80" />
      </div>

      <p className="text-[10px] text-zinc-500 italic leading-relaxed text-center">
        * Estimación calculada con el motor previsional de ContaPymePUQ bajo normativa chilena 2026. No incluye bonos no imponibles de zona extrema ni colación/movilización en faena.
      </p>
    </div>
  )
}
