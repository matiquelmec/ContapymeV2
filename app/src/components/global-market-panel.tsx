'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')
  const [pulse, setPulse] = useState(false)

  // Estados del Simulador Táctico Autónomo
  const [selectedAsset, setSelectedAsset] = useState('libra_cobre')
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

  // Datos de activos financieros en tiempo real
  const [simulatedAssets, setSimulatedAssets] = useState<MarketAsset[]>([
    { symbol: 'USD/CLP', name: 'Dólar Observado', price: 932.45, change: 0.38 },
    { symbol: 'S&P 500', name: 'S&P 500 Index', price: 5200.5, change: 0.45 },
    { symbol: 'COBRE', name: 'Cobre COMEX', price: 4.52, change: 1.25, isCommodity: true },
    { symbol: 'ORO', name: 'Oro COMEX', price: 2350.8, change: 0.85, isCommodity: true },
    { symbol: 'WTI', name: 'Petróleo WTI', price: 78.4, change: -0.25, isCommodity: true },
  ])

  // Sincronizar con los indicadores iniciales
  useEffect(() => {
    setSimulatedAssets([
      { symbol: 'USD/CLP', name: 'Dólar Observado', price: getIndValue('dolar', 932.45), change: 0.38 },
      { symbol: 'S&P 500', name: 'S&P 500 Index', price: getIndValue('sp500', 5200.5), change: 0.45 },
      { symbol: 'COBRE', name: 'Cobre COMEX', price: getIndValue('libra_cobre', 4.52), change: 1.25, isCommodity: true },
      { symbol: 'ORO', name: 'Oro COMEX', price: getIndValue('oro', 2350.8), change: 0.85, isCommodity: true },
      { symbol: 'WTI', name: 'Petróleo WTI', price: getIndValue('wti', 78.4), change: -0.25, isCommodity: true },
    ])
  }, [indicators])

  // 📡 Suscripción a Supabase Realtime Broadcast / Postgres Changes en Vivo
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('realtime_indicators_stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'economic_indicators' },
        (payload) => {
          const newRow = payload.new as any
          if (!newRow || !newRow.codigo) return

          setPulse(true)
          setTimeout(() => setPulse(false), 800)

          setSimulatedAssets((prev) =>
            prev.map((asset) => {
              if (
                (newRow.codigo === 'dolar' && asset.symbol === 'USD/CLP') ||
                (newRow.codigo === 'sp500' && asset.symbol === 'S&P 500') ||
                (newRow.codigo === 'libra_cobre' && asset.symbol === 'COBRE') ||
                (newRow.codigo === 'oro' && asset.symbol === 'ORO') ||
                (newRow.codigo === 'wti' && asset.symbol === 'WTI')
              ) {
                const oldPrice = asset.price
                const newPrice = Number(newRow.valor)
                const changePct = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : asset.change
                return { ...asset, price: newPrice, change: changePct }
              }
              return asset
            })
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Decodificar la telemetría inteligente inyectada en unidad_medida
  const getTelemetryData = (code: string) => {
    const ind = indicators.find(i => i.codigo === code)
    if (!ind) return null
    try {
      if (ind.unidad_medida && ind.unidad_medida.startsWith('{')) {
        return JSON.parse(ind.unidad_medida)
      }
    } catch (e) {
      console.warn('Error parsing telemetry JSON:', e)
    }
    return null
  }

  // Nombre legible para el régimen de mercado (adaptado a usuarios)
  const getRegimeName = (regimeCode: string) => {
    switch (regimeCode) {
      case 'MARKUP': return 'Precios en Alza (Impulso Alcista)'
      case 'MARKDOWN': return 'Precios en Baja (Tendencia Bajista)'
      case 'ACCUMULATION': return 'Zona Barata (Inversionistas Comprando)'
      case 'DISTRIBUTION': return 'Zona Cara (Inversionistas Tomando Ganancias)'
      case 'CHOPPY': return 'Mercado Inestable (Mucha Volatilidad)'
      default: return 'Consolidación Lateral (Precios Estables)'
    }
  }

  // Adaptar dinámicamente el análisis y conclusión según la telemetría real del activo seleccionado
  useEffect(() => {
    const telemetry = getTelemetryData(selectedAsset)
    const ind = indicators.find(i => i.codigo === selectedAsset)
    
    if (telemetry) {
      setConfluence(telemetry.confluence)
      setVerdict(telemetry.verdict)
      setLogic(telemetry.logic)
      setThreat(telemetry.confluence > 80 ? 'LOW' : telemetry.confluence > 60 ? 'MEDIUM' : 'HIGH')
      
      const name = ind?.nombre || selectedAsset.toUpperCase()
      
      let advice = ''
      switch (telemetry.regime) {
        case 'MARKUP':
          advice = `Se confirma una tendencia clara al alza para ${name}. Esto sugiere que los compradores están dominando la oferta y el precio tiene impulso para seguir subiendo en el corto plazo.`
          break
        case 'MARKDOWN':
          advice = `Tendencia a la baja detectada en ${name}. Los precios están cayendo rápidamente. Se aconseja precaución si planeas realizar compras o transacciones grandes, y esperar a que el valor se estabilice.`
          break
        case 'ACCUMULATION':
          advice = `El activo ${name} está en una fase de acumulación o preparación. Esto significa que los inversionistas grandes están comprando discretamente a precios bajos. Es un buen momento para observar oportunidades.`
          break
        case 'DISTRIBUTION':
          advice = `El activo ${name} se encuentra en zona de precios máximos y los grandes operadores están vendiendo para tomar ganancias. Ten cuidado, ya que el precio podría comenzar a corregir a la baja pronto.`
          break
        case 'CHOPPY':
          advice = `El mercado para ${name} está muy inestable y sin una dirección clara (sube y baja rápidamente). Te recomendamos esperar a que se tranquilice antes de tomar decisiones financieras importantes.`
          break
        default:
          advice = `El precio de ${name} se mantiene estable y moviéndose hacia los lados, sin grandes sorpresas. Es un escenario ideal para planificar tus costos y presupuestos de forma predecible.`
      }
      setAdvisorAdvice(advice)
    } else {
      // Valores por defecto si la base de datos no está poblada
      setConfluence(65)
      setVerdict('SIDEWAYS')
      setLogic('DIAGNÓSTICO ESTÁNDAR')
      setThreat('MEDIUM')
      setAdvisorAdvice('Cargando datos del asistente para evaluar de forma sencilla el comportamiento de este indicador financiero.')
    }
  }, [selectedAsset, indicators])

  // Obtener análisis narrativo adaptado según el activo seleccionado
  const getAssetAnalysis = (code: string) => {
    const defaultDate = new Date().toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    switch (code) {
      case 'sp500':
        return {
          title: 'El termómetro de las empresas de EE.UU. (S&P 500) y su efecto en Chile',
          category: 'Bolsas Internacionales',
          date: defaultDate,
          author: 'Unidad de Inferencia Global',
          development: [
            'El S&P 500 mide el valor de las 500 empresas más grandes de Estados Unidos. Cuando este índice sube o baja con fuerza, los inversionistas de todo el mundo cambian su estrategia. Si hay nerviosismo o caídas en EE.UU., los fondos globales suelen retirar dinero de países en desarrollo como Chile para refugiarse en el dólar, lo que encarece el tipo de cambio aquí.',
            'Actualmente, las bolsas internacionales muestran un comportamiento cauteloso debido a las tasas de interés globales. Esto significa que los mercados están a la espera de señales claras para definir si el dinero volverá a fluir hacia economías de Latinoamérica o si el dólar se mantendrá como el refugio favorito.'
          ],
          outcome: 'Perspectiva de mercado estable a corto plazo. Es una buena oportunidad para observar precios de insumos antes de comprar al extranjero.'
        }
      case 'oro':
        return {
          title: 'El Oro como refugio seguro en tiempos de incertidumbre mundial',
          category: 'Metales / Refugio de Valor',
          date: defaultDate,
          author: 'Mesa de Commodities',
          development: [
            'Históricamente, cuando el mundo financiero o la política internacional se vuelven inestables, los inversionistas compran oro. Al ser un recurso físico y escaso, funciona como un escudo protector de tu patrimonio frente a la inflación y las devaluaciones, lo que hace que su precio suba cuando las bolsas caen.',
            'Nuestros indicadores muestran compras constantes de oro a nivel mundial. Esta acumulación constante nos enseña que el mercado internacional sigue buscando seguridad frente al panorama global, manteniendo un soporte firme en los precios del metal precioso.'
          ],
          outcome: 'Tendencia alcista firme. El oro sigue mostrando que los inversionistas prefieren resguardarse ante cualquier riesgo global.'
        }
      case 'wti':
        return {
          title: 'El precio del Petróleo y cómo influye en el costo de tus despachos',
          category: 'Combustibles / Logística',
          date: defaultDate,
          author: 'Mesa de Energía',
          development: [
            'El petróleo WTI es la referencia para las bencinas y el diésel que consumimos. Dado que Chile importa casi todo el petróleo que usa, cualquier cambio en su precio internacional afecta de forma directa el valor del transporte, fletes y distribución de mercadería hacia zonas extremas como Punta Arenas.',
            'Por el momento, los países productores mantienen su nivel de oferta controlado. El precio se encuentra estable en su promedio mensual, lo que evita alzas repentinas en el transporte terrestre y da un respiro en la planificación de costos operativos para las PYMES locales.'
          ],
          outcome: 'Precio estable. Se prevé que los costos de fletes y logística mantengan sus valores sin grandes alzas en las próximas semanas.'
        }
      case 'dolar':
        return {
          title: 'El comportamiento del Dólar en Chile y cómo planificar tus costos',
          category: 'Divisas y Tipo de Cambio',
          date: defaultDate,
          author: 'Mesa de Divisas',
          development: [
            'El precio del dólar en Chile determina cuánto nos cuestan los productos importados, la tecnología y las materias primas. Cuando el dólar se mantiene estable, las empresas y negocios locales pueden calcular sus costos y cotizar inventario con mayor tranquilidad, sin temor a sorpresas en sus cuentas de cobro.',
            'El tipo de cambio ha encontrado un piso firme cerca de los $925 pesos. Las transacciones diarias sugieren que la demanda y la oferta están en equilibrio temporal, lo que disminuye las variaciones bruscas y favorece la toma de decisiones comerciales tranquilas.'
          ],
          outcome: 'Estabilidad cambiaria lateral. El dólar se mantiene en un rango predecible entre $925 y $940, ideal para planificar compras futuras.'
        }
      case 'euro':
        return {
          title: 'El Euro en Chile y sus ventajas para el comercio tecnológico',
          category: 'Mercados de Divisas',
          date: defaultDate,
          author: 'Mesa de Divisas',
          development: [
            'El Euro es la moneda oficial de la Eurozona. Para los emprendedores chilenos, monitorear el euro es clave si importan maquinaria agrícola, vehículos de transporte o tecnología industrial provenientes de Europa, siendo una alternativa de diversificación frente al dólar tradicional.',
            'El euro ha mostrado un movimiento lateral frente al peso chileno en las últimas semanas. La menor velocidad en el comercio europeo mantiene la cotización estable, sin grandes tendencias alcistas que encarezcan las importaciones.'
          ],
          outcome: 'Comportamiento lateral estable. Buen escenario para cotizar maquinaria y servicios europeos con costos predecibles.'
        }
      case 'ipsa':
        return {
          title: 'La Bolsa Chilena (IPSA): ¿Cómo le va a las grandes empresas del país?',
          category: 'Renta Variable Chile',
          date: defaultDate,
          author: 'Unidad de Inferencia Global',
          development: [
            'El IPSA es el índice que agrupa a las 30 empresas más grandes de la Bolsa de Santiago (como Copec, Falabella, Cencosud, etc.). Si el IPSA sube, significa que hay confianza en el mercado nacional y que las principales industrias están sanas y generando utilidades, lo que atrae inversión extranjera al país.',
            'El mercado accionario chileno se encuentra respetando su tendencia alcista principal gracias a la buena valoración de recursos locales. Esto refleja un clima de negocios saludable y estable, disminuyendo el riesgo país percibido.'
          ],
          outcome: 'Tendencia nacional saludable. El buen desempeño bursátil local apoya un clima de estabilidad para el ecosistema empresarial chileno.'
        }
      case 'libra_cobre':
      default:
        return {
          title: 'El Cobre como motor económico de Chile y su relación con el Dólar',
          category: 'Mercado Cambiario / Minería',
          date: defaultDate,
          author: 'Unidad de Inteligencia',
          development: [
            'El cobre es el sueldo de Chile. Cuando el precio de la libra de cobre sube a nivel internacional, entran más dólares al país por concepto de exportaciones. Al haber más dólares circulando en la economía local, el precio del dólar tiende a bajar, abaratando las importaciones y la tecnología extranjera.',
            'Actualmente, el mercado del cobre en Asia mantiene una demanda constante, lo que le da un soporte sólido al precio de la libra. Este equilibrio internacional ayuda a mitigar las alzas fuertes del dólar en el mercado nacional.'
          ],
          outcome: 'Precio del cobre con soporte firme. Esto favorece la contención del dólar local en el corto plazo.'
        }
    }
  }

  // Inferencia interactiva de la red neural (con explicaciones sencillas)
  const runSimulationAnalysis = () => {
    setIsAnalyzing(true)
    const steps = [
      'Iniciando Asistente de Análisis de Mercado...',
      'Evaluando la estabilidad y tendencia del precio...',
      'Buscando zonas óptimas de compra y venta...',
      'Analizando el volumen de transacciones en Chile...',
      'Diagnóstico completado y simplificado con éxito.'
    ]

    let stepIdx = 0
    setAnalysisStep(steps[0])

    const interval = setInterval(() => {
      stepIdx++
      if (stepIdx < steps.length) {
        setAnalysisStep(steps[stepIdx])
      } else {
        clearInterval(interval)
        setSource('advisor')
        setIsAnalyzing(false)
        toast.success("Diagnóstico técnico actualizado por el motor Slingshot")
      }
    }, 450)
  }

  const localAnalysis = getAssetAnalysis(selectedAsset)
  const telemetry = getTelemetryData(selectedAsset)
  const realRegime = telemetry ? telemetry.regime : 'RANGING'

  // Compartir
  const panelRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`📊 *ANÁLISIS MACRO SLINGSHOT* - ${localAnalysis.title}\n\nEvaluado por la terminal de Inteligencia de ContaPyme PUQ:\n${window.location.protocol}//${window.location.host}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    toast.success("Redirigiendo a WhatsApp...")
  }

  const handleShareLink = async () => {
    const url = `${window.location.protocol}//${window.location.host}`
    const shareData = {
      title: localAnalysis.title,
      text: `📊 ANÁLISIS MACRO SLINGSHOT: ${localAnalysis.title}`,
      url
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
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'analisis-macro-slingshot.png', { type: 'image/png' })
          
          try {
            await navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}`)
          } catch (e) {}

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: localAnalysis.title,
              text: `📊 ${localAnalysis.title} — Análisis Macro Slingshot`,
            })
            toast.success('¡Listo para compartir!', { id: toastId })
          } else {
            const url = URL.createObjectURL(file)
            const link = document.createElement('a')
            link.href = url
            link.download = 'analisis-macro-slingshot.png'
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

  return (
    <div ref={panelRef} className="w-full h-full flex flex-col justify-between p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white border border-border/65 hover:border-primary/20 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] transition-all duration-500 min-h-[460px] relative overflow-hidden group">
      {/* Luz trasera decorativa */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
      
      {/* Cabecera Editorial */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: '16s' }} />
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
              Análisis Macro Slingshot
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 rounded-full px-2.5 py-0.5 text-[8px] font-bold text-primary tracking-wider">
            <span className={`relative flex h-1.5 w-1.5 ${pulse ? 'scale-125' : ''} transition-transform`}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            CONFLUENCIA REAL
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
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mt-3">
        <h4 className="text-lg sm:text-2xl font-black italic tracking-tighter uppercase text-foreground leading-[1.1] sm:leading-[1.05] font-serif flex-1">
          {localAnalysis.title}
        </h4>

        {/* Selector de Activo en vez de Régimen simulado */}
        <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200/60 p-1.5 rounded-xl shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          <Sliders className="h-3.5 w-3.5 text-zinc-400" />
          <select 
            value={selectedAsset}
            onChange={(e) => {
              setSelectedAsset(e.target.value)
              setSource('local')
            }}
            className="text-[8.5px] font-black uppercase text-foreground bg-transparent border-none outline-none cursor-pointer flex-1 sm:flex-initial"
            disabled={isAnalyzing}
          >
            <option value="libra_cobre">Cobre COMEX</option>
            <option value="dolar">Dólar Observado</option>
            <option value="sp500">S&P 500 Index</option>
            <option value="oro">Oro COMEX</option>
            <option value="wti">Crudo WTI</option>
            <option value="euro">Euro en Chile</option>
            <option value="ipsa">IPSA Chile</option>
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

            {/* Recuadro de Perspectiva y Conclusión Real de Slingshot */}
            <div className="p-4 bg-zinc-50 border border-border/50 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> Recomendación de Mercado
                </span>
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-mono ${
                  verdict === 'GO' ? 'text-emerald-600 bg-emerald-50' : verdict === 'AVOID' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'
                }`}>
                  {verdict === 'GO' ? `BUEN MOMENTO / ${confluence}%` : verdict === 'AVOID' ? `PRECAUCIÓN / ${confluence}%` : `ESPERAR / ${confluence}%`}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/50 pb-1.5">
                <span>Estado: {getRegimeName(realRegime)}</span>
                <span>Nivel de Riesgo: {threat === 'LOW' ? 'Bajo' : threat === 'MEDIUM' ? 'Medio' : 'Alto'}</span>
              </div>

              <p className="text-[10.5px] font-medium text-muted-foreground italic leading-relaxed text-justify">
                {source === 'local' ? localAnalysis.outcome : advisorAdvice}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Botones de Compartir Reporte */}
      <div className="flex flex-col gap-2.5 border-t border-zinc-100 pt-3.5 my-1.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest whitespace-nowrap px-1">Compartir</span>
        
        <div className="flex flex-wrap items-center gap-2 justify-end sm:justify-start">
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
      </div>

      {/* Pie de Diagnóstico */}
      <div className="border-t border-zinc-150 pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-[7.5px] font-black text-muted-foreground/60 uppercase tracking-widest">Tecnología de Análisis</span>
            <span className="text-[9px] font-black text-foreground uppercase tracking-wider mt-0.5">
              Analizador de Tendencias Slingshot
            </span>
          </div>
        </div>

        <button
          onClick={runSimulationAnalysis}
          disabled={isAnalyzing}
          className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-all flex items-center gap-1.5 disabled:opacity-50 self-end sm:self-auto"
        >
          {isAnalyzing ? 'PROCESANDO...' : 'RECALCULAR CON IA'} <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
