'use client'

import { useState, useEffect } from 'react'
import { 
  Play, 
  Terminal, 
  CheckCircle2, 
  Lock, 
  AlertTriangle, 
  DollarSign, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SimulationStep {
  text: string
  delay: number
  status: 'loading' | 'success' | 'alert' | 'info'
}

export function AISandbox() {
  const [activeScenario, setActiveScenario] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [consoleLines, setConsoleLines] = useState<string[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1)
  const [securedHash, setSecuredHash] = useState<string>('')
  const [resultData, setResultData] = useState<any>(null)

  const scenarios = [
    {
      title: "Ley Navarino & Exención IVA",
      description: "Simula el cálculo tributario de una factura exenta emitida por una empresa acogida a la Ley Navarino en Tierra del Fuego.",
      prompt: "Simular facturación de $12.500.000 a cliente de Punta Arenas con bonificación del 20% (Ley 18.392)",
      steps: [
        { text: "🛰️ Conectando con Servicios SII de Magallanes...", delay: 800, status: 'loading' },
        { text: "🔍 Validando RUT emisor bajo Registro Ley Navarino (18.392)... OK", delay: 900, status: 'success' },
        { text: "📊 Aplicando exención total de IVA (19%) sobre $12.500.000...", delay: 1000, status: 'info' },
        { text: "💰 Calculando Bonificación del Estado (D.F.L. 15): $2.500.000 (20% neto)...", delay: 1100, status: 'success' },
        { text: "🧬 Generando Asiento Contable automático en Libro Diario...", delay: 1000, status: 'loading' },
        { text: "🔒 Sellando bloque en Ledger Inmutable mediante encadenamiento SHA-256...", delay: 1200, status: 'loading' },
      ],
      result: {
        title: "DTE Exento Generado",
        summary: "Facturación Ley Navarino procesada con éxito sin fricción fiscal.",
        ledger: [
          { acc: "1.1.01.01 - Caja/Banco", debe: "$15.000.000", haber: "$0" },
          { acc: "4.1.01.02 - Ventas Exentas Navarino", debe: "$0", haber: "$12.500.000" },
          { acc: "4.2.01.05 - Bonificación Ley 18.392", debe: "$0", haber: "$2.500.000" }
        ],
        hash: "a4f89d873e211bb746a9e14a1a361bc917aef92a8369de14bca837e21a4f00b1"
      }
    },
    {
      title: "Auditoría de Inconsistencia F29",
      description: "Analiza incongruencias en tiempo real entre tus Libros Contables Físicos y el Registro de Compras y Ventas (RCV) del SII.",
      prompt: "Ejecutar cruce preventivo mensual RCV vs Libro de Ventas - Período Tributario Actual",
      steps: [
        { text: "📂 Cargando registros de Compras y Ventas del SII (API Integración)...", delay: 900, status: 'loading' },
        { text: "📂 Extrayendo Libro de Ventas en tiempo real desde Supabase...", delay: 800, status: 'loading' },
        { text: "⚖️ Comparando folios emitidos y montos netos...", delay: 1100, status: 'info' },
        { text: "⚠️ Inconsistencia detectada en Folio N° 10842 (Factura de Venta)...", delay: 1000, status: 'alert' },
        { text: "❗ Detalle: IVA Débito declarado en SII ($380.000) difiere de Contabilidad ($320.000)...", delay: 1200, status: 'alert' },
        { text: "🛠️ Sugiriendo Asiento de Ajuste correctivo en Libro Diario...", delay: 1000, status: 'success' },
      ],
      result: {
        title: "Reporte de Inconsistencia F29",
        summary: "Diferencia de $60.000 en IVA Débito detectada a tiempo. Multa potencial evitada: 10% UTM.",
        ledger: [
          { acc: "Asiento de Ajuste Sugerido:", debe: "", haber: "" },
          { acc: "4.1.01.01 - Ingresos por Ventas", debe: "$60.000", haber: "$0" },
          { acc: "2.1.03.01 - IVA Débito Fiscal", debe: "$0", haber: "$60.000" }
        ],
        hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      }
    },
    {
      title: "Remuneración Zona Extrema",
      description: "Calcula liquidaciones de sueldo aplicando los topes e incrementos por asignación de zona correspondientes a Magallanes.",
      prompt: "Liquidar Sueldo de Operario Industrial en Punta Arenas con 25% Asignación de Zona Extrema",
      steps: [
        { text: "📋 Cargando datos de contrato y previsión (AFP Cuprum + Fonasa)...", delay: 700, status: 'loading' },
        { text: "🏞️ Calculando Asignación de Zona Extrema (25% Sueldo Base): $200.000...", delay: 950, status: 'success' },
        { text: "⚖️ Verificando topes imponibles del mes actual...", delay: 800, status: 'info' },
        { text: "📉 Calculando leyes sociales y cotizaciones obligatorias...", delay: 1000, status: 'info' },
        { text: "📁 Generando archivo plano LRE (Dirección del Trabajo)...", delay: 1100, status: 'success' },
        { text: "🔒 Firmando digitalmente liquidación con hash de inmutabilidad...", delay: 900, status: 'loading' },
      ],
      result: {
        title: "Liquidación & LRE Lista",
        summary: "Liquidación calculada con bono de zona extrema. Archivo LRE sincronizado contablemente.",
        ledger: [
          { acc: "5.1.01.01 - Sueldos y Salarios (Base)", debe: "$800.000", haber: "$0" },
          { acc: "5.1.01.04 - Asignación Zona Extrema", debe: "$200.000", haber: "$0" },
          { acc: "2.1.04.02 - Previsión Social por Pagar", debe: "$0", haber: "$184.200" },
          { acc: "2.1.04.01 - Sueldos por Pagar", debe: "$0", haber: "$815.800" }
        ],
        hash: "9b1deb4d3b7d4c1d6837b8d8f28b48f30a273295821c97a8e25b1b42cd8e29a3"
      }
    }
  ]

  const runSimulation = () => {
    if (isPlaying) return
    setIsPlaying(true)
    setConsoleLines([])
    setResultData(null)
    setSecuredHash('')
    setCurrentStepIndex(0)
  }

  useEffect(() => {
    if (!isPlaying || currentStepIndex < 0) return

    const scenario = scenarios[activeScenario]
    if (currentStepIndex < scenario.steps.length) {
      const step = scenario.steps[currentStepIndex]
      const timer = setTimeout(() => {
        setConsoleLines(prev => [...prev, step.text])
        setCurrentStepIndex(prev => prev + 1)
      }, step.delay)
      return () => clearTimeout(timer)
    } else {
      // Mostrar resultado final
      const timer = setTimeout(() => {
        setResultData(scenario.result)
        setSecuredHash(scenario.result.hash)
        setIsPlaying(false)
        setCurrentStepIndex(-1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, currentStepIndex, activeScenario])

  // Resetear simulador al cambiar de escenario
  useEffect(() => {
    setConsoleLines([])
    setResultData(null)
    setSecuredHash('')
    setIsPlaying(false)
    setCurrentStepIndex(-1)
  }, [activeScenario])

  return (
    <div className="w-full rounded-[3.5rem] bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 p-8 md:p-12 border border-neutral-800/80 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
      {/* Auroras Australes de Neón */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/20 to-teal-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/10 to-indigo-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse duration-[12000ms]" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Panel Izquierdo: Selección de Escenarios */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-violet-300">Prueba en Vivo con IA</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-white leading-none">
              El Contador <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 font-extrabold drop-shadow-[0_2px_10px_rgba(34,211,238,0.2)]">del Estrecho</span>
            </h2>
            <p className="text-neutral-400 font-bold italic text-xs leading-relaxed max-w-sm">
              Prueba nuestro motor de inteligencia contable regional antes de registrarte. Elige un escenario y observa el cálculo patagónico automatizado.
            </p>
          </div>

          <div className="space-y-4">
            {scenarios.map((sc, idx) => (
              <button
                key={idx}
                disabled={isPlaying}
                onClick={() => setActiveScenario(idx)}
                className={`w-full text-left p-5 rounded-3xl border transition-all duration-500 flex items-start gap-4 ${
                  activeScenario === idx 
                    ? 'bg-neutral-800/60 border-cyan-500/50 shadow-[0_10px_30px_rgba(34,211,238,0.1)] scale-[1.02]' 
                    : 'bg-neutral-900/30 border-neutral-800 hover:bg-neutral-900/60 hover:border-neutral-700/60 hover:scale-[1.01]'
                }`}
              >
                <div className={`p-3 rounded-2xl transition-all duration-300 ${
                  activeScenario === idx 
                    ? 'bg-gradient-to-br from-cyan-400 to-teal-400 text-neutral-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                    : 'bg-neutral-800/80 text-neutral-400'
                }`}>
                  {idx === 0 && <ShieldCheck className="h-5 w-5" />}
                  {idx === 1 && <AlertTriangle className="h-5 w-5" />}
                  {idx === 2 && <DollarSign className="h-5 w-5" />}
                </div>
                <div className="space-y-1">
                  <h4 className={`font-black uppercase tracking-wider text-xs ${activeScenario === idx ? 'text-white font-black' : 'text-neutral-300 font-bold'}`}>
                    {sc.title}
                  </h4>
                  <p className="text-[10px] font-bold text-neutral-500 leading-normal italic">
                    {sc.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <Button 
            disabled={isPlaying}
            onClick={runSimulation}
            className="w-full py-7 rounded-[1.8rem] font-black uppercase tracking-[0.25em] text-xs gap-3 shadow-[0_15px_30px_-5px_rgba(34,211,238,0.25)] bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 text-neutral-950 hover:brightness-110 hover:shadow-[0_20px_40px_rgba(34,211,238,0.35)] transition-all duration-500 border-0"
          >
            {isPlaying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" /> Procesando Auditoría IA
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current text-neutral-950" /> Ejecutar Simulación Contable
              </>
            )}
          </Button>
        </div>

        {/* Panel Derecho: Consola Interactiva */}
        <div className="lg:col-span-7">
          <div className="w-full bg-neutral-950/80 backdrop-blur-xl rounded-[2.5rem] border border-neutral-800 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col min-h-[480px]">
            {/* Cabecera de la Consola */}
            <div className="px-6 py-5 bg-neutral-950 border-b border-neutral-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="h-4 w-4 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">Patagonia AI Engine v8.6</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500/25 border border-rose-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)]" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500/25 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/25 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
              </div>
            </div>

            {/* Cuerpo de la Consola / Líneas de Código */}
            <div className="flex-1 p-8 font-mono text-[11px] leading-relaxed text-neutral-300 space-y-4 overflow-y-auto max-h-[400px]">
              <div className="text-neutral-600 italic">
                // Consola lista. Selecciona un escenario a la izquierda y presiona Ejecutar.
              </div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <span>$</span>
                <span>{scenarios[activeScenario].prompt}</span>
              </div>

              {consoleLines.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`animate-in fade-in slide-in-from-left-2 duration-300 flex items-start gap-3 ${
                    line.includes('⚠️') || line.includes('❗') ? 'text-amber-400 font-black' : 
                    line.includes('OK') || line.includes('bonificación') || line.includes('exención') ? 'text-emerald-400 font-semibold' : 'text-neutral-300'
                  }`}
                >
                  <span className="text-neutral-700 select-none">{`0${idx + 1}`}</span>
                  <span>{line}</span>
                </div>
              ))}

              {isPlaying && (
                <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                  <span>&gt;</span>
                  <span className="h-3.5 w-2 bg-cyan-400 animate-blink shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                </div>
              )}

              {/* Resultado Exitoso */}
              {resultData && (
                <div className="mt-8 pt-8 border-t border-neutral-900 space-y-5 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5 shadow-[0_0_10px_rgba(16,185,129,0.4)] rounded-full" />
                    <span className="font-black uppercase tracking-widest text-xs bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">{resultData.title}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 italic font-bold leading-normal">
                    {resultData.summary}
                  </p>

                  {/* Detalle Asiento Contable (Partida Doble) */}
                  <div className="bg-black/40 p-5 rounded-2xl border border-neutral-900 space-y-3 shadow-inner">
                    <div className="grid grid-cols-12 gap-2 text-[9px] font-black uppercase text-neutral-500 border-b border-neutral-900 pb-2.5">
                      <div className="col-span-6">Cuenta Contable</div>
                      <div className="col-span-3 text-right">Debe</div>
                      <div className="col-span-3 text-right">Haber</div>
                    </div>
                    {resultData.ledger.map((ld: any, i: number) => (
                      <div key={i} className="grid grid-cols-12 gap-2 text-[10px] tabular-nums font-bold">
                        <div className="col-span-6 text-neutral-300 truncate">{ld.acc}</div>
                        <div className="col-span-3 text-right text-cyan-400">{ld.debe}</div>
                        <div className="col-span-3 text-right text-violet-400">{ld.haber}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sello de Inmutabilidad SHA-256 */}
                  {securedHash && (
                    <div className="flex flex-col md:flex-row md:items-center gap-4 bg-gradient-to-r from-cyan-500/5 to-violet-500/5 p-5 rounded-2xl border border-cyan-500/10">
                      <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-2xl w-fit shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                        <Lock className="h-4.5 w-4.5 text-cyan-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-300">Sello SHA-256 de Inmutabilidad</div>
                        <div className="text-[9px] font-mono text-neutral-500 break-all select-all font-semibold">{securedHash}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  )
}
