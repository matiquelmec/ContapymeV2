'use client'

import { useState } from 'react'
import { 
  Calculator, 
  Share2, 
  Send, 
  HelpCircle, 
  Check, 
  Download,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TaxCalculator() {
  const [revenue, setRevenue] = useState<number>(45000000) // Default 45 Millones CLP
  const [regimen, setRegimen] = useState<'general' | 'zona_franca' | 'navarino'>('navarino')
  const [copied, setCopied] = useState<boolean>(false)

  // Cálculos Tributarios
  const ivaGeneral = Math.floor(revenue * 0.19)
  
  let ivaAhorro = 0
  let bonificacionDFL15 = 0
  let ahorroRenta = 0
  let totalBeneficios = 0

  if (regimen === 'zona_franca') {
    ivaAhorro = ivaGeneral
    ahorroRenta = Math.floor(revenue * 0.05) // Estimado rebaja aranceles y primera categoría
    totalBeneficios = ivaAhorro + ahorroRenta
  } else if (regimen === 'navarino') {
    ivaAhorro = ivaGeneral
    bonificacionDFL15 = Math.floor(revenue * 0.20) // 20% Bonificación Ley 18.392
    ahorroRenta = Math.floor(revenue * 0.08) // Beneficio Renta + Créditos
    totalBeneficios = ivaAhorro + bonificacionDFL15 + ahorroRenta
  }

  const formatCLP = (val: number) => {
    return val.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
  }

  // Generar texto viral de WhatsApp
  const handleShareWhatsApp = () => {
    const regimenName = regimen === 'navarino' ? 'Ley Navarino (Tierra del Fuego)' : 'Zona Franca de Punta Arenas'
    const text = `📊 *¡Acabo de auditar mi Ahorro Tributario Austral con Contapymepuq!*
    
*Ingresos Anuales Estimados:* ${formatCLP(revenue)}
*Régimen:* ${regimenName}

*Beneficios Obtenidos:*
🔹 Exención de IVA Ahorrada: ${formatCLP(ivaAhorro)}
🔹 Bonificación Directa del Estado (DFL 15): ${formatCLP(bonificacionDFL15)}
🔹 Ahorro de Renta & Aranceles: ${formatCLP(ahorroRenta)}

🚀 *TOTAL DE BENEFICIOS ANUALES:* ${formatCLP(totalBeneficios)}

Audita tus exenciones y automatiza tu contabilidad inmutable en segundos en Contapymepuq.cl 🇨🇱`

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://contapymepuq.cl')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full rounded-[3.5rem] bg-white/70 backdrop-blur-xl p-8 md:p-12 border border-neutral-200/60 shadow-[0_30px_80px_rgba(30,58,138,0.04)] relative overflow-hidden">
      {/* Auroras Patagónicas en Azul y Cian Suaves */}
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 to-sky-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-sky-600/5 to-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        {/* Controles de Entrada (Izquierda) */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/5 to-sky-500/5 border border-primary/20 shadow-[0_5px_15px_rgba(30,58,138,0.03)]">
              <Calculator className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-primary to-sky-600">Simulador de Franquicias</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-neutral-900 leading-none">
              Exenciones & Franquicias <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-sky-600 to-blue-500 font-extrabold drop-shadow-[0_2px_10px_rgba(30,58,138,0.1)]">Tributarias Australes</span>
            </h2>
            <p className="text-neutral-500 font-bold italic text-xs leading-relaxed max-w-md">
              Elige tu régimen tributario e ingresa tus ingresos anuales estimados para simular de inmediato tu ahorro fiscal con las leyes vigentes de Magallanes.
            </p>
          </div>

          {/* Selector de Régimen */}
          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Régimen Contable a Evaluar</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'general', label: 'Régimen General', desc: 'Resto de Chile' },
                { id: 'zona_franca', label: 'Zona Franca', desc: 'Punta Arenas' },
                { id: 'navarino', label: 'Ley Navarino', desc: 'Tierra del Fuego' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setRegimen(item.id as any)}
                  className={`p-4 rounded-2xl border text-center transition-all duration-500 ${
                    regimen === item.id 
                      ? 'bg-neutral-50 border-primary/40 shadow-[0_10px_25px_rgba(30,58,138,0.06)] text-primary scale-[1.02]' 
                      : 'bg-white/55 border-neutral-200/80 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600'
                  }`}
                >
                  <div className="text-xs font-black uppercase tracking-wider leading-tight">{item.label}</div>
                  <div className="text-[9px] font-bold opacity-60 italic mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Slider de Ingresos */}
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Ingresos Netos Anuales (CLP)</label>
              <span className="text-md font-black tracking-tight text-primary tabular-nums bg-gradient-to-r from-primary/5 to-sky-500/5 px-4 py-2 rounded-full border border-primary/20 shadow-[0_5px_15px_rgba(30,58,138,0.03)]">
                {formatCLP(revenue)}
              </span>
            </div>
            
            <div className="space-y-2">
              <input 
                type="range" 
                min={10000000} 
                max={500000000} 
                step={5000000}
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary slider-thumb-premium"
              />
              <div className="flex justify-between text-[9px] font-bold text-neutral-400 italic">
                <span>$10M CLP</span>
                <span>$250M CLP</span>
                <span>$500M CLP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Resultados (Derecha) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex-1 rounded-[2.5rem] bg-white border border-neutral-200 shadow-[0_30px_70px_rgba(30,58,138,0.03)] text-neutral-800 p-8 md:p-10 flex flex-col justify-between space-y-8">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">Desglose de Ahorro Austral</span>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary flex items-center gap-1.5 font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(30,58,138,0.4)] animate-pulse" /> Ley Vigente
                </span>
              </div>

              {/* Mapeo de Indicadores */}
              <div className="space-y-5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-bold italic flex items-center gap-1.5">
                    Exención IVA Ahorrada <HelpCircle className="h-3 w-3 text-neutral-300" />
                  </span>
                  <span className="font-bold tabular-nums text-neutral-800">{formatCLP(ivaAhorro)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-bold italic flex items-center gap-1.5">
                    Bonificación DFL 15 (20%) <HelpCircle className="h-3 w-3 text-neutral-300" />
                  </span>
                  <span className="font-bold tabular-nums text-neutral-800">{formatCLP(bonificacionDFL15)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-bold italic flex items-center gap-1.5">
                    Ahorro de Renta & Créditos <HelpCircle className="h-3 w-3 text-neutral-300" />
                  </span>
                  <span className="font-bold tabular-nums text-neutral-800">{formatCLP(ahorroRenta)}</span>
                </div>
              </div>
            </div>

            {/* Total Beneficio */}
            <div className="bg-gradient-to-r from-primary/5 via-blue-600/5 to-sky-500/5 p-6 rounded-3xl border border-primary/15 space-y-2 relative overflow-hidden shadow-[0_0_20px_rgba(30,58,138,0.02)]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ahorro Total Fiscal Estimado</div>
              <div className="text-4xl font-black italic tracking-tighter text-neutral-900 tabular-nums flex items-baseline gap-1">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-sky-600 to-blue-500 font-black">
                  {formatCLP(totalBeneficios)}
                </span>
                <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase not-italic">/ año</span>
              </div>
            </div>

            {/* Acciones de Viralización */}
            <div className="space-y-4">
              <Button 
                onClick={handleShareWhatsApp}
                className="w-full py-6 rounded-2xl font-black uppercase tracking-[0.25em] text-xs gap-3 shadow-[0_15px_30px_-5px_rgba(30,58,138,0.2)] bg-gradient-to-r from-primary via-blue-600 to-sky-500 text-white hover:brightness-105 hover:shadow-[0_20px_40px_rgba(30,58,138,0.3)] transition-all duration-500 border-0"
              >
                <Share2 className="h-4 w-4" /> Enviar Reporte a WhatsApp
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className="py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] gap-2 border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-800"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-primary animate-pulse" /> : <Send className="h-3.5 w-3.5 text-neutral-400" />}
                  {copied ? 'Copiado!' : 'Copiar Enlace'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => alert("Simulación lista. Para descargar el PDF oficial de auditoría, por favor inicia sesión o crea una cuenta.")}
                  className="py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] gap-2 border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-800"
                >
                  <Download className="h-3.5 w-3.5 text-neutral-400" /> Descargar PDF
                </Button>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Premium custom range input styles tailored to deep corporate blue palette */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.4), 0 0 20px rgba(37, 99, 235, 0.2);
          transition: all 0.3s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          background: #0284c7;
          box-shadow: 0 0 12px rgba(2, 132, 199, 0.5), 0 0 24px rgba(2, 132, 199, 0.25);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border: 0;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.4), 0 0 20px rgba(37, 99, 235, 0.2);
          transition: all 0.3s ease;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          background: #0284c7;
          box-shadow: 0 0 12px rgba(2, 132, 199, 0.5), 0 0 24px rgba(2, 132, 199, 0.25);
        }
      `}</style>
    </div>
  )
}
