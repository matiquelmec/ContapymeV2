'use client'

import { useState } from 'react'
import { FileText, Building2, CheckCircle2, ShieldCheck, ArrowRight, Zap, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CompanyStepper() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      num: '01',
      title: 'Diagnóstico & Estatutos',
      time: 'Hora 0 a 4',
      icon: FileText,
      desc: 'Analizamos si te conviene SpA, EIRL o Sociedad Limitada según tu rubro y aplicamos las exenciones de Magallanes.',
      detail: 'Redacción personalizada de estatutos sociales con facultades bancarias amplias, objeto social múltiple y administración flexible.',
    },
    {
      num: '02',
      title: 'Inscripción RES (Empresa en un Día)',
      time: 'Hora 4 a 12',
      icon: Building2,
      desc: 'Constitución oficial ante el Ministerio de Economía mediante firma electrónica avanzada del socio.',
      detail: 'Validación notarial en línea o firma digital remota para evitar filas y costos notariales de cientos de miles de pesos.',
    },
    {
      num: '03',
      title: 'Obtención RUT & Apertura SII',
      time: 'Hora 12 a 24',
      icon: ShieldCheck,
      desc: 'Trámite del RUT corporativo e Inicio de Actividades en 1ª Categoría ante el SII con acreditación de domicilio.',
      detail: 'Configuración tributaria óptima para operar en Zona Franca o Régimen ProPyme General con contabilidad simplificada o completa.',
    },
    {
      num: '04',
      title: 'Activación ERP & Facturación',
      time: 'Inmediato',
      icon: Zap,
      desc: 'Tu empresa queda 100% habilitada para emitir facturas electrónicas DTE y liquidaciones de sueldo.',
      detail: 'Te regalamos 30 días de acceso total a nuestro software contable ContaPymePUQ con asesoría de inducción para tu primer mes.',
    },
  ]

  return (
    <div className="p-8 sm:p-12 rounded-[3rem] bg-white border border-border/80 shadow-xl space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">
          Proceso Guiado en 24 Horas
        </span>
        <h3 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tight text-foreground">
          ¿Cómo Formalizamos tu Empresa por $35.000?
        </h3>
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          Haz clic en cada etapa para conocer la metodología paso a paso.
        </p>
      </div>

      {/* Indicador de Pasos (Stepper) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isActive = activeStep === idx
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`p-5 rounded-3xl text-left transition-all duration-300 flex flex-col justify-between min-h-[140px] border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-[1.03]'
                  : 'bg-muted/40 text-foreground border-border/60 hover:bg-muted hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-black font-mono tracking-widest ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {step.num}
                </span>
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-300' : 'text-primary'}`} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-tight leading-snug">
                  {step.title}
                </h4>
                <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  <Clock className="w-2.5 h-2.5" /> {step.time}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Tarjeta de Detalle del Paso Activo */}
      <div className="p-8 rounded-[2.5rem] bg-zinc-950 text-white border border-zinc-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400">
              Paso {steps[activeStep].num} en Detalle
            </span>
            <h4 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white">
              {steps[activeStep].title}
            </h4>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> Garantía de Cumplimiento
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
          <div className="space-y-2">
            <p className="font-bold text-white text-sm sm:text-base">
              {steps[activeStep].desc}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs leading-relaxed">
            {steps[activeStep].detail}
          </div>
        </div>

        {/* Comparativa de Costo */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-zinc-400">
            <span>Costo Tradicional con Abogado: </span>
            <span className="line-through text-rose-400 font-bold">$150.000 - $300.000 CLP</span>
          </div>
          <div className="text-emerald-400 font-black text-sm uppercase tracking-wider">
            Precio Contapymepuq: $35.000 CLP (Ahorro del 80%)
          </div>
        </div>
      </div>
    </div>
  )
}
