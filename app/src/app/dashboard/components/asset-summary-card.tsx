'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Package } from 'lucide-react'
import { AssetMetrics } from '@/lib/types/dashboard'

interface AssetSummaryCardProps {
  assets: AssetMetrics
}

export function AssetSummaryCard({ assets }: AssetSummaryCardProps) {
  const fCLP = (val: number) => new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', minimumFractionDigits: 0
  }).format(val)

  return (
    <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-indigo-500/10">
      <CardHeader className="bg-muted/5 border-b border-border p-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">Gestión de Activos</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">VALOR LIBRO Y DEPRECIACIÓN ACUMULADA</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-1">
          <div className="flex justify-between items-center py-5 border-b border-border">
            <span className="text-muted-foreground font-bold text-sm">Total Inversión Bruta</span>
            <span className="font-black text-foreground text-sm tabular-nums">{fCLP(assets.totalValue)}</span>
          </div>
          <div className="flex justify-between items-center py-5 border-b border-border">
            <span className="text-muted-foreground font-bold text-sm">Depreciación Acumulada</span>
            <span className="font-black text-rose-600 text-sm tabular-nums">-{fCLP(assets.totalDepreciation)}</span>
          </div>
          <div className="flex justify-between items-center pt-5">
            <span className="text-foreground font-black text-sm uppercase tracking-tight">Valor Libro Neto</span>
            <span className="font-black text-primary text-2xl tracking-tighter tabular-nums">{fCLP(assets.totalValue - assets.totalDepreciation)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
