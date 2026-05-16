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
  Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getLatestIndicators } from "@/actions/indicators";
import { getRegionalNews } from "@/actions/news";
import { createClient } from "@/lib/supabase/server";

import { DiarioRegionalSection } from "@/components/diario-regional-section";
import { MarketTicker } from "@/components/market-ticker";

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
        <section className="relative pt-32 pb-20 overflow-hidden" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10" suppressHydrationWarning />
          <div className="container mx-auto px-6 lg:px-12 relative" suppressHydrationWarning>
            <div className="max-w-4xl space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-in fade-in slide-in-from-top-4 duration-700" suppressHydrationWarning>
                <ShieldCheck className="h-3 w-3" /> Precisión Patagonia
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[100px] font-black tracking-tighter uppercase leading-[0.9] italic animate-in fade-in slide-in-from-left-8 duration-700">
                Precisión <span className="text-primary italic font-serif">Institucional</span> <br />
                y Escalabilidad <span className="text-muted-foreground/20">Organizacional.</span>
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
          </div>
        </section>

        {/* ===== DIARIO REGIONAL (Client Component) ===== */}
        <DiarioRegionalSection initialNews={regionalNews} indicators={indicators} />

        {/* ===== FEATURES SECTION ===== */}
        <section id="features" className="py-16 bg-background scroll-mt-32">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* FEATURE 1: DIARIO */}
              <div className="space-y-6 group p-8 rounded-3xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-border shadow-none hover:shadow-xl hover:shadow-primary/5">
                <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/20 transition-colors">
                  <Newspaper className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Hemeroteca Regional</h3>
                <p className="text-muted-foreground italic font-medium leading-relaxed">
                  Acceso exclusivo a noticias de Punta Arenas y el mundo, con un enfoque financiero diseñado para la toma de decisiones estratégicas en Magallanes.
                </p>
                <Link href="/noticias" className="block outline-none">
                  <Button variant="ghost" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-transparent text-primary hover:text-primary/70 transition-all gap-2">
                    Explorar Archivo <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* FEATURE 2: F29 / TRIBUTARIO */}
              <div className="space-y-6 group p-8 rounded-3xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-border shadow-none hover:shadow-xl hover:shadow-primary/5">
                <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Automación Tributaria</h3>
                <p className="text-muted-foreground italic font-medium leading-relaxed">
                  Motor inteligente de procesamiento de F29 y RCV. Transforma horas de trabajo manual en segundos de precisión digital para el contador chileno.
                </p>
                <Link href="/dashboard" className="block outline-none">
                  <Button variant="ghost" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-transparent text-primary hover:text-primary/70 transition-all gap-2">
                    Iniciar Auditoría <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* FEATURE 3: LRE / REMUNERACIONES */}
              <div className="space-y-6 group p-8 rounded-3xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-border shadow-none hover:shadow-xl hover:shadow-primary/5">
                <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/20 transition-colors">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Gestión Payroll LRE</h3>
                <p className="text-muted-foreground italic font-medium leading-relaxed">
                  Generación masiva de liquidaciones de sueldo y Libros de Remuneraciones Electrónicos listos para cargar en la Dirección del Trabajo.
                </p>
                <Link href="/dashboard" className="block outline-none">
                  <Button variant="ghost" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-transparent text-primary hover:text-primary/70 transition-all gap-2">
                    Ver Módulo Sueldos <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
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
        <section id="contacto" className="py-24 bg-white border-t border-border scroll-mt-32">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="bg-zinc-950 rounded-[3rem] p-12 lg:p-20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -z-0" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-white leading-none">
                    ¿Necesitas <span className="text-primary italic">Soporte Regional</span> <br />en Magallanes?
                  </h3>
                  <p className="text-zinc-400 text-lg font-medium leading-relaxed italic">
                    Nuestro equipo técnico está basado en Punta Arenas para brindarte una respuesta instantánea y personalizada a la realidad de tu empresa.
                  </p>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 text-white">
                      <div className="p-3 bg-primary/20 rounded-xl text-primary"><MapPin className="h-5 w-5" /></div>
                      <span className="text-sm font-bold uppercase tracking-widest italic">O'Higgins 123, Punta Arenas.</span>
                    </div>
                    <div className="flex items-center gap-4 text-white">
                      <div className="p-3 bg-primary/20 rounded-xl text-primary"><Zap className="h-5 w-5" /></div>
                      <span className="text-sm font-bold uppercase tracking-widest italic">contacto@contapymepuq.cl</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 space-y-6">
                  <h4 className="text-white text-xl font-black uppercase italic tracking-tight">Envíanos un Mensaje</h4>
                  <div className="space-y-4">
                    <input className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-6 text-white text-xs font-bold uppercase tracking-widest outline-none focus:border-primary/50 transition-colors" placeholder="Tu Nombre Completo" />
                    <input className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-6 text-white text-xs font-bold uppercase tracking-widest outline-none focus:border-primary/50 transition-colors" placeholder="Email Institucional" />
                    <textarea className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-6 text-white text-xs font-bold uppercase tracking-widest outline-none focus:border-primary/50 transition-colors" placeholder="Consulta Técnica" />
                    <Button className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-2xl shadow-primary/20">Enviar Solicitud</Button>
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
