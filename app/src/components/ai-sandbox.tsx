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
      title: "Facturación Inmutable & DTE",
      description: "Emisión de facturas electrónicas chilenas firmadas digitalmente y encadenadas criptográficamente al Blockchain Ledger.",
      prompt: "Emitir Factura Electrónica DTE con Encadenamiento Criptográfico de Inmutabilidad",
      steps: [
        { text: "🧾 Generando XML de Factura Electrónica (DTE Tipo 33)...", delay: 800, status: 'loading' },
        { text: "🖋️ Aplicando Firma Digital SII (C14N canonicalization & PKCS#1 v1.5)... OK", delay: 900, status: 'success' },
        { text: "🔗 Recuperando Hash del DTE anterior desde base de datos... OK", delay: 800, status: 'info' },
        { text: "🔒 Computando encadenamiento SHA-256: Hash(n) = SHA256(Record(n) + Hash(n-1))...", delay: 1100, status: 'loading' },
        { text: "📡 Persistiendo sello inmutable en dte_issued.integrity_hash...", delay: 1000, status: 'success' },
        { text: "💾 Sincronizando asiento contable de ventas en el Libro Diario...", delay: 900, status: 'success' },
      ],
      result: {
        title: "DTE Emitido & Ledger Encadenado",
        summary: "Factura emitida y firmada con éxito. Bloque criptográfico encadenado para prevenir alteración de registros.",
        ledger: [
          { acc: "1.1.02.01 - Clientes por Cobrar", debe: "$11.900.000", haber: "$0" },
          { acc: "4.1.01.01 - Ingresos por Ventas Navarino", debe: "$0", haber: "$10.000.000" },
          { acc: "2.1.03.01 - IVA Débito Fiscal (Exento 18.392)", debe: "$0", haber: "$1.900.000" }
        ],
        hash: "a4f89d873e211bb746a9e14a1a361bc917aef92a8369de14bca837e21a4f00b1"
      }
    },
    {
      title: "Conciliación Bancaria V2 (Sovereign AI)",
      description: "Cruce automático de cartolas y clasificación de glosas bancarias usando Naive Bayes local en CPU a coste $0.",
      prompt: "Ejecutar cruce inteligente de cartola usando Sovereign AI (Clasificador Local)",
      steps: [
        { text: "📂 Cargando movimientos de cartola bancaria de la organización...", delay: 800, status: 'loading' },
        { text: "🧠 Cargando The Sovereign AI Memory (clf_f8758d56.pkl)... OK", delay: 900, status: 'success' },
        { text: "🔍 Analizando glosa bancaria: 'PAGO MENSUAL TRANSBANK CORP'...", delay: 1000, status: 'info' },
        { text: "🔮 Inferencia activa en CPU: confianza del 94.2% (>70% umbral de seguridad)...", delay: 1100, status: 'success' },
        { text: "🛠️ Sugiriendo imputación automática a cuenta predefinida...", delay: 900, status: 'success' },
        { text: "⚖️ Generando asiento de ajuste y conciliación atómica del estado...", delay: 1000, status: 'success' },
      ],
      result: {
        title: "Conciliación & Ajuste con IA",
        summary: "Glosa clasificada automáticamente por Naive Bayes local con alta certidumbre y conciliada en el Libro Diario.",
        ledger: [
          { acc: "5.1.05.001 - Gastos y Comisiones Bancarias", debe: "$45.000", haber: "$0" },
          { acc: "1.1.01.01 - Banco Santander (Corriente)", debe: "$0", haber: "$45.000" }
        ],
        hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      }
    },
    {
      title: "Remuneración Zona Extrema & LRE",
      description: "Cálculo de liquidaciones aplicando topes previsionales de Chile (2026), 42 horas y asignaciones regionales de Magallanes.",
      prompt: "Procesar liquidación de sueldo con asignación de zona extrema y exportar a LRE",
      steps: [
        { text: "📋 Cargando datos de contrato del empleado (AFP Cuprum + Salud Fonasa)...", delay: 700, status: 'loading' },
        { text: "🏞️ Aplicando 25% Asignación de Zona Extrema (D.L. 889 / Ley Regional): $200.000...", delay: 950, status: 'success' },
        { text: "⚖️ Verificando topes previsionales chilenos (Límites 2026: 84.3 UF)... OK", delay: 800, status: 'info' },
        { text: "📉 Calculando leyes sociales y retenciones de impuesto de segunda categoría...", delay: 1000, status: 'info' },
        { text: "📁 Exportando estructura de campos compatible con LRE (Dirección del Trabajo)...", delay: 1100, status: 'success' },
        { text: "🔒 Firmando digitalmente liquidación con hash de inmutabilidad...", delay: 900, status: 'loading' },
      ],
      result: {
        title: "Nómina Procesada & LRE Listo",
        summary: "Liquidación calculada con bono de zona extrema. Archivo plano LRE exportado para fiscalización.",
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
      const timer = setTimeout(() => {
        setResultData(scenario.result)
        setSecuredHash(scenario.result.hash)
        setIsPlaying(false)
        setCurrentStepIndex(-1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, currentStepIndex, activeScenario])

  useEffect(() => {
    setConsoleLines([])
    setResultData(null)
    setSecuredHash('')
    setIsPlaying(false)
    setCurrentStepIndex(-1)
  }, [activeScenario])

  return (
    <div className="w-full rounded-[3.5rem] bg-white/70 backdrop-blur-xl p-8 md:p-12 border border-neutral-200/60 shadow-[0_30px_80px_rgba(30,58,138,0.04)] relative overflow-hidden">
      {/* Auroras Patagónicas en Tonos Suaves de la Marca */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 to-sky-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-sky-600/5 to-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Panel Izquierdo */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/5 to-sky-500/5 border border-primary/20 shadow-[0_5px_15px_rgba(30,58,138,0.03)]">
              <Sparkles className="h-4 w-4 text-sky-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-primary to-sky-600">Prueba en Vivo con IA</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-neutral-900 leading-none">
              El Contador <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-sky-600 to-blue-500 font-extrabold drop-shadow-[0_2px_10px_rgba(30,58,138,0.1)]">del Estrecho</span>
            </h2>
            <p className="text-neutral-500 font-bold italic text-xs leading-relaxed max-w-sm">
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
                    ? 'bg-neutral-50 border-primary/40 shadow-[0_10px_30px_rgba(30,58,138,0.06)] scale-[1.02]' 
                    : 'bg-white/55 border-neutral-200/80 hover:bg-neutral-50 hover:border-neutral-300 hover:scale-[1.01]'
                }`}
              >
                <div className={`p-3 rounded-2xl transition-all duration-300 ${
                  activeScenario === idx 
                    ? 'bg-gradient-to-br from-primary to-sky-500 text-white shadow-[0_5px_15px_rgba(30,58,138,0.25)]' 
                    : 'bg-neutral-100 text-neutral-450'
                }`}>
                  {idx === 0 && <ShieldCheck className="h-5 w-5" />}
                  {idx === 1 && <Sparkles className="h-5 w-5" />}
                  {idx === 2 && <DollarSign className="h-5 w-5" />}
                </div>
                <div className="space-y-1">
                  <h4 className={`font-black uppercase tracking-wider text-xs ${activeScenario === idx ? 'text-primary' : 'text-neutral-800'}`}>
                    {sc.title}
                  </h4>
                  <p className="text-[10px] font-bold text-neutral-450 leading-normal italic">
                    {sc.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <Button 
            disabled={isPlaying}
            onClick={runSimulation}
            className="w-full py-7 rounded-[1.8rem] font-black uppercase tracking-[0.25em] text-xs gap-3 shadow-[0_15px_30px_-5px_rgba(30,58,138,0.2)] bg-gradient-to-r from-primary via-blue-600 to-sky-500 text-white hover:brightness-105 hover:shadow-[0_20px_40px_rgba(30,58,138,0.3)] transition-all duration-500 border-0"
          >
            {isPlaying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" /> Procesando Auditoría IA
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current text-white" /> Ejecutar Simulación Contable
              </>
            )}
          </Button>
        </div>

        {/* Panel Derecho */}
        <div className="lg:col-span-7">
          <div className="w-full bg-neutral-50/90 backdrop-blur-xl rounded-[2.5rem] border border-neutral-200 shadow-[0_30px_70px_rgba(30,58,138,0.03)] overflow-hidden flex flex-col min-h-[480px]">
            {/* Cabecera de la Consola */}
            <div className="px-6 py-5 bg-neutral-100/80 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="h-4 w-4 text-primary shadow-[0_0_10px_rgba(30,58,138,0.1)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-600">Patagonia AI Engine v8.6</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500/25 border border-rose-500/40 shadow-[0_0_8px_rgba(239,68,68,0.05)]" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500/25 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.05)]" />
                <span className="w-3.5 h-3.5 rounded-full bg-primary/25 border border-primary/40 shadow-[0_0_8px_rgba(30,58,138,0.05)]" />
              </div>
            </div>

            {/* Cuerpo de la Consola */}
            <div className="flex-1 p-8 font-mono text-[11px] leading-relaxed text-neutral-850 space-y-4 overflow-y-auto max-h-[400px]">
              <div className="text-neutral-400 italic">
                // Consola lista. Selecciona un escenario a la izquierda y presiona Ejecutar.
              </div>
              <div className="flex items-center gap-2 text-primary font-bold">
                <span>$</span>
                <span>{scenarios[activeScenario].prompt}</span>
              </div>

              {consoleLines.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`animate-in fade-in slide-in-from-left-2 duration-300 flex items-start gap-3 ${
                    line.includes('⚠️') || line.includes('❗') ? 'text-amber-700 font-bold' : 
                    line.includes('OK') || line.includes('bonificación') || line.includes('exención') ? 'text-sky-700 font-semibold' : 'text-neutral-700'
                  }`}
                >
                  <span className="text-neutral-400 select-none">{`0${idx + 1}`}</span>
                  <span>{line}</span>
                </div>
              ))}

              {isPlaying && (
                <div className="flex items-center gap-2 text-primary animate-pulse">
                  <span>&gt;</span>
                  <span className="h-3.5 w-2 bg-primary animate-blink shadow-[0_0_5px_rgba(30,58,138,0.5)]" />
                </div>
              )}

              {/* Resultado Exitoso */}
              {resultData && (
                <div className="mt-8 pt-8 border-t border-neutral-200 space-y-5 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-3 text-primary">
                    <CheckCircle2 className="h-5 w-5 text-primary shadow-[0_0_10px_rgba(30,58,138,0.15)] rounded-full" />
                    <span className="font-black uppercase tracking-widest text-xs bg-clip-text text-transparent bg-gradient-to-r from-primary to-sky-600">{resultData.title}</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 italic font-bold leading-normal">
                    {resultData.summary}
                  </p>

                  {/* Detalle Asiento Contable (Partida Doble) */}
                  <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    <div className="grid grid-cols-12 gap-2 text-[9px] font-black uppercase text-neutral-400 border-b border-neutral-100 pb-2.5">
                      <div className="col-span-6">Cuenta Contable</div>
                      <div className="col-span-3 text-right">Debe</div>
                      <div className="col-span-3 text-right">Haber</div>
                    </div>
                    {resultData.ledger.map((ld: any, i: number) => (
                      <div key={i} className="grid grid-cols-12 gap-2 text-[10px] tabular-nums font-bold">
                        <div className="col-span-6 text-neutral-700 truncate">{ld.acc}</div>
                        <div className="col-span-3 text-right text-sky-600">{ld.debe}</div>
                        <div className="col-span-3 text-right text-primary">{ld.haber}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sello de Inmutabilidad SHA-256 */}
                  {securedHash && (
                    <div className="flex flex-col md:flex-row md:items-center gap-4 bg-gradient-to-r from-primary/5 to-sky-500/5 p-5 rounded-2xl border border-primary/10">
                      <div className="p-3 bg-gradient-to-br from-primary/10 to-sky-500/10 rounded-2xl w-fit shadow-[0_0_15px_rgba(30,58,138,0.05)]">
                        <Lock className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-primary to-sky-600">Sello SHA-256 de Inmutabilidad</div>
                        <div className="text-[9px] font-mono text-neutral-400 break-all select-all font-semibold">{securedHash}</div>
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
