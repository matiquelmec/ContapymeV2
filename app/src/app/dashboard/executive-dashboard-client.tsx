'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Brain, Activity, Target, AlertCircle, 
  Trophy, RefreshCw
} from 'lucide-react'
import { getExecutiveMetrics, getRegionalNews } from '@/actions/dashboard'
import { NewsDetailModal } from '@/components/news-detail-modal'

import { DashboardData, RegionalNews } from '@/lib/types/dashboard'
import { MetricsGrid } from './components/metrics-grid'
import { AssetSummaryCard } from './components/asset-summary-card'
import { TransactionalTrendCard } from './components/transactional-trend-card'
import { CashFlowSankey } from './components/cash-flow-sankey'
import { RegionalNewsFeed } from './components/regional-news-feed'

const ASSESSMENT_STYLES = {
  EXCELLENT: { bg: 'bg-emerald-50', border: 'border-t-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Trophy },
  GOOD:      { bg: 'bg-blue-50',    border: 'border-t-blue-500',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700 border-blue-200',       icon: Target },
  AVERAGE:   { bg: 'bg-amber-50',   border: 'border-t-amber-500',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700 border-amber-200',     icon: Activity },
  CRITICAL:  { bg: 'bg-rose-50',    border: 'border-t-rose-500',    text: 'text-rose-700',    badge: 'bg-rose-100 text-rose-700 border-rose-200',        icon: AlertCircle },
}

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'

import { useUIStore } from '@/lib/store/ui-store'
import { dashboardDataSchema } from '@/lib/schemas/dashboard'

const LOADING_STEPS = [
  { id: 1, text: "Conectando al Motor Financiero Python..." },
  { id: 2, text: "Sincronizando registros de compras y ventas (RCV)..." },
  { id: 3, text: "Cruzando transacciones del libro diario..." },
  { id: 4, text: "Verificando firmas criptográficas en el Ledger..." },
  { id: 5, text: "Procesando depreciación de activos fijos..." },
  { id: 6, text: "Calculando salud financiera y ratios..." },
  { id: 7, text: "Finalizando reporte ejecutivo..." }
];

export function ExecutiveDashboardClient({ activeOrgId }: { activeOrgId: string }) {
  const { dashboardYear: targetYear, setDashboardYear: setTargetYear } = useUIStore()
  const [selectedNews, setSelectedNews] = useState<RegionalNews | null>(null)
  const [forceRefresh, setForceRefresh] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ―― MOTOR ANALÍTICO: MÉTRICAS ――
  const { 
    data: rawData, 
    isLoading: isAnalyzing, 
    error: metricsError,
    refetch: refetchMetrics 
  } = useQuery({
    queryKey: ['executive-metrics', activeOrgId, targetYear],
    queryFn: async () => {
      // Pasamos forceRefresh al server action
      const res = await getExecutiveMetrics(targetYear, activeOrgId, forceRefresh)
      if (forceRefresh) {
        setForceRefresh(false)
      }
      if (res && 'error' in res) {
        throw new Error(res.error as string)
      }
      // Validación Zod en tiempo de ejecución
      return dashboardDataSchema.parse(res)
    },
    retry: 1,
    staleTime: 1000 * 30, // Reducido a 30 segundos para mayor frescura y dinamismo
  })

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0)
      return
    }
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
    }, 1800)
    return () => clearInterval(interval)
  }, [isAnalyzing])

  const data = rawData as DashboardData | null

  // ―― MOTOR ANALÍTICO: NOTICIAS ――
  const { 
    data: newsData, 
    isLoading: isLoadingNews,
  } = useQuery({
    queryKey: ['regional-news'],
    queryFn: () => getRegionalNews(),
    staleTime: 1000 * 60 * 15, // 15 minutos para noticias
  })

  const news = newsData?.success ? newsData.data : []
  const error = metricsError ? (metricsError instanceof Error ? metricsError.message : "Error crítico conectando al motor financiero Python.") : null


  if (!mounted) {
    return (
      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10 mt-6">
        <CardContent className="p-16 flex flex-col items-center justify-center text-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Brain className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Cargando Dashboard...</h3>
            <p className="text-muted-foreground font-bold italic text-sm">
              Iniciando analíticas de Contapymepuq en tu navegador.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ―― ESTADO: Calculando ――
  if (isAnalyzing) {
    return (
      <Card className="bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden relative mt-6">
        {/* Glow halo de fondo */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <CardContent className="p-16 flex flex-col items-center justify-center text-center gap-8 relative z-10">
          <div className="relative flex items-center justify-center w-24 h-24">
            {/* Anillos pulsantes concéntricos */}
            <motion.div 
              className="absolute w-24 h-24 rounded-full bg-primary/10 border border-primary/20"
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute w-20 h-20 rounded-full bg-emerald-500/5 border border-emerald-500/10"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
            />
            
            {/* Círculo central flotante con el Cerebro */}
            <motion.div 
              className="relative w-16 h-16 rounded-full bg-card border border-border shadow-lg flex items-center justify-center"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Brain className="w-8 h-8 text-primary animate-pulse" />
            </motion.div>
          </div>

          <div className="space-y-4 max-w-md">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Análisis en Progreso</h3>
              <p className="text-muted-foreground font-bold italic text-sm">
                El motor financiero Python está cruzando la contabilidad del periodo.
              </p>
            </div>

            {/* Stepper dinámico y moderno */}
            <div className="mt-8 space-y-3 bg-muted/20 border border-border/50 rounded-3xl p-6 text-left">
              {LOADING_STEPS.map((s, idx) => {
                const isCompleted = idx < currentStep;
                const isActive = idx === currentStep;
                return (
                  <div 
                    key={s.id} 
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      isCompleted 
                        ? 'text-emerald-600 font-bold opacity-100' 
                        : isActive 
                        ? 'text-primary font-bold opacity-100 scale-[1.02] origin-left' 
                        : 'text-muted-foreground/30 font-semibold'
                    }`}
                  >
                    <div className="flex items-center justify-center w-5 h-5 shrink-0">
                      {isCompleted ? (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
                        >
                          <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      ) : isActive ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs uppercase tracking-wider font-mono">{s.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ―― ESTADO: Error ――
  if (error) {
    return (
      <div className="flex items-center gap-4 p-6 border-2 border-rose-100 rounded-3xl bg-rose-50/50 mt-6">
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
    <AnimatePresence mode="wait">
      <motion.div 
        key={`${activeOrgId}-${targetYear}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-8" 
      >

      {/* ―― CABECERA DEL MOTOR ―― */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-5 sm:p-8 bg-card border border-border shadow-xl rounded-[2.5rem]">
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
          <select id="field_targetyear" name="field_targetyear"
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value))}
            className="h-12 bg-white border border-border text-foreground rounded-2xl px-5 text-sm font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button
            onClick={() => {
              setForceRefresh(true)
              setTimeout(() => refetchMetrics(), 0)
            }}
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
        <CardHeader className="bg-muted/5 border-b border-border p-5 sm:p-8 md:p-10 relative z-10">
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
        <CardContent className="p-5 sm:p-8 md:p-10 relative z-10 space-y-8">
          {/* KPIs financieros - COMPONENTE MODULAR */}
          <MetricsGrid financials={data.financials} />

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
        {/* ACTIVOS - COMPONENTE MODULAR */}
        <AssetSummaryCard assets={data.assets} />

        {/* FLUJO MENSUAL - COMPONENTE MODULAR */}
        <TransactionalTrendCard trend={data.monthlyTrend} year={data.year} />
      </div>
      {/* ―― MAGALLANES NEWS & FLUJO SANKEY ―― */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* FLUJO DE CAJA EJECUTIVO - COMPONENTE MODULAR */}
        <CashFlowSankey financials={data.financials} />

        {/* MÓDULO DE NOTICIAS - COMPONENTE MODULAR */}
        <RegionalNewsFeed news={news} onSelectNews={setSelectedNews} />
      </div>

      <NewsDetailModal 
        news={selectedNews} 
        isOpen={!!selectedNews} 
        onClose={() => setSelectedNews(null)} 
      />
      </motion.div>
    </AnimatePresence>
  )
}
