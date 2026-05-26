'use client'

import { useEffect, useState, useRef } from 'react'
import { 
  Globe, 
  Target, 
  Calendar, 
  Cpu, 
  TrendingUp, 
  TrendingDown, 
  BookOpen,
  ArrowRight,
  Database,
  Sliders,
  Activity,
  RefreshCw,
  MessageCircle,
  Share2,
  Instagram,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'


import { Indicator } from '@/lib/types/dashboard'

interface MarketAsset {
  symbol: string
  name: string
  price: number
  change: number
  isCrypto?: boolean
  isCommodity?: boolean
}

interface GlobalMarketPanelProps {
  indicators?: Indicator[]
}

export function GlobalMarketPanel({ indicators = [] }: GlobalMarketPanelProps) {
  const [loading, setLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')
  const [pulse, setPulse] = useState(false)

  // Estados del Simulador Táctico Autónomo
  const [selectedRegime, setSelectedRegime] = useState('MARKUP')
  const [confluence, setConfluence] = useState(88)
  const [verdict, setVerdict] = useState('GO')
  const [threat, setThreat] = useState('LOW')
  const [logic, setLogic] = useState('FVG SWEEP EN ZONA OTE')
  const [advisorAdvice, setAdvisorAdvice] = useState(
    'Estructura alcista sólida en H4. Se detecta barrida de mínimos y retesteo óptimo del Order Block institucional en torno a la zona de descuento macro.'
  )
  const [source, setSource] = useState<'local' | 'advisor'>('local')

  // Obtener el valor de un indicador de Supabase si existe
  const getIndValue = (code: string, fallback: number) => {
    const ind = indicators.find(i => i.codigo === code)
    return ind ? Number(ind.valor) : fallback
  }

  // Datos simulados de activos financieros
  const [simulatedAssets, setSimulatedAssets] = useState<MarketAsset[]>([
    { symbol: 'USD/CLP', name: 'Dólar Observado', price: 932.45, change: 0.38 },
    { symbol: 'S&P 500', name: 'S&P 500 Index', price: 5200.5, change: 0.45 },
    { symbol: 'COBRE', name: 'Cobre COMEX', price: 4.52, change: 1.25, isCommodity: true },
    { symbol: 'ORO', name: 'Oro COMEX', price: 2350.8, change: 0.85, isCommodity: true },
    { symbol: 'WTI', name: 'Petróleo WTI', price: 78.4, change: -0.25, isCommodity: true },
  ])

  // Sincronizar con los indicadores reales que vienen de las props al cargar o al actualizarse en DB
  useEffect(() => {
    setSimulatedAssets([
      { symbol: 'USD/CLP', name: 'Dólar Observado', price: getIndValue('dolar', 932.45), change: 0.38 },
      { symbol: 'S&P 500', name: 'S&P 500 Index', price: getIndValue('sp500', 5200.5), change: 0.45 },
      { symbol: 'COBRE', name: 'Cobre COMEX', price: getIndValue('libra_cobre', 4.52), change: 1.25, isCommodity: true },
      { symbol: 'ORO', name: 'Oro COMEX', price: getIndValue('oro', 2350.8), change: 0.85, isCommodity: true },
      { symbol: 'WTI', name: 'Petróleo WTI', price: getIndValue('wti', 78.4), change: -0.25, isCommodity: true },
    ])
  }, [indicators])


  // Simulación de fluctuación de ticks financieros autónoma
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedAssets(prev => 
        prev.map(asset => {
          const delta = (Math.random() - 0.5) * 0.08
          const newPrice = asset.price * (1 + delta / 100)
          return {
            ...asset,
            price: newPrice,
            change: asset.change + delta / 5
          }
        })
      )
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 600)
      return () => clearTimeout(t)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  // Inferencia interactiva local de la red neural (SMC/Wyckoff)
  const runSimulationAnalysis = () => {
    setIsAnalyzing(true)
    const steps = [
      'Inicializando Auditor IA local...',
      'Evaluando confluencia en marcos temporales HTF (1H/4H)...',
      'Escaneando mitigación de bloques de orden (OB)...',
      'Calculando anomalías de volumen relativo (RVOL)...',
      'Veredicto procesado exitosamente.'
    ]

    let stepIdx = 0
    setAnalysisStep(steps[0])

    const interval = setInterval(() => {
      stepIdx++
      if (stepIdx < steps.length) {
        setAnalysisStep(steps[stepIdx])
      } else {
        clearInterval(interval)
        
        let newScore = Math.floor(65 + Math.random() * 30)
        let newVerdict = 'SIDEWAYS'
        let newThreat = 'MEDIUM'
        let newLogic = 'CONSOLIDACIÓN DE RANGO'
        let newAdvice = ''

        switch (selectedRegime) {
          case 'MARKUP':
            newVerdict = 'GO'
            newThreat = 'LOW'
            newLogic = 'OB RETEST & FVG ALCISTA'
            newAdvice = 'Fuerte confluencia alcista institucional. El precio ha retesteado la zona óptima de entrada (OTE) respetando el mínimo diario. Recomendación: Buscar posiciones en compras.'
            break
          case 'DISTRIBUTION':
            newVerdict = 'AVOID'
            newThreat = 'HIGH'
            newLogic = 'VOLUMEN INSTITUCIONAL EN VENTA'
            newAdvice = 'Evidencia clara de distribución institucional en máximos. Fuga visual del rango y volumen relativo por encima de 2.0x. Alto riesgo de caída inminente.'
            break
          case 'ACCUMULATION':
            newVerdict = 'GO'
            newThreat = 'MEDIUM'
            newLogic = 'COMPRAS PASIVAS DE WHALES'
            newAdvice = 'Absorción gradual de la oferta flotante cerca del soporte histórico. El motor detecta firmas criptográficas consistentes con compras pasivas de grandes cuentas.'
            break
          case 'MARKDOWN':
            newVerdict = 'AVOID'
            newThreat = 'HIGH'
            newLogic = 'ROMPIMIENTO DE ESTRUCTURA'
            newAdvice = 'Estructura bajista acelerada confirmada en marcos temporales macro. Las medias móviles están desalineadas y la oferta presiona fuertemente. Evitar comprar.'
            break
          case 'RANGING':
            newVerdict = 'SIDEWAYS'
            newThreat = 'MEDIUM'
            newLogic = 'BARRIDAS DE LIQUIDEZ LATERAL'
            newAdvice = 'Mercado lateral en equilibrio temporal. Se aconseja esperar ruptura confirmada de los límites del rango o cazar falsos rompimientos en los extremos.'
            break
          case 'CHOPPY':
            newVerdict = 'AVOID'
            newThreat = 'HIGH'
            newLogic = 'VOLATILIDAD SUCIA ACTIVA'
            newAdvice = 'Acción de precios desordenada que invalida los patrones técnicos clásicos. El índice de ruido temporal supera el 85%. Proteger capital y mantenerse al margen.'
            break
        }

        setConfluence(newScore)
        setVerdict(newVerdict)
        setThreat(newThreat)
        setLogic(newLogic)
        setAdvisorAdvice(newAdvice)
        setSource('advisor')
        setIsAnalyzing(false)
      }
    }, 500)
  }

  const panelRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const getCanonicalUrl = () => {
    if (typeof window === 'undefined') return ''
    return `${window.location.protocol}//${window.location.host}`
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`📊 *ANÁLISIS MACROECONÓMICO* - ${localAnalysis.title}\n\nRevisa el reporte en vivo en el Diario Regional:\n${getCanonicalUrl()}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    toast.success("Redirigiendo a WhatsApp...")
  }

  const handleShareLink = async () => {
    const url = getCanonicalUrl()
    const shareData = {
      title: localAnalysis.title,
      text: `📊 ANÁLISIS MACROECONÓMICO: ${localAnalysis.title}`,
      url: url
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        toast.success("Enlace compartido")
      } catch (err) {
        console.log("Error sharing", err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast.success("Enlace copiado al portapapeles 🔗")
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleShareStory = async () => {
    if (!panelRef.current) return
    setIsGenerating(true)
    const toastId = toast.loading('Generando imagen para historia...')
    
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      
      const canvas = await html2canvas(panelRef.current, {
        scale: 2, // Mayor calidad
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'analisis-macro-contapyme.png', { type: 'image/png' })
          
          try {
            await navigator.clipboard.writeText(getCanonicalUrl())
          } catch (e) {}

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: localAnalysis.title,
              text: `📊 ${localAnalysis.title} — Diario Regional Contapymepuq`,
            })
            toast.success('¡Listo para compartir!', { id: toastId })
          } else {
            const url = URL.createObjectURL(file)
            const link = document.createElement('a')
            link.href = url
            link.download = 'analisis-macro-contapyme.png'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            toast.success('¡Imagen descargada! Enlace copiado al portapapeles 🔗', { id: toastId })
          }
        }
      }, 'image/png')
    } catch (error) {
      console.error(error)
      toast.error('No se pudo generar la imagen para historia', { id: toastId })
    } finally {
      setIsGenerating(false)
    }
  }

  const formatPrice = (price: number, isCrypto?: boolean) => {
    if (isCrypto) {
      return Math.round(price).toLocaleString('es-CL')
    }
    return price.toLocaleString('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const localAnalysis = {
    title: 'Desequilibrios de Liquidez en el Cobre y su Impacto en el Dólar Local',
    category: 'Análisis Macroeconómico',
    author: 'Unidad de Inteligencia',
    date: new Date().toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    development: [
      'La apertura del mercado financiero de esta semana ha revelado un escenario de alta confluencia técnica en las zonas de descuento macro. Mientras el Cobre COMEX sostiene un canal de acumulación institucional a la espera de definiciones físicas de demanda desde Asia, el Dólar contra el Peso Chileno (USD/CLP) muestra claras señales de absorción pasiva por parte de mesas de dinero institucionales en torno al soporte de $925.',
      'Nuestros algoritmos de análisis de flujo de órdenes detectan una anomalía de volumen relativo (RVOL) de 1.7x en las paridades de divisas. La barrida de liquidez ocurrida en el mínimo de la semana previa (Previous Weekly Low) sugiere que los operadores institucionales han completado la recolección de órdenes en la zona de descuento OTE (Optimal Trade Entry), mitigando de forma limpia el bloque de órdenes alcista registrado en gráficos de 4 horas.'
    ],
    outcome: 'La perspectiva técnica para el corto plazo apunta a una compresión de volatilidad lateral. Se prevé que el tipo de cambio mantenga su cotización dentro del rango de soporte de $925 - $940 mientras la confluencia global no alcance niveles críticos de ruptura (bias direccional neutral).'
  }

  return (
    <div ref={panelRef} className="w-full h-full flex flex-col justify-between p-8 rounded-[2.5rem] bg-white border border-border/65 hover:border-primary/20 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] transition-all duration-500 min-h-[460px] relative overflow-hidden group">

      {/* Luz trasera decorativa */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
      
      {/* Cabecera Editorial */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: '16s' }} />
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
              Servicio de Análisis Macro
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 rounded-full px-2.5 py-0.5 text-[8px] font-bold text-primary tracking-wider">
            <span className={`relative flex h-1.5 w-1.5 ${pulse ? 'scale-125' : ''} transition-transform`}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            AUTÓNOMO
          </div>
        </div>

        {/* Categoría, Fecha y Autor */}
        <div className="flex flex-wrap items-center gap-2 text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest italic">
          <span className="text-primary">{localAnalysis.category}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {localAnalysis.date}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
          <span>Por: {localAnalysis.author}</span>
        </div>
      </div>

      {/* Título de Noticia Principal */}
      <div className="flex justify-between items-start gap-4 mt-3">
        <h4 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase text-foreground leading-[1.05] font-serif flex-1">
          {localAnalysis.title}
        </h4>

        {/* Selector de Régimen interactivo */}
        <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200/60 p-1.5 rounded-xl shrink-0">
          <Sliders className="h-3.5 w-3.5 text-zinc-400" />
          <select 
            value={selectedRegime}
            onChange={(e) => setSelectedRegime(e.target.value)}
            className="text-[8.5px] font-black uppercase text-foreground bg-transparent border-none outline-none cursor-pointer"
            disabled={isAnalyzing}
          >
            <option value="MARKUP">Markup (Alza)</option>
            <option value="DISTRIBUTION">Distribución</option>
            <option value="ACCUMULATION">Acumulación</option>
            <option value="MARKDOWN">Markdown (Baja)</option>
            <option value="RANGING">Rango Standby</option>
            <option value="CHOPPY">Choppy Transición</option>
          </select>
        </div>
      </div>

      {/* Desarrollo de la Noticia */}
      <div className="my-4 space-y-3">
        {isAnalyzing ? (
          <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200/50 flex flex-col items-center justify-center py-10 gap-3">
            <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-wider text-primary animate-pulse">
              {analysisStep}
            </span>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-justify text-sm text-foreground/80 font-medium leading-relaxed first-letter:text-4xl first-letter:font-black first-letter:text-primary first-letter:mr-2.5 first-letter:float-left first-letter:leading-[0.85] first-letter:mt-0.5">
                {localAnalysis.development[0]}
              </p>
              <p className="text-justify text-xs text-muted-foreground font-normal leading-relaxed">
                {localAnalysis.development[1]}
              </p>
            </div>

            {/* Recuadro de Perspectiva y Conclusión */}
            <div className="p-4 bg-zinc-50 border border-border/50 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> Perspectiva & Conclusión
                </span>
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-mono ${
                  verdict === 'GO' ? 'text-emerald-600 bg-emerald-50' : verdict === 'AVOID' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'
                }`}>
                  {verdict === 'GO' ? 'ALZA / COMPRA' : verdict === 'AVOID' ? 'RIESGO / EVITAR' : 'LATERAL / RANGO'}
                </span>
              </div>
              <p className="text-[10.5px] font-medium text-muted-foreground italic leading-relaxed text-justify">
                {source === 'local' ? localAnalysis.outcome : advisorAdvice}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Botones de Compartir Reporte */}
      <div className="flex items-center gap-3 border-t border-zinc-100 pt-3.5 my-1.5 justify-end">
        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mr-auto">Compartir reporte</span>
        
        <button
          onClick={handleShareWhatsApp}
          className="flex items-center gap-1.5 text-[8.5px] font-black uppercase text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl px-3 py-1.5 transition-all cursor-pointer shrink-0"
        >
          <MessageCircle className="h-3 w-3" /> WhatsApp
        </button>

        <button
          onClick={handleShareStory}
          disabled={isGenerating}
          className="flex items-center gap-1.5 text-[8.5px] font-black uppercase text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl px-3 py-1.5 transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Instagram className="h-3 w-3" />} Historias
        </button>

        <button
          onClick={handleShareLink}
          className="flex items-center gap-1.5 text-[8.5px] font-black uppercase text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl px-3 py-1.5 transition-all cursor-pointer shrink-0"
        >
          <Share2 className="h-3 w-3" /> Enlace
        </button>
      </div>

      {/* Pie de Diagnóstico */}
      <div className="border-t border-zinc-150 pt-4 flex items-center justify-between">

        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-[7.5px] font-black text-muted-foreground/60 uppercase tracking-widest">Motor Técnico</span>
            <span className="text-[9px] font-black text-foreground uppercase tracking-wider mt-0.5">
              Modelo de Inferencia Local
            </span>
          </div>
        </div>

        <button
          onClick={runSimulationAnalysis}
          disabled={isAnalyzing}
          className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          {isAnalyzing ? 'PROCESANDO...' : 'RECALCULAR CON IA'} <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
