'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, 
  Sparkles, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Building2,
  Briefcase,
  Newspaper,
  Megaphone,
  Zap,
  Check,
  Globe,
  Share2
} from 'lucide-react'

export function PricingTable() {
  const [activeTab, setActiveTab] = useState<'erp' | 'jobs' | 'news' | 'ads'>('erp')
  const [isAnnual, setIsAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showMatrix, setShowMatrix] = useState(false)

  // 1. Planes Software ERP
  const erpPlans = [
    {
      id: 'emprendedor',
      name: 'Emprendedor',
      desc: 'Para independientes, profesionales y microempresas sin empleados.',
      monthlyPrice: 9990,
      annualPrice: 7990,
      limit: '1 Empresa • 1 Usuario',
      badge: 'Inicial',
      popular: false,
      features: [
        'Facturación DTE Electrónica SII Ilimitada',
        'Registro de Compras y Ventas (RCV Automático)',
        'Propuesta y Cálculo Estimado F29 IVA',
        'Conciliación Bancaria Automática Básica',
        'Soporte Estándar por Ticket',
      ],
      excluded: [
        'Nómina y Libro Remuneraciones LRE DT',
        'Multiusuario y perfiles de colaboradores',
        'Auditoría Hash SHA-256 Ledger',
      ],
      ctaText: 'Comenzar Prueba Gratis',
      href: '/login',
    },
    {
      id: 'pyme-pro',
      name: 'Pyme Pro & Nómina',
      desc: 'El plan ideal para empresas de 1 a 15 trabajadores en Magallanes.',
      monthlyPrice: 24990,
      annualPrice: 19990,
      limit: '1 Empresa • 3 Usuarios',
      badge: 'Más Recomendado',
      popular: true,
      features: [
        'Todo lo del Plan Emprendedor',
        'Módulo Completo de Nómina & Contratos',
        'Libro de Remuneraciones Electrónico (LRE DT)',
        'Cálculo de Gratificación y Ley 40 Horas',
        'Beneficio Magallanes DL 889 Automatizado',
        '🎁 1 Aviso Destacado bimestral en ContaEmpleos',
        'Soporte Prioritario por WhatsApp Dedicado',
      ],
      excluded: [
        'Multi-Empresa (más de 1 RUT)',
        'Auditoría Ledger SHA-256 Forense',
      ],
      ctaText: 'Iniciar 14 Días Gratis',
      href: '/login',
    },
    {
      id: 'estudio',
      name: 'Estudio Contable',
      desc: 'Para contadores independientes y oficinas contables multi-cliente.',
      monthlyPrice: 49990,
      annualPrice: 39990,
      limit: 'Hasta 10 Empresas • Multiusuario',
      badge: 'Para Contadores',
      popular: false,
      features: [
        'Todo lo del Plan Pyme Pro',
        'Gestión de hasta 10 Empresas (10 RUTs)',
        'Nómina y LRE para todos los clientes',
        'Cruce Predictivo F29 IVA vs RCV',
        'Portal Cliente para descarga de balances',
        'Soporte Técnico Directo para Contadores',
        '+$4.990/mes por RUT adicional',
      ],
      excluded: [
        'Auditoría Hash SHA-256 Forense',
      ],
      ctaText: 'Probar Modo Estudio',
      href: '/login',
    },
    {
      id: 'enterprise',
      name: 'Corporativo Austral',
      desc: 'Máxima potencia, auditoría inmutable e integraciones para consorcios.',
      monthlyPrice: 89990,
      annualPrice: 71990,
      limit: 'Empresas Ilimitadas • Usuarios Ilimitados',
      badge: 'Potencia Total',
      popular: false,
      features: [
        'Todo lo del Plan Estudio Contable',
        'Empresas y Razones Sociales Ilimitadas',
        'Auditoría Ledger Criptográfica (SHA-256)',
        'Publicaciones de empleo ilimitadas en ContaEmpleos',
        'Difusión en Portada del Diario Regional',
        'Acceso a API REST para ERP Externo',
        'Soporte Dedicado 24/7 con Contador Asignado',
      ],
      excluded: [],
      ctaText: 'Contactar Asesor Austral',
      href: '/contacto',
    },
  ]

  // 2. Planes Publicación Aislada de Empleo (Precios Justos & Freemium)
  const jobPlans = [
    {
      name: 'Básico Comunitario',
      price: 0,
      period: '100% GRATIS (30 días)',
      desc: 'Publica tu vacante en minutos con postulación directa por WhatsApp y Google for Jobs.',
      badge: 'Comunitario',
      popular: false,
      features: [
        'Activo por 30 días en ContaEmpleos',
        'Indexación oficial en Google for Jobs',
        'Postulación directa por WhatsApp y Email',
        'Validación Art. 2° Código del Trabajo',
        'Calculadora de Sueldo Líquido integrada',
      ],
      ctaText: 'Publicar Gratis ($0)',
      href: '/publicar-empleo',
    },
    {
      name: 'Destacado con Pin',
      price: 2990,
      period: 'Pago único (30 días)',
      desc: 'Fijado en la primera posición de la bolsa durante todo el mes para máxima atención.',
      badge: 'Mayor Visibilidad',
      popular: false,
      features: [
        'Todo lo del Aviso Básico Comunitario',
        'Fijado en los primeros lugares de la lista',
        'Badge visual distintivo "Destacado"',
        'Prioridad en búsquedas de Google',
      ],
      ctaText: 'Publicar con Pin ($2.990)',
      href: '/publicar-empleo',
    },
    {
      name: 'Destacado + Redes Sociales',
      price: 4990,
      period: 'Pago único (30 días)',
      desc: 'Incluye diseño automático de flyer publicitario HD para Instagram y Facebook.',
      badge: '⭐ Más Recomendado',
      popular: true,
      features: [
        'Todo lo del Aviso Destacado con Pin',
        'Flyer HD automático para Instagram & Facebook',
        'Difusión en grupos de empleo de Magallanes',
        'Sello visual "Urgente / Destacado"',
      ],
      ctaText: 'Publicar con Redes ($4.990)',
      href: '/publicar-empleo',
    },
    {
      name: 'Faena / Gran Empresa',
      price: 9990,
      period: 'Pago único (Faena/Urgente)',
      desc: 'Para empresas con turnos 7x7/14x14, salmoneras, constructoras y alta urgencia.',
      badge: 'Faena & Gran Pyme',
      popular: false,
      features: [
        'Todo lo del Aviso con Redes Sociales',
        'Avisos ilimitados para faena y turnos',
        'Difusión masiva en toda la Patagonia',
        'Soporte prioritario de redacción',
      ],
      ctaText: 'Publicar Faena ($9.990)',
      href: '/publicar-empleo',
    },
  ]

  // 3. Planes Diario Regional & Prensa (Self-Serve con Mercado Pago)
  const newsPlans = [
    {
      name: 'Nota de Prensa / Comunicado',
      price: 19990,
      period: 'Publicación Permanente',
      desc: 'Difunde lanzamientos, aperturas de local o noticias institucionales.',
      badge: 'Google News',
      popular: false,
      features: [
        'Publicación permanente en el Diario Regional',
        'Indexación en Google News y Google Discover',
        'Enlace dofollow hacia el sitio web de tu empresa',
        'Botón directo de contacto por WhatsApp',
      ],
      ctaText: 'Publicar Nota de Prensa',
      href: '/publicar-comunicado',
    },
    {
      name: 'Publirreportaje de Portada',
      price: 39990,
      period: 'Destacado 7 días',
      desc: 'Reportaje comercial con cobertura en la portada principal y redes.',
      badge: 'Recomendado',
      popular: true,
      features: [
        'Todo lo de la Nota de Prensa',
        'Posición destacada en portada principal por 7 días',
        'Redacción optimizada para SEO y lectura móvil',
        'Post dedicado en Instagram y Facebook',
        'Galería de hasta 5 fotografías en alta resolución',
      ],
      ctaText: 'Contratar Publirreportaje',
      href: '/publicar-comunicado',
    },
    {
      name: 'Cobertura Comercial + Banner',
      price: 79990,
      period: 'Campaña 15 días',
      desc: 'Impacto total con publirreportaje de portada y banner publicitario lateral.',
      badge: 'Impacto Total',
      popular: false,
      features: [
        'Publirreportaje de portada permanente',
        'Banner publicitario lateral activo por 15 días',
        'Mención destacada en el boletín de lectores',
        'Reporte de clics e impresiones generadas',
      ],
      ctaText: 'Solicitar Cobertura',
      href: '/publicar-comunicado',
    },
  ]

  // 4. Banners Publicitarios (Media Kit)
  const adPlans = [
    {
      name: 'Banner Lateral en Artículos',
      price: 39990,
      period: 'por mes (~$1.333/día)',
      desc: 'Ubicación fija lateral mientras los lectores revisan las noticias y calculadoras.',
      badge: 'Alta Frecuencia',
      popular: false,
      features: [
        'Visible en todos los artículos y noticias del portal',
        'Formato vertical 300x250 o 300x600 px',
        'Enlace directo a tu WhatsApp o página web',
        'Segmentación 100% regional Magallanes',
      ],
      ctaText: 'Reservar Espacio',
      href: '/contacto',
    },
    {
      name: 'Banner Calculadora de Sueldos',
      price: 49990,
      period: 'por mes (~$1.666/día)',
      desc: 'La página de mayor consulta entre trabajadores, contadores y jefes de RRHH.',
      badge: 'Foco Laboral',
      popular: true,
      features: [
        'Ubicación exclusiva dentro de la Calculadora de Sueldos',
        'Público de alta intención: Empleados, Pymes y Contadores',
        'Ideal para Institutos, Isapres, Automotoras y Financieras',
        'Enlace con tracking de conversiones',
      ],
      ctaText: 'Reservar Calculadora',
      href: '/contacto',
    },
    {
      name: 'Mega Banner Superior (Header)',
      price: 59990,
      period: 'por mes (~$1.999/día)',
      desc: 'La posición con mayor visibilidad del portal, bajo el Ticker de indicadores.',
      badge: 'Máxima Visibilidad',
      popular: false,
      features: [
        'Visible en el 100% de las páginas y dispositivos',
        'Formato horizontal premium 728x90 o 970x90 px',
        'Más de 50.000 impresiones mensuales estimadas',
        'Rotación prioritaria en móviles y escritorio',
      ],
      ctaText: 'Reservar Mega Banner',
      href: '/contacto',
    },
  ]

  const faqs = [
    {
      q: '¿Tienen periodo de prueba gratuito en el software contable?',
      a: 'Sí, dispones de 14 días de prueba completa con todas las funciones del Plan Pyme Pro activadas sin costo ni necesidad de ingresar tarjeta de crédito.',
    },
    {
      q: '¿Puedo publicar una oferta de empleo sin estar registrado en el software?',
      a: 'Totalmente. Nuestro sistema de publicación de empleo es de autoservicio (Self-Serve): completas los datos de tu aviso, seleccionas el paquete ($9.990 o $19.990), abonas y tu aviso queda publicado de inmediato en Google for Jobs.',
    },
    {
      q: '¿El software cumple con los requerimientos del SII y la Dirección del Trabajo?',
      a: 'Absolutamente. ContaPymePUQ genera archivos DTE con timbrado oficial SII y el Libro de Remuneraciones Electrónico (LRE) con las especificaciones de la DT y Ley 40 Horas.',
    },
    {
      q: '¿Cómo funciona la publicación de notas de prensa en el Diario Regional?',
      a: 'Nos envías tu comunicado o texto con imágenes. Nuestro equipo lo optimiza para Google News y lo publica de forma permanente con enlaces directos a tu empresa.',
    },
    {
      q: '¿Puedo cancelar o cambiar de plan en cualquier momento?',
      a: 'Sí. No tenemos contratos de amarre ni cláusulas de permanencia. Puedes actualizar tu suscripción o cancelarla con 1 clic desde tu panel.',
    },
  ]

  return (
    <div className="space-y-16 sm:space-y-20">
      
      {/* SELECTOR DE PILAR / CATEGORÍA */}
      <div className="flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-full bg-white/80 border border-border/80 shadow-lg backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setActiveTab('erp')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'erp'
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Software ERP & Nómina</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'jobs'
                ? 'bg-emerald-600 text-white shadow-md scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Publicar Empleo (Self-Serve)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'news'
                ? 'bg-indigo-600 text-white shadow-md scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Diario & Publirreportajes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'ads'
                ? 'bg-amber-600 text-white shadow-md scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Banners & Media Kit</span>
          </button>
        </div>
      </div>

      {/* ===== TAB 1: SOFTWARE ERP & NÓMINA ===== */}
      {activeTab === 'erp' && (
        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-300">
          {/* Selector Mensual / Anual */}
          <div className="flex flex-col items-center justify-center space-y-3">
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
              {isAnnual ? '✨ Ahorras 2 meses completos al año con facturación anual.' : 'Sin compromisos. Cancela cuando quieras.'}
            </p>
          </div>

          {/* Grid de 4 Planes ERP */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {erpPlans.map((plan) => {
              const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice
              return (
                <div
                  key={plan.id}
                  className={`p-6 sm:p-8 rounded-[2rem] flex flex-col justify-between transition-all duration-500 relative overflow-hidden ${
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

                  <div className="space-y-5">
                    <div className={`space-y-1.5 ${plan.popular ? 'pt-3' : ''}`}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black uppercase italic tracking-tight text-foreground">
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
                    <div className="pt-2 pb-3 border-b border-border/60">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-foreground tabular-nums tracking-tight">
                          ${currentPrice.toLocaleString('es-CL')}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          / mes + IVA
                        </span>
                      </div>
                      {isAnnual && (
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-1">
                          Cobro anual: ${(currentPrice * 12).toLocaleString('es-CL')} + IVA
                        </p>
                      )}
                    </div>

                    {/* Lista de Features */}
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80 block">
                        Incluido:
                      </span>
                      <ul className="space-y-2">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-foreground/85 leading-snug">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Botón CTA */}
                  <div className="pt-6">
                    <Link href={plan.href} className="block">
                      <Button
                        size="lg"
                        className={`w-full h-11 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                          plan.popular
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:scale-[1.02]'
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
        </div>
      )}

      {/* ===== TAB 2: PUBLICAR EMPLEOS (SELF-SERVE) ===== */}
      {activeTab === 'jobs' && (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
              Publica tu Vacante en ContaEmpleos al Instante
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sin registros obligatorios ni formularios largos. Tu aviso aparece en Google for Jobs y en los canales regionales.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-6xl mx-auto">
            {jobPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-[2.5rem] flex flex-col justify-between transition-all duration-500 relative overflow-hidden ${
                  plan.popular
                    ? 'bg-white border-2 border-emerald-600 shadow-2xl ring-4 ring-emerald-600/10 lg:-translate-y-2'
                    : 'bg-white/90 border border-border/80 shadow-lg hover:shadow-2xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 left-0 bg-emerald-600 text-white py-1.5 text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3" /> {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div className={`space-y-1.5 ${plan.popular ? 'pt-3' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black uppercase italic tracking-tight text-foreground">
                        {plan.name}
                      </h3>
                      {!plan.popular && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {plan.desc}
                    </p>
                  </div>

                  <div className="pt-2 pb-4 border-b border-border/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-foreground tabular-nums tracking-tight">
                        ${plan.price.toLocaleString('es-CL')}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs font-semibold text-foreground/85 leading-snug">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link href={plan.href} className="block">
                    <Button
                      size="lg"
                      className={`w-full h-12 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                        plan.popular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20'
                          : 'bg-zinc-900 hover:bg-black text-white'
                      }`}
                    >
                      {plan.ctaText} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB 3: DIARIO & PUBLIRREPORTAJES ===== */}
      {activeTab === 'news' && (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
              Prensa & Publirreportajes en el Diario Regional
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Posiciona tu marca en Google News y llega a miles de lectores de Punta Arenas, Natales y Tierra del Fuego.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {newsPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-[2.5rem] flex flex-col justify-between transition-all duration-500 relative overflow-hidden ${
                  plan.popular
                    ? 'bg-white border-2 border-indigo-600 shadow-2xl ring-4 ring-indigo-600/10 lg:-translate-y-2'
                    : 'bg-white/90 border border-border/80 shadow-lg hover:shadow-2xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 left-0 bg-indigo-600 text-white py-1.5 text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3" /> {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div className={`space-y-1.5 ${plan.popular ? 'pt-3' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black uppercase italic tracking-tight text-foreground">
                        {plan.name}
                      </h3>
                      {!plan.popular && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {plan.desc}
                    </p>
                  </div>

                  <div className="pt-2 pb-4 border-b border-border/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-foreground tabular-nums tracking-tight">
                        ${plan.price.toLocaleString('es-CL')}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        / {plan.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs font-semibold text-foreground/85 leading-snug">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link href={plan.href} className="block">
                    <Button
                      size="lg"
                      className={`w-full h-12 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                        plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20'
                          : 'bg-zinc-900 hover:bg-black text-white'
                      }`}
                    >
                      {plan.ctaText} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB 4: BANNERS & MEDIA KIT ===== */}
      {activeTab === 'ads' && (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
              Banners Publicitarios & Media Kit Digital
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Espacios publicitarios limpios y sin saturación para marcas con presencia en Magallanes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {adPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-[2.5rem] flex flex-col justify-between transition-all duration-500 relative overflow-hidden ${
                  plan.popular
                    ? 'bg-white border-2 border-amber-600 shadow-2xl ring-4 ring-amber-600/10 lg:-translate-y-2'
                    : 'bg-white/90 border border-border/80 shadow-lg hover:shadow-2xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 left-0 bg-amber-600 text-white py-1.5 text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3" /> {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div className={`space-y-1.5 ${plan.popular ? 'pt-3' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black uppercase italic tracking-tight text-foreground">
                        {plan.name}
                      </h3>
                      {!plan.popular && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {plan.desc}
                    </p>
                  </div>

                  <div className="pt-2 pb-4 border-b border-border/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-foreground tabular-nums tracking-tight">
                        ${plan.price.toLocaleString('es-CL')}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs font-semibold text-foreground/85 leading-snug">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link href={plan.href} className="block">
                    <Button
                      size="lg"
                      className={`w-full h-12 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                        plan.popular
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/20'
                          : 'bg-zinc-900 hover:bg-black text-white'
                      }`}
                    >
                      {plan.ctaText} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BANNER PROMOCIONAL: CREACIÓN DE EMPRESAS */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary/80 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border border-slate-800">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
            Tu Empresa en un Día + Software
          </span>
          <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
            ¿Quieres Crear tu Empresa por $35.000?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal">
            Constitución legal, inicio de actividades SII y 2 meses gratis del Plan Pyme Pro para que arranques facturando con todo incluido.
          </p>
        </div>
        <Link href="/crear-empresa" className="shrink-0">
          <Button size="lg" className="rounded-full px-8 h-12 text-xs font-black uppercase tracking-wider bg-white text-slate-950 hover:bg-emerald-400 hover:text-slate-950 shadow-xl transition-all hover:scale-105 active:scale-95">
            <Building2 className="w-4 h-4 mr-2" /> Iniciar Empresa ($35K)
          </Button>
        </Link>
      </div>

      {/* PREGUNTAS FRECUENTES (FAQ) */}
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
            <HelpCircle className="w-3.5 h-3.5" /> Respuestas Claras
          </div>
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
            Preguntas Frecuentes sobre Tarifas y Servicios
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-white shadow-sm overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-foreground">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
