'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Sparkles, HelpCircle, ShieldCheck, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

export function PricingTable() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showMatrix, setShowMatrix] = useState(false)

  const plans = [
    {
      id: 'personal',
      name: 'Personal Patagonia',
      desc: 'Para independientes y microempresas que inician su formalización.',
      monthlyPrice: 19990,
      annualPrice: 15990,
      limit: '1 Empresa • 1 Usuario',
      badge: 'Básico',
      popular: false,
      features: [
        'Facturación DTE Electrónica SII Ilimitada',
        'Conciliación Bancaria Automática Básica',
        'Libro de Compras y Ventas (RCV)',
        'Soporte Estándar por Ticket',
        'Hemeroteca Regional y Acceso a Noticias',
      ],
      excluded: [
        'Multiusuario y perfiles de permisos',
        'Libro de Remuneraciones Electrónico (LRE)',
        'Auditoría Hash SHA-256 Ledger',
        'Soporte Prioritario Telefónico/WhatsApp',
      ],
      ctaText: 'Comenzar Prueba Gratis',
      href: '/login',
    },
    {
      id: 'pyme',
      name: 'Estudio Contable',
      desc: 'El plan favorito de contadores y PYMEs en crecimiento en Magallanes.',
      monthlyPrice: 44990,
      annualPrice: 35990,
      limit: 'Hasta 5 Empresas • Multiusuario',
      badge: 'Más Recomendado',
      popular: true,
      features: [
        'Todo lo del Plan Personal Patagonia',
        'Gestión Multiusuario & Colaboración en Vivo',
        'Nómina y Exportación Oficial LRE para DT',
        'Cálculo de Gratificación y Ley 40 Horas',
        'Cruce Predictivo F29 IVA vs RCV',
        'Soporte Prioritario por WhatsApp Dedicado',
      ],
      excluded: [
        'Auditoría Hash SHA-256 Ledger Forense',
        'Acceso a API de Integración Directa',
      ],
      ctaText: 'Iniciar 14 Días Gratis',
      href: '/login',
    },
    {
      id: 'enterprise',
      name: 'Consorcio Fueguino',
      desc: 'Máxima potencia, auditoría inmutable e integraciones para grupos empresariales.',
      monthlyPrice: 89990,
      annualPrice: 71990,
      limit: 'Empresas Ilimitadas • Usuarios Ilimitados',
      badge: 'Potencia Total',
      popular: false,
      features: [
        'Todo lo del Plan Estudio Contable',
        'Empresas y Razones Sociales Ilimitadas',
        'Auditoría Ledger Criptográfica (SHA-256)',
        'Reportabilidad Consolidada Multi-Empresa',
        'Acceso a API REST para ERP Externo',
        'Soporte Dedicado 24/7 con Contador Asignado',
        'Capacitación Onboarding Personalizada',
      ],
      excluded: [],
      ctaText: 'Contactar Asesor Austral',
      href: '/contacto',
    },
  ]

  const faqs = [
    {
      q: '¿Tienen periodo de prueba gratuito?',
      a: 'Sí, dispones de 14 días de prueba completa con todas las funciones del Plan Estudio Contable activadas sin costo ni ingreso de tarjeta de crédito.',
    },
    {
      q: '¿El software cumple con los requerimientos del SII y la Dirección del Trabajo?',
      a: 'Absolutamente. ContaPymePUQ genera archivos DTE con timbrado oficial SII y el Libro de Remuneraciones Electrónico (LRE) con las especificaciones de la DT y Ley 40 Horas.',
    },
    {
      q: '¿Incluye los cálculos especiales de Zona Franca y DL 889 para Magallanes?',
      a: 'Sí, nuestro motor está parametrizado para procesar exenciones tributarias de Zona Franca, bonificación de mano de obra DL 889 y asignaciones de zona austral.',
    },
    {
      q: '¿Puedo cancelar o cambiar de plan en cualquier momento?',
      a: 'Totalmente. No tenemos contratos de amarre ni cláusulas de permanencia. Puedes actualizar tu suscripción o cancelarla con 1 clic desde tu panel.',
    },
  ]

  return (
    <div className="space-y-20">
      {/* Selector Mensual / Anual */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-3 p-1.5 rounded-full bg-muted/60 border border-border/80 shadow-inner backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              !isAnnual
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Facturación Mensual
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              isAnnual
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Facturación Anual</span>
            <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
              -20% Ahorro
            </span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-semibold italic text-center">
          {isAnnual ? '✨ Estás ahorrando 2 meses completos al año con facturación anual.' : 'Sin compromisos. Cancela cuando quieras.'}
        </p>
      </div>

      {/* Grid de Tarjetas de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice
          return (
            <div
              key={plan.id}
              className={`p-8 sm:p-10 rounded-[2.5rem] flex flex-col justify-between transition-all duration-500 relative overflow-hidden ${
                plan.popular
                  ? 'bg-white border-2 border-primary shadow-2xl ring-4 ring-primary/10 lg:-translate-y-2'
                  : 'bg-white/90 border border-border/80 shadow-lg hover:shadow-2xl hover:border-primary/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 left-0 bg-primary text-primary-foreground py-1.5 text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3 h-3" /> {plan.badge}
                </div>
              )}

              <div className="space-y-6">
                <div className={`space-y-2 ${plan.popular ? 'pt-4' : ''}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-foreground">
                      {plan.name}
                    </h3>
                    {!plan.popular && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {plan.desc}
                  </p>
                  <div className="inline-block px-3 py-1 rounded-xl bg-primary/5 border border-primary/15 text-[10px] font-black text-primary uppercase tracking-wider">
                    {plan.limit}
                  </div>
                </div>

                {/* Precio */}
                <div className="pt-2 pb-4 border-b border-border/60">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-foreground tabular-nums tracking-tight">
                      ${currentPrice.toLocaleString('es-CL')}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      / mes + IVA
                    </span>
                  </div>
                  {isAnnual && (
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-1">
                      Cobro anualizado: ${(currentPrice * 12).toLocaleString('es-CL')} + IVA
                    </p>
                  )}
                </div>

                {/* Lista de Features */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 block">
                    Incluido en este plan:
                  </span>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-foreground/85 leading-snug">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botón CTA */}
              <div className="pt-8">
                <Link href={plan.href} className="block">
                  <Button
                    size="lg"
                    className={`w-full h-12 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                      plan.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 hover:scale-[1.02]'
                        : 'bg-muted/80 hover:bg-primary hover:text-primary-foreground text-foreground border border-border/60'
                    }`}
                  >
                    {plan.ctaText} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Matriz Comparativa Desplegable */}
      <div className="text-center space-y-6">
        <Button
          variant="outline"
          onClick={() => setShowMatrix(!showMatrix)}
          className="rounded-full px-8 h-11 border-primary/20 text-primary hover:bg-primary/5 text-xs font-black uppercase tracking-wider gap-2"
        >
          {showMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{showMatrix ? 'Ocultar Comparativa Detallada' : 'Ver Matriz Comparativa Completa'}</span>
        </Button>

        {showMatrix && (
          <div className="overflow-x-auto rounded-[2rem] border border-border bg-white shadow-xl p-6 text-left animate-in fade-in zoom-in-95 duration-300">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  <th className="py-4 px-4">Capacidad / Módulo</th>
                  <th className="py-4 px-4 text-center">Personal</th>
                  <th className="py-4 px-4 text-center text-primary">Estudio Contable</th>
                  <th className="py-4 px-4 text-center">Consorcio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">Empresas incluidas</td>
                  <td className="py-3 px-4 text-center">1</td>
                  <td className="py-3 px-4 text-center font-bold text-primary">Hasta 5</td>
                  <td className="py-3 px-4 text-center font-black">Ilimitadas</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">Facturación SII DTE</td>
                  <td className="py-3 px-4 text-center text-emerald-600">✓ Ilimitada</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Ilimitada</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Ilimitada</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">Libro de Remuneraciones LRE DT</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">—</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Incluido</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Incluido</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">Conciliación Bancaria Automática</td>
                  <td className="py-3 px-4 text-center">Básica</td>
                  <td className="py-3 px-4 text-center font-bold text-primary">Avanzada IA</td>
                  <td className="py-3 px-4 text-center font-black">Multi-Banco Forense</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">Auditoría Hash SHA-256</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">—</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">—</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Sello Forense</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">Canal de Soporte</td>
                  <td className="py-3 px-4 text-center">Ticket</td>
                  <td className="py-3 px-4 text-center font-bold text-primary">WhatsApp Directo</td>
                  <td className="py-3 px-4 text-center font-black">Contador Dedicado 24/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preguntas Frecuentes (FAQ) */}
      <div className="max-w-3xl mx-auto space-y-6 pt-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Transparencia Total</span>
          <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
            Preguntas Frecuentes sobre Planes
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/80 bg-white overflow-hidden shadow-sm transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-black uppercase text-xs tracking-tight text-foreground hover:bg-muted/30 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  {faq.q}
                </span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground font-medium leading-relaxed border-t border-border/40 animate-in fade-in duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sello de Garantía Criptográfica */}
      <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-primary/20 text-cyan-400 border border-primary/30 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1 text-left">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-400">Garantía Austral Sin Riesgo</span>
            <h4 className="text-lg font-black uppercase italic tracking-tight">14 Días de Prueba Sin Compromiso</h4>
            <p className="text-xs text-slate-400 font-medium leading-normal">
              Accede a todas las funciones sin tarjeta de crédito. Soporte técnico directo radicado en Punta Arenas.
            </p>
          </div>
        </div>
        <Link href="/login" className="shrink-0 w-full md:w-auto">
          <Button size="lg" className="w-full md:w-auto h-12 px-8 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl">
            Comenzar Ahora →
          </Button>
        </Link>
      </div>
    </div>
  )
}
