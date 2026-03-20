'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, Brain, Activity, Target, AlertCircle, 
  Shield, Trophy, Package, TrendingUp, LineChart, RefreshCw, Loader2
} from 'lucide-react'
import { getExecutiveMetrics } from '@/actions/dashboard'

interface DashboardData {
  year: number
  orgName?: string
  financials: {
    totalSales: number
    totalPurchases: number
    grossMargin: number
    marginPercentage: number
    ebitda: number
  }
  assets: {
    totalValue: number
    totalDepreciation: number
  }
  monthlyTrend: {
    month: string
    sales: number
    purchases: number
    margin: number
  }[]
  executiveSummary: {
    overallAssessment: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'CRITICAL'
    score: number
    insights: string[]
  }
}

const ASSESSMENT_STYLES = {
  EXCELLENT: { bg: 'bg-emerald-50', border: 'border-t-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Trophy },
  GOOD:      { bg: 'bg-blue-50',    border: 'border-t-blue-500',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700 border-blue-200',       icon: Target },
  AVERAGE:   { bg: 'bg-amber-50',   border: 'border-t-amber-500',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700 border-amber-200',     icon: Activity },
  CRITICAL:  { bg: 'bg-rose-50',    border: 'border-t-rose-500',    text: 'text-rose-700',    badge: 'bg-rose-100 text-rose-700 border-rose-200',        icon: AlertCircle },
}

export function ExecutiveDashboardClient({ activeOrgId }: { activeOrgId: string }) {
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear())
  const [data, setData] = useState<DashboardData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    setError(null)
    try {
      const result = await getExecutiveMetrics(targetYear, activeOrgId)
      if (result.error) {
        setError(result.error)
      } else {
        setData(result)
      }
    } catch (err: any) {
      setError("Error crítico conectando al motor financiero Python.")
    } finally {
      setIsAnalyzing(false)
    }
  }, [targetYear, activeOrgId])

  useEffect(() => {
    performAnalysis()
  }, [performAnalysis, targetYear, activeOrgId])

  const fCLP = (val: number) => new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', minimumFractionDigits: 0
  }).format(val)

  // ―― ESTADO: Calculando ――
  if (isAnalyzing) {
    return (
      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10 mt-6" suppressHydrationWarning={true}>
        <CardContent className="p-16 flex flex-col items-center justify-center text-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Brain className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Motor Python Analizando…</h3>
            <p className="text-muted-foreground font-bold italic text-sm">
              Cruzando datos de Compras, Ventas, Activos y Libro Diario en tiempo real.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ―― ESTADO: Error ――
  if (error) {
    return (
      <div className="flex items-center gap-4 p-6 border-2 border-rose-100 rounded-3xl bg-rose-50/50 mt-6" suppressHydrationWarning={true}>
        <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
        <p className="text-rose-800 font-bold text-sm">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const summary = data.executiveSummary
  const style = ASSESSMENT_STYLES[summary.overallAssessment]
  const AssessIcon = style.icon

  return (
    <div className="space-y-8 mt-6" suppressHydrationWarning={true}>

      {/* ―― CABECERA DEL MOTOR ―― */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-8 bg-card border border-border shadow-xl rounded-[2.5rem]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
              Análisis Financiero V2
              {data?.orgName && <span className="text-primary/60 ml-2 text-base font-bold normal-case italic">({data.orgName})</span>}
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black italic">MOTOR PYTHON — CRUCE DE COMPRAS, VENTAS Y LIBRO DIARIO</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value))}
            className="h-12 bg-white border border-border text-foreground rounded-2xl px-5 text-sm font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button
            onClick={performAnalysis}
            variant="outline"
            className="h-12 px-6 rounded-2xl border-border font-black uppercase text-[10px] tracking-widest hover:bg-muted gap-2 shadow-sm active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-primary" /> RECALCULAR
          </Button>
        </div>
      </div>

      {/* ―― RESUMEN EJECUTIVO ―― */}
      <Card className={`bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 ${style.border} relative`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/3 rounded-full blur-[120px] pointer-events-none" />
        <CardHeader className="bg-muted/5 border-b border-border p-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className={`p-5 rounded-3xl border-2 inline-flex shadow-lg ${style.bg} ${style.text} border-opacity-20`}>
              <AssessIcon className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Salud del Negocio</CardTitle>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-black text-foreground bg-muted/30 px-4 py-1 rounded-xl border border-border">
                  {summary.score}<span className="text-sm text-muted-foreground font-bold">/100</span>
                </span>
                <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${style.badge}`}>
                  {summary.overallAssessment}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 relative z-10 space-y-8">
          {/* KPIs financieros */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { label: 'Ventas del Giro', value: fCLP(data.financials.totalSales), color: 'text-emerald-700', bg: 'bg-emerald-50/50 border-emerald-100' },
              { label: 'Compras / Costos', value: fCLP(data.financials.totalPurchases), color: 'text-rose-700', bg: 'bg-rose-50/50 border-rose-100' },
              { label: 'Margen Bruto', value: fCLP(data.financials.grossMargin), color: 'text-blue-700', bg: 'bg-blue-50/50 border-blue-100' },
              { label: 'EBITDA Estimado', value: fCLP(data.financials.ebitda), color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
            ].map(k => (
              <div key={k.label} className={`p-6 rounded-3xl border-2 ${k.bg}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{k.label}</p>
                <p className={`text-xl font-black tracking-tighter ${k.color} break-all`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Insights del motor */}
          {summary.insights.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-1">CONCLUSIONES DEL MOTOR ANALÍTICO</p>
              {summary.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-4 bg-primary/[0.03] p-5 rounded-2xl border border-primary/10 transition-all hover:bg-primary/[0.06] hover:border-primary/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0 shadow-sm" />
                  <p className="text-foreground/80 font-bold leading-relaxed text-sm">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ―― CARDS SECUNDARIAS ―― */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIVOS */}
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
                <span className="font-black text-foreground text-sm tabular-nums">{fCLP(data.assets.totalValue)}</span>
              </div>
              <div className="flex justify-between items-center py-5 border-b border-border">
                <span className="text-muted-foreground font-bold text-sm">Depreciación Acumulada</span>
                <span className="font-black text-rose-600 text-sm tabular-nums">-{fCLP(data.assets.totalDepreciation)}</span>
              </div>
              <div className="flex justify-between items-center pt-5">
                <span className="text-foreground font-black text-sm uppercase tracking-tight">Valor Libro Neto</span>
                <span className="font-black text-primary text-2xl tracking-tighter tabular-nums">{fCLP(data.assets.totalValue - data.assets.totalDepreciation)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FLUJO MENSUAL */}
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500/10">
          <CardHeader className="bg-muted/5 border-b border-border p-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <LineChart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">Flujo Transaccional {data.year}</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">VENTAS VS COMPRAS — MES A MES</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
              {data.monthlyTrend.filter(m => m.sales > 0 || m.purchases > 0).length === 0 ? (
                <div className="text-center text-muted-foreground py-16 italic font-bold text-sm">
                  Sin flujos transaccionales registrados en {data.year}.
                </div>
              ) : (
                data.monthlyTrend.filter(m => m.sales > 0 || m.purchases > 0).map((m) => (
                  <div key={m.month} className="flex justify-between items-center py-3 px-5 hover:bg-muted/30 rounded-2xl transition-colors group">
                    <span className="text-foreground/50 uppercase font-black text-[10px] tracking-[0.25em] w-10 shrink-0">{m.month}</span>
                    <div className="flex-1 px-4 flex justify-between gap-2">
                      <span className="text-emerald-600 font-black text-xs tabular-nums">+{fCLP(m.sales)}</span>
                      <span className="text-rose-600 font-black text-xs tabular-nums">-{fCLP(m.purchases)}</span>
                    </div>
                    <span className={`font-black text-xs tabular-nums w-28 text-right ${m.margin > 0 ? 'text-primary' : 'text-amber-600'}`}>
                      {fCLP(m.margin)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
