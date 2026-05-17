'use client'

import { FinancialMetrics } from '@/lib/types/dashboard'

interface MetricsGridProps {
  financials: FinancialMetrics
}

export function MetricsGrid({ financials }: MetricsGridProps) {
  const fCLP = (val: number) => new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', minimumFractionDigits: 0
  }).format(val)

  const kpis = [
    { 
      label: 'Ventas del Giro', 
      value: fCLP(financials.totalSales), 
      color: 'text-emerald-700', 
      bg: 'bg-emerald-50/50 border-emerald-100' 
    },
    { 
      label: 'Compras / Costos', 
      value: fCLP(financials.totalPurchases), 
      color: 'text-rose-700', 
      bg: 'bg-rose-50/50 border-rose-100' 
    },
    { 
      label: 'Gasto Personal', 
      value: fCLP(financials.totalPayroll), 
      color: 'text-orange-700', 
      bg: 'bg-orange-50/50 border-orange-100' 
    },
    { 
      label: 'Margen Bruto', 
      value: fCLP(financials.grossMargin), 
      color: 'text-blue-700', 
      bg: 'bg-blue-50/50 border-blue-100' 
    },
    { 
      label: 'EBITDA Estimado', 
      value: fCLP(financials.ebitda), 
      color: 'text-primary', 
      bg: 'bg-primary/5 border-primary/10' 
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map(k => (
        <div 
          key={k.label} 
          className={`p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all hover:scale-[1.02] duration-300 ${k.bg}`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
            {k.label}
          </p>
          <p className={`text-base sm:text-lg font-black tracking-tighter ${k.color} break-all`}>
            {k.value}
          </p>
        </div>
      ))}
    </div>
  )
}
