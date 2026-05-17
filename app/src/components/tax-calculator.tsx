'use client'

import { useState } from 'react'
import { 
  Calculator, 
  Share2, 
  Send, 
  HelpCircle, 
  Check, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TaxCalculator() {
  const [revenue, setRevenue] = useState<number>(45000000) // Default 45 Millones CLP
  const [regimen, setRegimen] = useState<'general' | 'zona_franca' | 'navarino'>('navarino')
  const [showShare, setShowShare] = useState<boolean>(false)
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
    <div className="w-full rounded-[3rem] bg-white border border-border/60 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8 md:p-12 relative overflow-hidden">
      {/* Elementos Decorativos */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Controles de Entrada */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Calculadora de Zonas Extremas</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-foreground leading-none">
              Exenciones & Franquicias <br />Tributarias Australes
            </h2>
            <p className="text-muted-foreground font-bold italic text-xs leading-relaxed">
              Elige tu régimen e ingresa tus ingresos anuales estimados para simular de inmediato tu ahorro fiscal con las leyes vigentes de Magallanes.
            </p>
          </div>

          {/* Selector de Régimen */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Régimen Contable a Evaluar</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'general', label: 'Régimen General', desc: 'Resto de Chile' },
                { id: 'zona_franca', label: 'Zona Franca', desc: 'Punta Arenas' },
                { id: 'navarino', label: 'Ley Navarino', desc: 'Tierra del Fuego' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setRegimen(item.id as any)}
                  className={`p-4 rounded-2xl border text-center transition-all duration-300 ${
                    regimen === item.id 
                      ? 'bg-primary/5 border-primary/40 text-primary shadow-sm' 
                      : 'bg-neutral-50/50 border-border/60 hover:bg-neutral-50 hover:border-border text-foreground'
                  }`}
                >
                  <div className="text-xs font-black uppercase tracking-wider leading-tight">{item.label}</div>
                  <div className="text-[9px] font-bold text-muted-foreground/60 italic mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Slider de Ingresos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ingresos Netos Anuales (CLP)</label>
              <span className="text-lg font-black tracking-tight text-primary tabular-nums bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
                {formatCLP(revenue)}
              </span>
            </div>
            <input 
              type="range" 
              min={10000000} 
              max={500000000} 
              step={5000000}
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value))}
              className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[9px] font-bold text-muted-foreground/40 italic">
              <span>$10M CLP</span>
              <span>$250M CLP</span>
              <span>$500M CLP</span>
            </div>
          </div>
        </div>

        {/* Panel de Resultados */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex-1 rounded-[2.5rem] bg-neutral-900 text-white p-8 md:p-10 border border-neutral-800 shadow-2xl flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">Desglose de Ahorro Austral</span>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ley Vigente
                </span>
              </div>

              {/* Mapeo de Indicadores */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-bold italic flex items-center gap-1">Exención IVA Ahorrada <HelpCircle className="h-3 w-3 text-neutral-600" /></span>
                  <span className="font-bold tabular-nums text-neutral-200">{formatCLP(ivaAhorro)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-bold italic flex items-center gap-1">Bonificación DFL 15 (20%) <HelpCircle className="h-3 w-3 text-neutral-600" /></span>
                  <span className="font-bold tabular-nums text-neutral-200">{formatCLP(bonificacionDFL15)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-bold italic flex items-center gap-1">Ahorro de Renta & Créditos <HelpCircle className="h-3 w-3 text-neutral-600" /></span>
                  <span className="font-bold tabular-nums text-neutral-200">{formatCLP(ahorroRenta)}</span>
                </div>
              </div>
            </div>

            {/* Total Beneficio */}
            <div className="bg-neutral-950 p-6 rounded-3xl border border-neutral-800 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ahorro Total Fiscal Estimado</div>
              <div className="text-4xl font-black italic tracking-tighter text-white tabular-nums">
                {formatCLP(totalBeneficios)}
                <span className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase block not-italic mt-1">por año</span>
              </div>
            </div>

            {/* Acciones de Viralización */}
            <div className="space-y-3">
              <Button 
                onClick={handleShareWhatsApp}
                className="w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs gap-3 shadow-xl hover:shadow-2xl transition-all duration-300 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Share2 className="h-4 w-4" /> Enviar Reporte a WhatsApp
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className="py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] gap-2 border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Send className="h-3.5 w-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Enlace'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => alert("Simulación lista. Para descargar el PDF oficial de auditoría, por favor inicia sesión o crea una cuenta.")}
                  className="py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] gap-2 border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" /> Descargar PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
