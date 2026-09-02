'use client'

import { useState, useMemo, useEffect } from 'react'
import { Calculator, DollarSign, ShieldCheck, ArrowRight, Building2, HelpCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface JobSalaryCalculatorProps {
  initialGrossSalary?: number
  salaryRaw?: string
}

/**
 * Motor Matemático Previsional de Chile (Normativa 2026)
 * Tasas de cotización obligatoria estándar para contrato indefinido:
 * - AFP: 11.45% promedio
 * - Salud: 7.00% legal
 * - AFC Trabajador: 0.60%
 * Total retenciones previsionales básicas: 19.05%
 */
const TASA_AFP = 0.1145
const TASA_SALUD = 0.0700
const TASA_AFC = 0.0060
const TASA_PREVISIONAL_TOTAL = TASA_AFP + TASA_SALUD + TASA_AFC // 0.1905
const FACTOR_NETO = 1 - TASA_PREVISIONAL_TOTAL // 0.8095

// Aportes de la Empresa
const TASA_SIS_EMPRESA = 0.0149 // 1.49% Seguro Invalidez y Sobrevivencia
const TASA_AFC_EMPRESA = 0.0240 // 2.40% AFC Empleador contrato indefinido

// Tramos de Impuesto Único de Segunda Categoría (Base Tributable en CLP, UTM referencial $69.889)
function calcularImpuestoSegundaCategoria(baseTributable: number): number {
  if (baseTributable <= 943500) return 0 // Exento hasta 13.5 UTM
  if (baseTributable <= 2096670) {
    return Math.round((baseTributable * 0.04) - 37740)
  }
  if (baseTributable <= 3494450) {
    return Math.round((baseTributable * 0.08) - 121607)
  }
  if (baseTributable <= 4892230) {
    return Math.round((baseTributable * 0.135) - 313801)
  }
  return Math.round((baseTributable * 0.23) - 778563)
}

/**
 * Cálculo Directo: De Bruto a Líquido (Net-Down)
 */
export function calculateFromGross(gross: number) {
  const safeGross = Math.max(0, Math.min(50000000, Math.round(gross)))
  const afp = Math.round(safeGross * TASA_AFP)
  const salud = Math.round(safeGross * TASA_SALUD)
  const afc = Math.round(safeGross * TASA_AFC)

  const baseTributable = Math.max(0, safeGross - afp - salud - afc)
  const impuesto = Math.max(0, calcularImpuestoSegundaCategoria(baseTributable))

  const totalDescuentos = afp + salud + afc + impuesto
  const liquido = Math.max(0, safeGross - totalDescuentos)

  const sisEmpresa = Math.round(safeGross * TASA_SIS_EMPRESA)
  const afcEmpresa = Math.round(safeGross * TASA_AFC_EMPRESA)
  const costoTotalEmpresa = safeGross + sisEmpresa + afcEmpresa

  return {
    gross: safeGross,
    liquido,
    afp,
    salud,
    afc,
    impuesto,
    totalDescuentos,
    sisEmpresa,
    afcEmpresa,
    costoTotalEmpresa,
  }
}

/**
 * Cálculo Inverso: De Líquido a Bruto (Gross-Up)
 * Resuelve el sueldo bruto imponible contractual necesario para que tras retenciones
 * de AFP, Salud, AFC e impuesto, el trabajador reciba exactamente el monto líquido deseado.
 */
export function calculateFromNet(targetNet: number) {
  const safeNet = Math.max(0, Math.min(40000000, Math.round(targetNet)))
  if (safeNet === 0) {
    return calculateFromGross(0)
  }

  // Estimación inicial por factor no afecto a impuesto
  let approxGross = Math.round(safeNet / FACTOR_NETO)

  // Búsqueda por aproximación sucesiva para cuadratura exacta (tolerancia $0 CLP)
  let current = calculateFromGross(approxGross)
  let iterations = 0
  while (current.liquido !== safeNet && iterations < 30) {
    const diff = safeNet - current.liquido
    approxGross += diff
    current = calculateFromGross(approxGross)
    iterations++
  }

  return current
}

/**
 * Detecta si el texto de remuneración expresa un sueldo Líquido o Bruto.
 */
export function detectSalaryMode(salaryRaw?: string): 'liquido' | 'bruto' {
  if (!salaryRaw) return 'liquido'
  const text = salaryRaw.toLowerCase()
  if (text.includes('bruto') || text.includes('imponible')) {
    return 'bruto'
  }
  // En Chile, por defecto las ofertas de empleo suelen publicarse en líquido (bolsillo)
  return 'liquido'
}

export function JobSalaryCalculator({ initialGrossSalary, salaryRaw }: JobSalaryCalculatorProps) {
  // Detección inicial inteligente de la modalidad según el aviso
  const detectedMode = useMemo(() => detectSalaryMode(salaryRaw), [salaryRaw])
  const [mode, setMode] = useState<'liquido' | 'bruto'>(detectedMode)
  
  // Monto inicial: si no viene definido, usamos $850.000 como referencia regional Magallanes
  const initialAmount = initialGrossSalary && initialGrossSalary > 0 ? initialGrossSalary : 850000
  const [amount, setAmount] = useState<number>(initialAmount)

  // Si cambia el aviso o el sueldo inicial, sincronizamos
  useEffect(() => {
    if (initialGrossSalary && initialGrossSalary > 0) {
      setAmount(initialGrossSalary)
    }
    setMode(detectSalaryMode(salaryRaw))
  }, [initialGrossSalary, salaryRaw])

  // Cálculo según modalidad
  const result = useMemo(() => {
    if (mode === 'liquido') {
      return calculateFromNet(amount)
    } else {
      return calculateFromGross(amount)
    }
  }, [mode, amount])

  return (
    <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-zinc-950 text-white shadow-2xl space-y-6 border border-zinc-800 box-border overflow-hidden">
      {/* Cabecera de la Calculadora */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Calculator className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-[0.25em] text-zinc-200 truncate">
            Simulador de Remuneración Laboral
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Normativa Chile 2026
          </span>
        </div>
      </div>

      {/* Selector Interactivo: Sueldo Líquido vs Sueldo Bruto */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
          ¿Cómo deseas simular la oferta?
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-800/80 rounded-2xl border border-zinc-700/60">
          <button
            type="button"
            onClick={() => {
              setMode('liquido')
              setAmount(result.liquido)
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'liquido'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
            }`}
          >
            💰 Sueldo Líquido (Bolsillo)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('bruto')
              setAmount(result.gross)
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'bruto'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
            }`}
          >
            💼 Sueldo Bruto (Imponible)
          </button>
        </div>
      </div>

      {/* Input de Monto */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
            {mode === 'liquido' ? 'Monto Líquido Deseado (a recibir en tu cuenta)' : 'Sueldo Bruto Imponible en Contrato'}
          </label>
          <span className="text-xl font-black text-emerald-400 tabular-nums">
            ${amount.toLocaleString('es-CL')} CLP
          </span>
        </div>

        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="number"
            step={25000}
            min={400000}
            max={20000000}
            value={amount}
            onChange={(e) => {
              const val = Number(e.target.value) || 0
              setAmount(Math.max(0, Math.min(25000000, val)))
            }}
            className="pl-10 h-12 rounded-xl bg-zinc-800/80 border-zinc-700 text-white font-mono text-sm focus-visible:ring-emerald-400 w-full box-border"
          />
        </div>
        <p className="text-[10px] text-zinc-400">
          {mode === 'liquido'
            ? '💡 El sistema calcula de forma inversa (Gross-Up) el sueldo bruto contractual necesario para que te queden exactamente estos pesos líquidos.'
            : '💡 El sistema descuenta las cotizaciones legales obligatorias para estimar tu dinero en mano.'}
        </p>
      </div>

      {/* Resultados Destacados Duales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Tarjeta Sueldo Líquido */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
            Líquido en Bolsillo
          </span>
          <p className="text-2xl font-black text-white tabular-nums">
            ${result.liquido.toLocaleString('es-CL')} <span className="text-xs text-emerald-300 font-medium">CLP</span>
          </p>
          <span className="text-[10px] text-zinc-400 block">
            Dinero real disponible tras descuentos
          </span>
        </div>

        {/* Tarjeta Sueldo Bruto */}
        <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300 block">
            Bruto Imponible Contractual
          </span>
          <p className="text-2xl font-black text-zinc-100 tabular-nums">
            ${result.gross.toLocaleString('es-CL')} <span className="text-xs text-zinc-400 font-medium">CLP</span>
          </p>
          <span className="text-[10px] text-zinc-400 block">
            Monto estipulado en tu contrato de trabajo
          </span>
        </div>
      </div>

      {/* Desglose de Retenciones Previsionales del Trabajador */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-3 text-xs box-border">
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
          Descuentos Previsionales Obligatorios (Aporte Trabajador)
        </span>
        <div className="flex justify-between items-center text-zinc-300 font-medium">
          <span>AFP Obligatoria (11.45% promedio):</span>
          <span className="text-zinc-200 tabular-nums font-mono">-${result.afp.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-300 font-medium">
          <span>Salud Legal (Fonasa / Isapre 7.00%):</span>
          <span className="text-zinc-200 tabular-nums font-mono">-${result.salud.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-300 font-medium">
          <span>Seguro de Cesantía AFC (0.60% trabajador):</span>
          <span className="text-zinc-200 tabular-nums font-mono">-${result.afc.toLocaleString('es-CL')}</span>
        </div>
        {result.impuesto > 0 && (
          <div className="flex justify-between items-center text-amber-400 font-medium">
            <span>Impuesto Único 2da Categoría (SII):</span>
            <span className="tabular-nums font-mono">-${result.impuesto.toLocaleString('es-CL')}</span>
          </div>
        )}
        <div className="border-t border-zinc-800 pt-2 flex justify-between items-center text-zinc-300 font-bold text-[11px] uppercase tracking-wider">
          <span>Total Descuentos:</span>
          <span className="text-rose-400 tabular-nums font-mono">-${result.totalDescuentos.toLocaleString('es-CL')}</span>
        </div>
      </div>

      {/* Costo Total Empleador (Aportes Patronales) */}
      <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <span>Costo Total Empresa Estimado (Sueldo + Aportes Patronales)</span>
        </div>
        <div className="flex justify-between items-center text-zinc-400 text-[11px]">
          <span>SIS Empresa (1.49%) + AFC Empleador (2.40%):</span>
          <span className="text-zinc-300 font-mono">+${(result.sisEmpresa + result.afcEmpresa).toLocaleString('es-CL')}</span>
        </div>
        <div className="border-t border-zinc-800/80 pt-1.5 flex justify-between items-center font-bold text-xs">
          <span className="text-zinc-300">Inversión Total Mensual del Empleador:</span>
          <span className="text-emerald-400 font-mono">${result.costoTotalEmpresa.toLocaleString('es-CL')} CLP</span>
        </div>
      </div>

      <p className="text-[10px] text-zinc-500 italic leading-relaxed text-center">
        * Estimación referencial basada en normativa laboral y tributaria chilena 2026. Los montos no incluyen asignaciones no imponibles de zona extrema (Ley 889) ni colación y movilización en faena.
      </p>
    </div>
  )
}
