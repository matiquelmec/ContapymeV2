'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart } from 'lucide-react'
import { MonthlyTrend } from '@/lib/types/dashboard'

interface TransactionalTrendCardProps {
  trend: MonthlyTrend[]
  year: number
}

export function TransactionalTrendCard({ trend, year }: TransactionalTrendCardProps) {
  const fCLP = (val: number) => new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', minimumFractionDigits: 0
  }).format(val)

  const activeTrends = trend.filter(m => m.sales > 0 || m.purchases > 0)

  return (
    <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500/10">
      <CardHeader className="bg-muted/5 border-b border-border p-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <LineChart className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">Flujo Transaccional {year}</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">VENTAS VS COMPRAS — MES A MES</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
          {activeTrends.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 italic font-bold text-sm">
              Sin flujos transaccionales registrados en {year}.
            </div>
          ) : (
            activeTrends.map((m) => (
              <div key={m.month} className="flex justify-between items-center py-3 px-5 hover:bg-muted/30 rounded-2xl transition-colors group">
                <span className="text-foreground/50 uppercase font-black text-[10px] tracking-[0.25em] w-10 shrink-0">{m.month}</span>
                <div className="flex-1 px-4 flex justify-between gap-2 overflow-hidden">
                  <span className="text-emerald-600 font-black text-[10px] tabular-nums" title="Ventas">V: {fCLP(m.sales)}</span>
                  <span className="text-rose-600 font-black text-[10px] tabular-nums" title="Compras">C: {fCLP(m.purchases)}</span>
                  <span className="text-orange-600 font-black text-[10px] tabular-nums" title="Remuneraciones">R: {fCLP(m.payroll)}</span>
                </div>
                <span className={`font-black text-xs tabular-nums w-24 text-right ${m.margin > 0 ? 'text-primary' : 'text-rose-600'}`}>
                  {fCLP(m.margin)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
