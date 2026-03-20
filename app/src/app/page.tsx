import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Newspaper, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  Globe, 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  LayoutDashboard 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getLatestIndicators } from "@/actions/indicators";
import { getRegionalNews } from "@/actions/news";

import { DiarioRegionalSection } from "@/components/diario-regional-section";

export default async function LandingPage() {
  const indicatorsRes = await getLatestIndicators();
  const indicators = indicatorsRes.success ? indicatorsRes.data : [];

  const newsRes = await getRegionalNews();
  const regionalNews = newsRes.success ? newsRes.data : [];

  const getIndValue = (code: string, fallback: string) => {
    const ind = indicators?.find((i: any) => i.codigo === code);
    if (!ind) return fallback;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency', 
      currency: 'CLP', 
      minimumFractionDigits: code === 'uf' ? 2 : 0 
    }).format(ind.valor);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-primary/20" suppressHydrationWarning>
      {/* ===== HEADER / NAVBAR ===== */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl" suppressHydrationWarning>
        <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12" suppressHydrationWarning>
          <div className="flex items-center gap-4 group transition-transform duration-300">
            <Image 
              src="/logo-contapyme.png" 
              alt="ContaPyme V2 Logo" 
              width={180} 
              height={50} 
              priority
              className="h-auto w-[160px] md:w-[200px] drop-shadow-sm"
            />
          </div>
          <nav className="hidden lg:flex items-center gap-10">
            <Link href="#features" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Características</Link>
            <Link href="#diario" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors hover:scale-105 transition-transform">Diario Regional</Link>
            <Link href="#pricing" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Planes</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-[11px] font-black uppercase tracking-widest hover:bg-primary/5 px-6">Ingresar</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="text-[11px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all px-8 rounded-full h-11">
                <LayoutDashboard className="mr-2 h-3 w-3" /> Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="relative pt-32 pb-40 overflow-hidden" suppressHydrationWarning>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10" suppressHydrationWarning />
          <div className="container mx-auto px-6 lg:px-12 relative" suppressHydrationWarning>
            <div className="max-w-4xl space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-in fade-in slide-in-from-top-4 duration-700" suppressHydrationWarning>
                <ShieldCheck className="h-3 w-3" /> Precisión Patagonia v2.0
              </div>
              <h1 className="text-7xl md:text-[100px] font-black tracking-tighter uppercase leading-[0.85] italic animate-in fade-in slide-in-from-left-8 duration-700">
                Precisión <span className="text-primary italic font-serif">Institucional</span> <br />
                y Escalabilidad <span className="text-muted-foreground/20">Organizacional.</span>
              </h1>
              <p className="max-w-2xl text-xl md:text-2xl font-medium text-muted-foreground italic leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                Diseñado para el Contador Moderno en la Región de Magallanes. Integración total con noticias regionales y gestión contable de alto rendimiento.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
                <Link href="/dashboard">
                  <Button size="lg" className="text-xs font-black uppercase tracking-widest h-14 px-10 rounded-2xl bg-primary text-primary-foreground hover:shadow-2xl hover:shadow-primary/30 transition-all">
                    Comenzar Ahora | $0 Costo Inicial
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

        {/* ===== INDICADORS BAR ===== */}
        <div className="border-y border-border bg-white py-10" suppressHydrationWarning>
          <div className="container mx-auto px-6 lg:px-12" suppressHydrationWarning>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8" suppressHydrationWarning>
              {[
                { label: "Unidad de Fomento", value: getIndValue('uf', '$38.360,50'), icon: TrendingUp, color: "text-blue-700" },
                { label: "Dólar Observado", value: getIndValue('dolar', '$964,50'), icon: DollarSign, color: "text-emerald-700" },
                { label: "UTM Mensual", value: getIndValue('utm', '$66.232'), icon: Building2, color: "text-purple-700" },
                { label: "Estado Mercado", value: "SISTEMA ACTIVO", icon: Globe, color: "text-zinc-700" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1 border-l-2 border-border pl-6 first:border-none">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none mb-1">{item.label}</p>
                  <p className={`text-xl font-black tracking-tighter italic ${item.color} leading-none`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== DIARIO REGIONAL (Client Component) ===== */}
        <DiarioRegionalSection initialNews={regionalNews} />

        {/* ===== FEATURES SECTION ===== */}
        <section id="features" className="py-24 bg-background">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <Newspaper className="h-10 w-10 text-primary" />
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Diario Regional</h3>
                <p className="text-muted-foreground italic font-medium">Información actualizada de Magallanes directamente en tu plataforma de gestión.</p>
              </div>
              <div className="space-y-4">
                <BarChart3 className="h-10 w-10 text-primary" />
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Gestión Contable</h3>
                <p className="text-muted-foreground italic font-medium">Herramientas avanzadas para contadores modernos, con integración de indicadores económicos.</p>
              </div>
              <div className="space-y-4">
                <Zap className="h-10 w-10 text-primary" />
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Alta Velocidad</h3>
                <p className="text-muted-foreground italic font-medium">Arquitectura optimizada para una respuesta instantánea y máxima seguridad de datos.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white py-12">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-sm font-black italic uppercase tracking-widest">Contapyme V2 — Punta Arenas</span>
            </div>
            <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Privacidad</Link>
              <Link href="#" className="hover:text-primary transition-colors">Términos</Link>
              <Link href="#" className="hover:text-primary transition-colors">Contacto</Link>
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
              © 2026 Contapyme V2. Magallanes, Chile.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
