'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Briefcase, Newspaper, ArrowRight, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react'

export function EcosystemFlywheel() {
  const [activePillar, setActivePillar] = useState(0)

  const pillars = [
    {
      id: 0,
      title: '1. Formalización & ERP',
      subtitle: 'Nacimiento & Gestión Legal',
      icon: Building2,
      color: 'blue',
      desc: 'Creación de empresas en 24h por .000, facturación electrónica DTE ilimitada, conciliación bancaria y nómina bajo Ley 40 Horas.',
      linkText: 'Explorar Software ERP',
      linkHref: '/software',
      stats: '100% SII & DT Compliance',
    },
    {
      id: 1,
      title: '2. ContaEmpleos PUQ',
      subtitle: 'Atracción de Talento Regional',
      icon: Briefcase,
      color: 'emerald',
      desc: 'Bolsa de trabajo hiperlocal para Punta Arenas y faenas australes. Postulación directa por WhatsApp y estimador de sueldo líquido en vivo.',
      linkText: 'Ver Bolsa de Empleos',
      linkHref: '/empleos',
      stats: 'Postulaciones en 1 Clic',
    },
    {
      id: 2,
      title: '3. Diario Regional',
      subtitle: 'Inteligencia Económica & Noticias',
      icon: Newspaper,
      color: 'indigo',
      desc: 'Periodismo económico en tiempo real sobre inversiones, salmonicultura, hidrógeno verde, cotizaciones de divisas y normativas fiscales.',
      linkText: 'Leer Diario Regional',
      linkHref: '/noticias',
      stats: 'Actualidad Austral Diaria',
    },
  ]

  return (
    <div className="space-y-12">
      {/* Selector de Pilares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p, idx) => {
          const Icon = p.icon
          const isActive = activePillar === idx
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActivePillar(idx)}
              className={`p-8 rounded-[2.5rem] text-left transition-all duration-500 flex flex-col justify-between space-y-6 border ${
                isActive
                  ? 'bg-white border-2 border-primary shadow-2xl scale-[1.03] ring-4 ring-primary/10'
                  : 'bg-white/80 border-border/80 shadow-md hover:shadow-xl hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-4 rounded-2xl ${isActive ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                  {p.stats}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
                  {p.subtitle}
                </span>
                <h4 className="text-xl font-black uppercase italic tracking-tight text-foreground">
                  {p.title}
                </h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed pt-2">
                  {p.desc}
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-wider">
                <span>Conocer Más</span> <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Tarjeta de Síntesis del Flywheel */}
      <div className="p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-black uppercase tracking-widest text-cyan-400">
            <TrendingUp className="w-3 h-3" /> El Círculo Virtuoso de Magallanes
          </div>
          <h4 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white">
            Un Ecosistema Diseñado para Crecer sin Fricciones
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
            Cuando creas tu empresa con nosotros, gestionas tu contabilidad con el ERP, contratas colaboradores locales en ContaEmpleos y te informas con nuestro Diario Regional.
          </p>
        </div>
        <Link href={pillars[activePillar].linkHref} className="shrink-0 w-full md:w-auto">
          <button className="w-full md:w-auto h-12 px-8 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl">
            {pillars[activePillar].linkText} →
          </button>
        </Link>
      </div>
    </div>
  )
}
