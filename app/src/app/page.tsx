import Image from "next/image";
import Link from "next/link";

export const revalidate = 0 // Forzar dinamismo total (sin caché estático)
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Newspaper, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  Globe, 
  MapPin, 
  LayoutDashboard,
  CheckCircle2,
  Users,
  Flame,
  GitCompare,
  Lock,
  BookOpen,
  Building,
  AlertTriangle,
  FileCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getLatestIndicators } from "@/actions/indicators";
import { getRegionalNews } from "@/actions/news";
import { createClient } from "@/lib/supabase/server";

import { DiarioRegionalSection } from "@/components/diario-regional-section";
import { MarketTicker } from "@/components/market-ticker";
import { AISandbox } from "@/components/ai-sandbox";
import { TaxCalculator } from "@/components/tax-calculator";
import { HeroBentoGrid } from "@/components/hero-bento";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const indicatorsRes = await getLatestIndicators();
  const indicators = indicatorsRes.success ? indicatorsRes.data : [];

  const newsRes = await getRegionalNews();
  const regionalNews = newsRes.success ? newsRes.data : [];

  /** ... logic helpers ... */

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-primary/20" suppressHydrationWarning>
      <MarketTicker indicators={indicators} />
      {/* ===== HEADER / NAVBAR ===== */}
      <header className="sticky top-11 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl" suppressHydrationWarning>
        <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12" suppressHydrationWarning>
          <div className="flex items-center gap-4 group transition-transform duration-300">
            <Image 
              src="/logo-contapyme.png" 
              alt="Contapymepuq Logo" 
              width={180} 
              height={50} 
              priority
              className="h-auto w-[120px] sm:w-[160px] md:w-[200px] drop-shadow-sm"
            />
          </div>
          <nav className="hidden lg:flex items-center gap-10">
            <Link href="#features" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Características</Link>
            <Link href="#diario" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors hover:scale-105 transition-transform">Diario Regional</Link>
            <Link href="#pricing" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Planes</Link>
            <Link href="#contacto" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Soporte</Link>
          </nav>
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard">
                <Button className="text-[11px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all px-8 rounded-full h-11">
                  <LayoutDashboard className="mr-2 h-3 w-3" /> Panel de Control
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all px-6 sm:px-10 rounded-full h-9 sm:h-11">
                  Acceso Clientes
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="relative pt-20 pb-20 overflow-hidden" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10" suppressHydrationWarning />
          
          {/* Orbe decorativo de luz Patagonian Glow */}
          <div className="absolute top-20 right-[-10%] w-[550px] h-[550px] bg-primary/10 rounded-full blur-[130px] -z-10 pointer-events-none opacity-60 animate-pulse duration-[8000ms]" />
          
          <div className="container mx-auto px-6 lg:px-12 relative" suppressHydrationWarning>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left Column (Content) */}
              <div className="lg:col-span-7 space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-in fade-in slide-in-from-top-4 duration-700" suppressHydrationWarning>
                  <ShieldCheck className="h-3 w-3" /> Precisión Patagonia
                </div>
                <h1 className="text-[clamp(2.5rem,5.5vw,5.5rem)] font-black tracking-tighter uppercase leading-[0.95] italic animate-in fade-in slide-in-from-left-8 duration-700">
                  Precisión <span className="text-primary italic font-serif">Institucional</span> <br />
                  y Escalabilidad <span className="text-muted-foreground/35">Organizacional.</span>
                </h1>
                <p className="max-w-2xl text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground italic leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                  Diseñado para el Contador Moderno en la Región de Magallanes. Integración total con noticias regionales y gestión contable de alto rendimiento.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
                  <Link href="/dashboard">
                    <Button size="lg" className="text-xs font-black uppercase tracking-widest h-14 px-10 rounded-2xl bg-primary text-primary-foreground hover:shadow-2xl hover:shadow-primary/30 transition-all group">
                      Comenzar Ahora | 7 Días Gratis <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#diario">
                    <Button variant="outline" size="lg" className="text-xs font-black uppercase tracking-widest h-14 px-10 rounded-2xl border-2 hover:bg-muted transition-all">
                      Ver Diario Regional
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Right Column (HeroBentoGrid) */}
              <div className="lg:col-span-5 w-full animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
                <HeroBentoGrid indicators={indicators} news={regionalNews} />
              </div>
              
            </div>
          </div>
        </section>

        {/* ===== DIARIO REGIONAL (Client Component) ===== */}
        <DiarioRegionalSection initialNews={regionalNews} indicators={indicators} />

        {/* ===== FEATURES SECTION (Matriz de Poder Contable) ===== */}
        <section id="features" className="py-24 bg-background scroll-mt-32">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Tecnología Financiera Austral</h2>
              <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground">
                Matriz de Poder Contable <br /><span className="text-muted-foreground/30">e Integridad Operacional.</span>
              </h3>
              <p className="text-muted-foreground font-bold italic text-sm">
                Conoce el conjunto completo de herramientas contables, tributarias y criptográficas diseñadas para el sur de Chile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* CARD 1: BILLING */}
              <div className="space-y-6 group p-8 rounded-[2.5rem] bg-white border border-border/50 hover:border-primary/20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col justify-between min-h-[320px]">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                    <Flame className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Facturación SII Compliance</h3>
                  <p className="text-muted-foreground italic font-medium leading-relaxed text-xs">
                    Emite Facturas, Boletas, Guías de Despacho y Notas de Crédito con timbrado electrónico inmediato. Firmado digitalmente y sincronizado automáticamente con el SII.
                  </p>
                </div>
                <Link href="/dashboard" className="block pt-4">
                  <Button variant="link" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:no-underline gap-2">
                    Emitir DTE <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* CARD 2: BANK RECONCILIATION */}
              <div className="space-y-6 group p-8 rounded-[2.5rem] bg-white border border-border/50 hover:border-primary/20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col justify-between min-h-[320px]">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                    <GitCompare className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Conciliación Bancaria</h3>
                  <p className="text-muted-foreground italic font-medium leading-relaxed text-xs">
                    Sube tus cartolas de cualquier banco chileno. Nuestro motor cruza automáticamente los movimientos con tus asientos contables y genera los ajustes correspondientes en segundos.
                  </p>
                </div>
                <Link href="/dashboard" className="block pt-4">
                  <Button variant="link" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:no-underline gap-2">
                    Conciliar Cuentas <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* CARD 3: CRYPTO INTEGRITY */}
              <div className="space-y-6 group p-8 rounded-[2.5rem] bg-white border border-border/50 hover:border-primary/20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col justify-between min-h-[320px]">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Registro Criptográfico</h3>
                  <p className="text-muted-foreground italic font-medium leading-relaxed text-xs">
                    Seguridad forense total. Cada transacción y movimiento contable es sellado y encadenado criptográficamente mediante algoritmo SHA-256 libre de alteraciones.
                  </p>
                </div>
                <Link href="/dashboard" className="block pt-4">
                  <Button variant="link" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:no-underline gap-2">
                    Auditar Hashes <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* CARD 4: JOURNAL */}
              <div className="space-y-6 group p-8 rounded-[2.5rem] bg-white border border-border/50 hover:border-primary/20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col justify-between min-h-[320px]">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                    <BookOpen className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Libro Diario Dinámico</h3>
                  <p className="text-muted-foreground italic font-medium leading-relaxed text-xs">
                    Cada hecho económico genera automáticamente asientos contables en partida doble (Debe/Haber). Cumplimiento estricto con IFRS y normativas contables del SII.
                  </p>
                </div>
                <Link href="/dashboard" className="block pt-4">
                  <Button variant="link" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:no-underline gap-2">
                    Ver Libro Diario <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* CARD 5: PAYROLL LRE */}
              <div className="space-y-6 group p-8 rounded-[2.5rem] bg-white border border-border/50 hover:border-primary/20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col justify-between min-h-[320px]">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Remuneraciones LRE</h3>
                  <p className="text-muted-foreground italic font-medium leading-relaxed text-xs">
                    Emite liquidaciones masivas de sueldo con exenciones de zona extrema. Genera el Libro de Remuneraciones Electrónico listo para la Dirección del Trabajo (DT).
                  </p>
                </div>
                <Link href="/dashboard" className="block pt-4">
                  <Button variant="link" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:no-underline gap-2">
                    Gestionar Sueldos <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* CARD 6: FIXED ASSETS */}
              <div className="space-y-6 group p-8 rounded-[2.5rem] bg-white border border-border/50 hover:border-primary/20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col justify-between min-h-[320px]">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                    <Building className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Control de Activos Fijos</h3>
                  <p className="text-muted-foreground italic font-medium leading-relaxed text-xs">
                    Controla y calcula la depreciación lineal y acelerada de las maquinarias, vehículos e inmuebles de tu empresa, reflejando el impacto en tu balance general.
                  </p>
                </div>
                <Link href="/dashboard" className="block pt-4">
                  <Button variant="link" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:no-underline gap-2">
                    Revisar Activos <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* CARD 7: F29 TRIBUTARIO */}
              <div className="space-y-6 group p-8 rounded-[2.5rem] bg-white border border-border/50 hover:border-primary/20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col justify-between min-h-[320px]">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                    <AlertTriangle className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Auditoría F29 & RCV</h3>
                  <p className="text-muted-foreground italic font-medium leading-relaxed text-xs">
                    Cruce predictivo mensual de IVA Débito e IVA Crédito. Compara tus libros físicos contra el Registro de Compras y Ventas (RCV) del SII de manera automática.
                  </p>
                </div>
                <Link href="/dashboard" className="block pt-4">
                  <Button variant="link" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:no-underline gap-2">
                    Auditar IVA <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* CARD 8: CERTIFIED REPORTS */}
              <div className="space-y-6 group p-8 rounded-[2.5rem] bg-white border border-border/50 hover:border-primary/20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col justify-between min-h-[320px]">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                    <FileCheck className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Balances Certificados</h3>
                  <p className="text-muted-foreground italic font-medium leading-relaxed text-xs">
                    Genera Balances y Estados de Resultados sellados digitalmente con firma hash SHA-256 única y archivados de forma inmutable, listos para auditorías o bancos.
                  </p>
                </div>
                <Link href="/dashboard" className="block pt-4">
                  <Button variant="link" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:no-underline gap-2">
                    Validar Reportes <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== INTERACTIVE DEMOS SECTION (AI Sandbox & Tax Calculator) ===== */}
        <section id="interactive-demos" className="py-24 bg-gradient-to-b from-background to-neutral-50/50 scroll-mt-32">
          <div className="container mx-auto px-6 lg:px-12 space-y-24">
            {/* AISandbox Block */}
            <div className="space-y-8">
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Simulación Cripto-Contable</h2>
                <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-foreground">
                  Experimenta el Motor de Inteligencia en Vivo
                </h3>
                <p className="text-muted-foreground font-bold italic text-xs">
                  Interactúa directamente con la consola virtual contable y observa cómo procesamos exenciones, remunaciones e inmutabilidad.
                </p>
              </div>
              <AISandbox />
            </div>

            {/* TaxCalculator Block */}
            <div className="space-y-8">
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Análisis Tributario</h2>
                <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-foreground">
                  Calcula tu Beneficio en Zonas Extremas
                </h3>
                <p className="text-muted-foreground font-bold italic text-xs">
                  Compara los ahorros fiscales entre Zona Franca, Ley Navarino y el Régimen General del resto de Chile de forma instantánea.
                </p>
              </div>
              <TaxCalculator />
            </div>
          </div>
        </section>

        {/* ===== PRICING SECTION ===== */}
        <section id="pricing" className="py-24 bg-zinc-50/50 scroll-mt-32">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Planes & Suscripciones</h2>
              <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground">
                Inversión Estratégica <br /><span className="text-muted-foreground/30">para tu Gestión.</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  name: "Personal Patagonia", 
                  price: "$19.990", 
                  limit: "1 Empresa",
                  features: ["Acceso Funcional TOTAL", "Auditoría IA Incluida", "F29 & LRE Automatizado", "Hemeroteca Regional"],
                  label: "Económico"
                },
                { 
                  name: "Estudio Contable", 
                  price: "$44.990", 
                  limit: "Hasta 5 Empresas",
                  features: ["Acceso Funcional TOTAL", "Auditoría IA Incluida", "F29 & LRE Automatizado", "Hemeroteca Regional"], 
                  popular: true,
                  label: "Inteligente"
                },
                { 
                  name: "Consorcio Fueguino", 
                  price: "$89.990", 
                  limit: "Empresas Ilimitadas",
                  features: ["Acceso Funcional TOTAL", "Auditoría IA Incluida", "F29 & LRE Automatizado", "Hemeroteca Regional"],
                  label: "Potencia"
                },
              ].map((plan, i) => (
                <div key={i} className={`p-10 rounded-[2.5rem] bg-white border ${plan.popular ? 'border-primary shadow-2xl ring-4 ring-primary/5' : 'border-border shadow-xl'} relative overflow-hidden transition-all hover:scale-105`}>
                  {plan.popular && <span className="absolute top-6 right-6 bg-primary text-primary-foreground text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-tighter">{plan.label}</span>}
                  {!plan.popular && <span className="absolute top-6 right-6 bg-zinc-100 text-zinc-500 text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-tighter">{plan.label}</span>}
                  
                  <div className="mb-6 space-y-1">
                    <h4 className="text-xl font-black uppercase italic tracking-tight">{plan.name}</h4>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">{plan.limit}</p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-3xl font-black text-foreground">{plan.price}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">/ Mes</span>
                  </div>

                  <div className="pt-6 border-t border-zinc-100 mb-8 space-y-4">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">Herramientas Incluidas:</p>
                    <ul className="space-y-3">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-3 text-xs font-bold text-zinc-600 italic leading-tight">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/login">
                    <Button className={`w-full rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] ${plan.popular ? 'bg-primary shadow-xl shadow-primary/20' : 'bg-transparent border-2 border-border text-foreground hover:bg-zinc-50'}`}>
                      Iniciar Prueba 7 Días
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CONTACT SECTION ===== */}
        <section id="contacto" className="py-24 bg-background border-t border-border scroll-mt-32">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="relative bg-gradient-to-br from-primary/[0.04] via-zinc-50/50 to-primary/[0.08] border border-primary/10 rounded-[3rem] p-8 sm:p-12 lg:p-20 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* Auroras Patagónicas Decorativas */}
              <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-0 pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-500/8 rounded-full blur-[100px] -z-0 pointer-events-none" />
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-primary">
                    <MapPin className="h-3 w-3" /> Soporte Local e Inmediato
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground leading-[1.05]">
                    ¿Necesitas <span className="text-primary italic">Soporte Regional</span> <br />en Magallanes?
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base font-bold italic leading-relaxed max-w-lg">
                    Nuestro equipo técnico está basado en Punta Arenas para brindarte una respuesta instantánea y personalizada a la realidad fiscal y administrativa de tu empresa en el extremo sur.
                  </p>
                  
                  <div className="flex flex-col gap-5 pt-4">
                    <div className="flex items-center gap-4 transition-transform hover:translate-x-1 duration-300">
                      <div className="p-3.5 bg-primary/10 text-primary rounded-2xl border border-primary/20 shadow-sm shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Dirección Corporativa</span>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">O'Higgins 123, Punta Arenas.</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 transition-transform hover:translate-x-1 duration-300">
                      <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20 shadow-sm shrink-0">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Correo Electrónico</span>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-primary">contacto@contapymepuq.cl</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-[2.5rem] border border-primary/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] space-y-6">
                  <div className="space-y-1">
                    <h4 className="text-foreground text-xl font-black uppercase italic tracking-tight">Envíanos un Mensaje</h4>
                    <p className="text-muted-foreground text-[10px] font-bold italic">Canal directo con ingenieros de soporte en Magallanes.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative group">
                      <input 
                        type="text"
                        className="w-full h-14 bg-zinc-50 border border-zinc-200/80 rounded-xl px-6 text-foreground text-xs font-bold uppercase tracking-wider outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                        placeholder="Tu Nombre Completo" 
                      />
                    </div>
                    
                    <div className="relative group">
                      <input 
                        type="email"
                        className="w-full h-14 bg-zinc-50 border border-zinc-200/80 rounded-xl px-6 text-foreground text-xs font-bold uppercase tracking-wider outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                        placeholder="Email Institucional" 
                      />
                    </div>
                    
                    <div className="relative group">
                      <textarea 
                        className="w-full h-32 bg-zinc-50 border border-zinc-200/80 rounded-xl p-6 text-foreground text-xs font-bold uppercase tracking-wider outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all resize-none" 
                        placeholder="Consulta Técnica" 
                      />
                    </div>
                    
                    <Button className="w-full h-14 bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-xl shadow-primary/15 hover:shadow-2xl hover:shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all">
                      Enviar Solicitud
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white py-12">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 group cursor-default">
              <Globe className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform duration-500" />
              <span className="text-[10px] font-black italic uppercase tracking-widest text-foreground/60">Contapymepuq — Magallanes, Chile</span>
            </div>
            <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              <Link href="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
              <Link href="/terminos" className="hover:text-primary transition-colors">Términos</Link>
              <Link href="mailto:contacto@contapymepuq.cl" className="hover:text-primary transition-colors">Contacto</Link>
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
              © 2026 Contapymepuq. Magallanes, Chile.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
