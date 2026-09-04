'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, ArrowRight } from 'lucide-react'
import { AssetMetrics } from '@/lib/types/dashboard'

interface AssetSummaryCardProps {
  assets: AssetMetrics
}

export function AssetSummaryCard({ assets }: AssetSummaryCardProps) {
  const fCLP = (val: number) => new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', minimumFractionDigits: 0
  }).format(val)

  const hasAssets = assets && assets.totalValue > 0

  return (
    <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-indigo-500/10">
      <CardHeader className="bg-muted/5 border-b border-border p-5 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 shrink-0">
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-foreground uppercase tracking-tight">Gestión de Activos</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">VALOR LIBRO Y DEPRECIACIÓN ACUMULADA</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-8">
        {hasAssets ? (
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
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100/80">
              <Package className="w-6 h-6 opacity-80" />
            </div>
            <div className="space-y-1 max-w-xs mx-auto">
              <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Sin Activos Inventariados</h4>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Esta empresa aún no registra maquinarias, vehículos o equipamiento con depreciación tributaria.
              </p>
            </div>
            <Link 
              href="/dashboard/accounting/assets"
              className="inline-flex items-center justify-center rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm transition-all"
            >
              Registrar Activo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
