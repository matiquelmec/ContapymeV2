'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, Brain, Activity, Target, AlertCircle, 
  Shield, Trophy, Package, TrendingUp, LineChart, RefreshCw, Newspaper, ChevronRight
} from 'lucide-react'
import { getExecutiveMetrics, getRegionalNews } from '@/actions/dashboard'
import { NewsDetailModal } from '@/components/news-detail-modal'

interface DashboardData {
  year: number
  orgName?: string
  financials: {
    totalSales: number
    totalPurchases: number
    totalPayroll: number
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
    payroll: number
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
  const [news, setNews] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNews, setSelectedNews] = useState<any>(null)

  const performAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    setError(null)
    try {
      const [result, newsResult] = await Promise.all([
        getExecutiveMetrics(targetYear, activeOrgId),
        getRegionalNews()
      ])
      
      if (result.error) {
        setError(result.error)
      } else {
        setData(result)
      }

      if (newsResult.success) {
        setNews(newsResult.data)
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
    <div className="space-y-8" suppressHydrationWarning={true}>

      {/* ―― CABECERA DEL MOTOR ―― */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-8 bg-card border border-border shadow-xl rounded-[2.5rem]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
              Análisis Financiero Contapymepuq
              {data?.orgName && <span className="text-primary/60 ml-2 text-base font-bold normal-case italic">({data.orgName})</span>}
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black italic">MOTOR PYTHON — COMPRA, VENTA Y LIBRO DIARIO</p>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Ventas del Giro', value: fCLP(data.financials.totalSales), color: 'text-emerald-700', bg: 'bg-emerald-50/50 border-emerald-100' },
              { label: 'Compras / Costos', value: fCLP(data.financials.totalPurchases), color: 'text-rose-700', bg: 'bg-rose-50/50 border-rose-100' },
              { label: 'Gasto Personal', value: fCLP(data.financials.totalPayroll), color: 'text-orange-700', bg: 'bg-orange-50/50 border-orange-100' },
              { label: 'Margen Bruto', value: fCLP(data.financials.grossMargin), color: 'text-blue-700', bg: 'bg-blue-50/50 border-blue-100' },
              { label: 'EBITDA Estimado', value: fCLP(data.financials.ebitda), color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
            ].map(k => (
              <div key={k.label} className={`p-5 rounded-3xl border-2 ${k.bg}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{k.label}</p>
                <p className={`text-lg font-black tracking-tighter ${k.color} break-all`}>{k.value}</p>
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
      </div>
      {/* ―― MAGALLANES NEWS & FLUJO SANKEY ―― */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* FLUJO DE CAJA EJECUTIVO (Sankey-like) */}
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-amber-500/10 flex flex-col">
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
                 <p className="text-2xl font-black text-emerald-700 tracking-tighter">{fCLP(data.financials.totalSales)}</p>
                 {/* Conector */}
                 <div className="absolute left-1/2 -bottom-4 w-1 h-4 bg-border -translate-x-1/2" />
              </div>

              {/* Salidas Ramificadas */}
              <div className="flex gap-4 isolate">
                <div className="flex-1 p-4 rounded-3xl border-2 bg-rose-50/50 border-rose-100 flex flex-col justify-center relative mt-4 shadow-sm">
                  {/* Conector Ramificado */}
                  <div className="absolute left-1/2 -top-4 w-[calc(100%+16px)] h-4 border-t-2 border-l-2 border-border rounded-tl-xl -translate-x-[calc(50%+8px)] -z-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-800">COSTOS OPERAC.</p>
                  <p className="text-lg font-black text-rose-700 tracking-tighter">{fCLP(data.financials.totalPurchases)}</p>
                </div>
                
                <div className="flex-1 p-4 rounded-3xl border-2 bg-orange-50/50 border-orange-100 flex flex-col justify-center relative mt-4 shadow-sm">
                  {/* Conector Ramificado Direito */}
                  <div className="absolute right-1/2 -top-4 w-[calc(100%+16px)] h-4 border-t-2 border-r-2 border-border rounded-tr-xl translate-x-[calc(50%+8px)] -z-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-800">NÓMINA (PERSONAL)</p>
                  <p className="text-lg font-black text-orange-700 tracking-tighter">{fCLP(data.financials.totalPayroll)}</p>
                </div>
              </div>

              {/* Margen Final */}
               <div className={`p-5 rounded-3xl border-4 relative mt-4 flex items-center justify-between shadow-md transition-all ${data.financials.ebitda >= 0 ? 'bg-primary/5 border-primary/20' : 'bg-rose-50 border-rose-200'}`}>
                 {/* Conector de Unión */}
                 <div className="absolute left-1/2 -top-4 w-[calc(100%-2rem)] h-4 border-b-2 border-l-2 border-r-2 border-border rounded-b-xl -translate-x-1/2 -z-10" />
                 <div className={`absolute left-1/2 top-0 w-1 h-full -translate-x-1/2 -z-10 ${data.financials.ebitda >= 0 ? 'bg-primary/10' : 'bg-rose-600/10'}`} />
                 
                 <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${data.financials.ebitda >= 0 ? 'text-primary' : 'text-rose-700'}`}>
                       Margen / EBITDA Estimado
                    </p>
                    <p className={`text-2xl font-black tracking-tighter ${data.financials.ebitda >= 0 ? 'text-primary' : 'text-rose-700'}`}>
                       {fCLP(data.financials.ebitda)}
                    </p>
                 </div>
                 <div className="text-right">
                    <span className={`px-3 py-1 rounded-full font-black text-xs uppercase tracking-widest shadow-sm text-white ${data.financials.ebitda > 0 ? 'bg-primary' : data.financials.ebitda < 0 ? 'bg-rose-600' : 'bg-slate-400'}`}>
                      {data.financials.totalSales > 0 
                        ? `${Math.round((data.financials.ebitda / data.financials.totalSales) * 100)}% RENTAB.`
                        : data.financials.ebitda < 0 ? 'DÉFICIT NETO' : 'SIN RENTABILIDAD'}
                    </span>
                 </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* MÓDULO DE NOTICIAS CON INTELIGENCIA REGIONAL */}
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-500/10 flex flex-col">
          <CardHeader className="bg-muted/5 border-b border-border p-8 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <Newspaper className="w-5 h-5 text-blue-600 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">Magallanes News</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">INTELIGENCIA ARTIFICIAL EN TIEMPO REAL</CardDescription>
              </div>
            </div>
            {news.length > 0 && (
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[450px]">
            {news.length === 0 ? (
               <div className="text-center py-20 px-8">
                 <div className="w-16 h-16 rounded-full border border-dashed border-border mx-auto mb-4 flex items-center justify-center bg-muted/20">
                    <Brain className="w-6 h-6 text-muted-foreground/50" />
                 </div>
                 <p className="font-bold text-muted-foreground text-sm max-w-[250px] mx-auto">El motor de IA está rastreando las últimas noticias económicas de la región en La Prensa Austral y El Pingüino.</p>
               </div>
            ) : (
               <div className="divide-y divide-border/50">
                 {news.map((item) => (
                   <div 
                      key={item.id} 
                      onClick={() => setSelectedNews(item)}
                      className="group flex gap-5 p-6 hover:bg-muted/30 transition-all cursor-pointer items-start"
                   >
                     {/* Imagen IA o Placeholder */}
                     <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden border border-border shrink-0 shadow-sm relative group-hover:shadow-md transition-shadow">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5">
                            <Newspaper className="w-8 h-8 text-primary/20" />
                          </div>
                        )}
                        {/* Indicador AI */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="text-[8px] font-black text-white/90 uppercase tracking-widest flex items-center gap-1"><Brain className="w-2.5 h-2.5"/> AI SUMMARY</span>
                        </div>
                     </div>
                     
                     {/* Contenido */}
                     <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20`}>
                            {item.category}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-bold tracking-wider">
                            {new Date(item.published_at).toLocaleDateString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <h4 className="font-black text-foreground text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-muted-foreground font-bold text-xs line-clamp-2 leading-relaxed">
                          {item.summary || item.content?.substring(0, 100) + '...'}
                        </p>
                     </div>
                     <ChevronRight className="w-5 h-5 text-muted-foreground/30 mt-6 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                   </div>
                 ))}
               </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NewsDetailModal 
        news={selectedNews} 
        isOpen={!!selectedNews} 
        onClose={() => setSelectedNews(null)} 
      />
    </div>
  )
}
