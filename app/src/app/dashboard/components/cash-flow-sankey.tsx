'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { FinancialMetrics } from '@/lib/types/dashboard'

interface CashFlowSankeyProps {
  financials: FinancialMetrics
}

export function CashFlowSankey({ financials }: CashFlowSankeyProps) {
  const fCLP = (val: number) => new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', minimumFractionDigits: 0
  }).format(val)

  return (
    <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-amber-500/10 flex flex-col h-full">
      <CardHeader className="bg-muted/5 border-b border-border p-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
            <BarChart3 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">Análisis de Flujo</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">CÓMO SE DISTRIBUYEN TUS INGRESOS</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 flex-1 flex flex-col justify-center">
        <div className="flex flex-col gap-4 w-full max-w-md mx-auto relative">
          {/* Entradas */}
          <div className="p-4 rounded-3xl border-2 bg-emerald-50/50 border-emerald-100 relative shadow-sm">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">1. INGRESOS (VENTAS)</p>
             <p className="text-2xl font-black text-emerald-700 tracking-tighter">{fCLP(financials.totalSales)}</p>
             <div className="absolute left-1/2 -bottom-4 w-1 h-4 bg-border -translate-x-1/2" />
          </div>

          {/* Salidas Ramificadas */}
          <div className="flex gap-4 isolate">
            <div className="flex-1 p-4 rounded-3xl border-2 bg-rose-50/50 border-rose-100 flex flex-col justify-center relative mt-4 shadow-sm">
              <div className="absolute left-1/2 -top-4 w-[calc(100%+16px)] h-4 border-t-2 border-l-2 border-border rounded-tl-xl -translate-x-[calc(50%+8px)] -z-10" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-800">COSTOS OPERAC.</p>
              <p className="text-lg font-black text-rose-700 tracking-tighter">{fCLP(financials.totalPurchases)}</p>
            </div>
            
            <div className="flex-1 p-4 rounded-3xl border-2 bg-orange-50/50 border-orange-100 flex flex-col justify-center relative mt-4 shadow-sm">
              <div className="absolute right-1/2 -top-4 w-[calc(100%+16px)] h-4 border-t-2 border-r-2 border-border rounded-tr-xl translate-x-[calc(50%+8px)] -z-10" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-800">NÓMINA (PERSONAL)</p>
              <p className="text-lg font-black text-orange-700 tracking-tighter">{fCLP(financials.totalPayroll)}</p>
            </div>
          </div>

          {/* Margen Final */}
           <div className={`p-5 rounded-3xl border-4 relative mt-4 flex items-center justify-between shadow-md transition-all ${financials.ebitda >= 0 ? 'bg-primary/5 border-primary/20' : 'bg-rose-50 border-rose-200'}`}>
             <div className="absolute left-1/2 -top-4 w-[calc(100%-2rem)] h-4 border-b-2 border-l-2 border-r-2 border-border rounded-b-xl -translate-x-1/2 -z-10" />
             <div className={`absolute left-1/2 top-0 w-1 h-full -translate-x-1/2 -z-10 ${financials.ebitda >= 0 ? 'bg-primary/10' : 'bg-rose-600/10'}`} />
             
             <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${financials.ebitda >= 0 ? 'text-primary' : 'text-rose-700'}`}>
                   Margen / EBITDA Estimado
                </p>
                <p className={`text-2xl font-black tracking-tighter ${financials.ebitda >= 0 ? 'text-primary' : 'text-rose-700'}`}>
                   {fCLP(financials.ebitda)}
                </p>
             </div>
             <div className="text-right">
                <span className={`px-3 py-1 rounded-full font-black text-xs uppercase tracking-widest shadow-sm text-white ${financials.ebitda > 0 ? 'bg-primary' : financials.ebitda < 0 ? 'bg-rose-600' : 'bg-slate-400'}`}>
                  {financials.totalSales > 0 
                    ? `${Math.round((financials.ebitda / financials.totalSales) * 100)}% RENTAB.`
                    : financials.ebitda < 0 ? 'DÉFICIT NETO' : 'SIN RENTABILIDAD'}
                </span>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
