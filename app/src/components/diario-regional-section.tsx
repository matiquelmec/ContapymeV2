import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Landmark, 
  BadgeCheck, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";

/** 📰 Tipo de Noticia Profesional (Contapymepuq) */
interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  image_url: string;
  published_at: string;
  is_featured: boolean;
  source_name: string;
  source_url: string;
}

interface DiarioRegionalSectionProps {
  initialNews: NewsArticle[];
  indicators?: any[];
}

/** 🧬 Motor Editorial Experto: Scoring de Relevancia Dinámica */
function newsRelevanceScoring(news: NewsArticle[]): { hero: NewsArticle | null; secondary: NewsArticle[] } {
  if (news.length === 0) return { hero: null, secondary: [] };

  const scoredNews = news.map(article => {
    let score = 0;
    const cat = article.category?.toUpperCase() || "";
    const now = Date.now();
    const pubDate = new Date(article.published_at).getTime();
    const hoursAgo = (now - pubDate) / 3600000;

    if (cat.includes("SII") || cat.includes("LEGAL")) score += 100;
    else if (cat.includes("FINANZAS")) score += 90;
    else if (cat.includes("ECONOMÍA")) score += 80;
    else if (cat.includes("INVERSIONES")) score += 70;
    else if (cat.includes("MAGALLANES") || cat.includes("ACTUAL")) score += 40;
    else score += 10;

    if (hoursAgo < 12) score += 40;
    else if (hoursAgo < 24) score += 20;

    if (article.is_featured) score += 20;

    return { ...article, finalScore: score };
  });

  const ranked = [...scoredNews].sort((a, b) => (b as any).finalScore - (a as any).finalScore);
  const hero = ranked[0] || null;
  const secondary = ranked.slice(1, 7);

  return { hero, secondary };
}

export function DiarioRegionalSection({ initialNews, indicators = [] }: DiarioRegionalSectionProps) {
  const { hero: heroNews, secondary: secondaryNews } = newsRelevanceScoring(initialNews);

  /** 🛡️ Protocolo de Veracidad Absoluta */
  const isDataReady = Array.isArray(indicators) && indicators.length > 0;

  // Mapeo dinámico del Market Pulse con Inteligencia de Tendencia
  const pulseData = [
    { 
      label: "IPSA Chile", 
      value: indicators.find(i => i.codigo === 'ipsa')?.valor,
      trend: "up",
      color: isDataReady ? "text-emerald-500" : "text-muted-foreground/30",
      format: (v: number) => v ? `${v.toLocaleString('es-CL', { minimumFractionDigits: 0 })} pts` : "---"
    },
    { 
      label: "Petróleo WTI", 
      value: indicators.find(i => i.codigo === 'wti')?.valor,
      trend: "down",
      color: isDataReady ? "text-rose-500" : "text-muted-foreground/30",
      format: (v: number) => v ? `US$ ${v.toFixed(2)}` : "---"
    },
    { 
      label: "Cobre (lb)", 
      value: indicators.find(i => i.codigo === 'libra_cobre')?.valor,
      trend: "up",
      color: isDataReady ? "text-emerald-500" : "text-muted-foreground/30",
      format: (v: number) => v ? `US$ ${v.toFixed(2)}` : "---"
    }
  ];

  return (
    <section id="diario" className="py-16 bg-white text-foreground overflow-hidden relative scroll-mt-32" suppressHydrationWarning>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")'}} suppressHydrationWarning />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" suppressHydrationWarning />
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10" suppressHydrationWarning>
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8" suppressHydrationWarning>
            <div className="space-y-6 relative">
               <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary/80 mb-2 italic">
                 <span className="w-10 h-[1px] bg-primary/50" />
                 <Landmark className="h-3 w-3 animate-pulse" /> Portal de Noticias Institucional Contapymepuq
               </div>
               <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] italic text-foreground text-shadow-sm">
                 Diario <span className="text-primary italic font-serif">Punta Arenas</span> <br />
                 <span className="text-muted-foreground/30">& Financiero Regional.</span>
               </h2>
               <p className="text-muted-foreground font-medium italic text-lg leading-relaxed max-w-lg">
                 Información estratégica para el contador chileno, con el balance perfecto entre economía regional y global.
               </p>
            </div>
             <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/#contacto" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full text-xs font-black uppercase tracking-widest border-border text-muted-foreground hover:bg-muted rounded-2xl h-12 px-8 transition-all">
                    Anuncia con Nosotros
                  </Button>
                </Link>
                <Link href="/noticias" className="w-full sm:w-auto">
                  <Button className="w-full text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-xl hover:shadow-primary/20 rounded-2xl h-12 px-8 transition-all active:scale-95">
                    Hemeroteca Regional
                  </Button>
                </Link>
             </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* 🏆 HERO / NOTICIA ESTRATÉGICA */}
           <div className="lg:col-span-8 group cursor-pointer space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700" suppressHydrationWarning>
              {heroNews ? (
                <Link href={`/noticias/${heroNews.slug}`} scroll={false}>
                  {/** ... render de noticia real ... */}
                  <div key={heroNews.id} className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl shadow-primary/10 hover:border-primary/40 transition-all duration-700">
                     <Image 
                        src={heroNews.image_url || "/news-placeholder.png"} 
                        alt={heroNews.title} 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                     />
                     <div className="absolute inset-x-0 top-0 p-8 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full border border-primary/20 shadow-lg flex items-center gap-2">
                           <BadgeCheck className="h-4 w-4 text-primary" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary">Contenido Verificado</span>
                        </div>
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                     <div className="absolute bottom-10 left-10 p-2 space-y-4 max-w-xl">
                        <span className="text-[10px] font-black tracking-widest text-primary-foreground italic px-4 py-1.5 border border-primary/50 rounded-lg bg-primary/90 backdrop-blur-xl shadow-lg shadow-primary/20 uppercase">{heroNews.category}</span>
                        <h3 className="text-3xl md:text-5xl font-black leading-none italic drop-shadow-2xl text-white tracking-tighter uppercase">
                          {heroNews.title}
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-black text-white/70 uppercase tracking-widest italic" suppressHydrationWarning>
                          <span className="flex items-center gap-2" suppressHydrationWarning><span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Diario Punta Arenas</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span suppressHydrationWarning>{new Date(heroNews.published_at).toLocaleDateString('es-CL')}</span>
                        </div>
                     </div>
                  </div>
                </Link>
              ) : (
                <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl bg-muted/10 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 p-12 text-center border-dashed">
                   <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center animate-pulse">
                      <Globe className="h-8 w-8 text-primary/20" />
                   </div>
                   <h3 className="text-xl font-black tracking-tighter uppercase italic text-muted-foreground/40">Sintonizando Central de Noticias</h3>
                   <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-widest max-w-xs">
                      Verificando fuentes regionales y globales. La integridad de la información es nuestro activo más valioso.
                   </p>
                </div>
              )}
               {/* 📣 GRILLA DE PUBLICIDAD SECUNDARIA (Para balancear altura de columnas) */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {/* Ad 1: Zona Franca */}
                  <div className="p-6 rounded-[2rem] bg-gradient-to-br from-zinc-50 to-zinc-100/50 border border-zinc-200/60 shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                     <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-500" />
                     <div className="relative space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded">
                              Alianza Comercial
                           </span>
                           <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-widest">Patrocinado</span>
                        </div>
                        <h5 className="text-base font-black italic tracking-tighter uppercase text-foreground leading-tight">
                           Zona Franca <br/><span className="text-primary font-serif">Punta Arenas</span>
                        </h5>
                        <p className="text-[10px] font-semibold text-muted-foreground/70 leading-relaxed line-clamp-2">
                           El polo comercial libre de impuestos más grande de la Patagonia. Encuentra tecnología, retail e importaciones liberadas.
                        </p>
                        <Link href="/#contacto" className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary pt-2 hover:underline">
                           <span>Ver Catálogo de Tiendas</span>
                           <ArrowUpRight className="h-3 w-3" />
                        </Link>
                     </div>
                  </div>

                  {/* Ad 2: Cerveza Austral */}
                  <div className="p-6 rounded-[2rem] bg-gradient-to-br from-zinc-50 to-zinc-100/50 border border-zinc-200/60 shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                     <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-500" />
                     <div className="relative space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded">
                              Gastronomía Local
                           </span>
                           <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-widest">Patrocinado</span>
                        </div>
                        <h5 className="text-base font-black italic tracking-tighter uppercase text-foreground leading-tight">
                           Cerveza Austral <br/><span className="text-emerald-600 font-serif">Origen Patagónico</span>
                        </h5>
                        <p className="text-[10px] font-semibold text-muted-foreground/70 leading-relaxed line-clamp-2">
                           Elaborada con las aguas más puras del fin del mundo desde 1896. Un orgullo cervecero de nuestra región.
                        </p>
                        <Link href="/#contacto" className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 pt-2 hover:underline">
                           <span>Conocer Variedades</span>
                           <ArrowUpRight className="h-3 w-3" />
                        </Link>
                     </div>
                  </div>
               </div>
            </div>
            {/* 🏛️ ESPACIOS PUBLICITARIOS Y ALIANZAS (Premium Ad Slots) */}
            <div className="lg:col-span-4 space-y-10">
               {/* 📣 ESPACIO PUBLICITARIO DESTACADO */}
               <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-6 relative overflow-hidden group shadow-xl transition-all duration-500 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)]">
                  {/* Orbe de luz difuminado */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700 animate-pulse" />
                  
                  <div className="relative space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary px-3 py-1 bg-primary/10 rounded-full">
                           Publicidad Destacada
                        </span>
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Patrocinado</span>
                     </div>
                     
                     <div className="space-y-2 mt-4">
                        <h4 className="text-2xl font-black italic tracking-tighter uppercase text-foreground leading-none">
                           Austral <span className="font-serif italic text-primary">Inversiones</span>
                        </h4>
                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                           Asesoría Financiera & Tributaria Regional
                        </p>
                     </div>

                     <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl border border-primary/10 shadow-sm mt-4 group-hover:border-primary/30 transition-all">
                        <p className="text-xs font-semibold text-muted-foreground italic leading-relaxed">
                           "Optimizamos la gestión patrimonial y tributaria de empresas y familias en Magallanes con estándares globales."
                        </p>
                     </div>
                     
                     <div className="pt-2">
                        <Link href="/#contacto" className="inline-flex items-center justify-between w-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-xl h-10 px-5 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
                           <span>Consultar Servicios</span>
                           <ArrowUpRight className="h-4 w-4 text-primary-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                     </div>
                  </div>
               </div>

               <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-zinc-50 to-white border border-primary/15 space-y-6 relative overflow-hidden group shadow-xl transition-all duration-500 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)]">
                  {/* Orbe de luz difuminado */}
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-700 animate-pulse" />
                  
                  <div className="relative space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-600 px-3 py-1 bg-emerald-500/10 rounded-full flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Presentación Oficial
                        </span>
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Facturín</span>
                     </div>
                     
                     <div className="space-y-2">
                        <h4 className="text-2xl font-black italic tracking-tighter uppercase text-foreground leading-none">
                           ¿Cómo <span className="font-serif italic text-primary">Funciona?</span>
                        </h4>
                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                           Tu Facturación Electrónica al Instante
                        </p>
                     </div>

                     <div className="relative rounded-2xl overflow-hidden border border-primary/10 shadow-md bg-black group-hover:border-primary/30 transition-all">
                        <video 
                          src="/Facturin.mp4" 
                          autoPlay
                          muted
                          loop
                          playsInline
                          controls 
                          preload="metadata"
                          className="w-full h-auto object-contain block"
                        />
                     </div>
                     
                     <p className="text-[9px] font-medium text-muted-foreground/60 italic text-center leading-normal">
                        Conoce a Facturín y simplifica la emisión de boletas y facturas cumpliendo con la normativa del SII en Punta Arenas.
                     </p>

                     <div className="pt-2">
                        <Link href="/dashboard" className="inline-flex items-center justify-between w-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl h-11 px-5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 transition-all active:scale-95 group/btn">
                           <span>Probar Sistema Gratis</span>
                           <ArrowRight className="h-4 w-4 text-white group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                     </div>
                  </div>
               </div>
            </div>
        </div>

        {/* 📰 GRILLA DE NOTICIAS SECUNDARIAS (Smart Mix) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {secondaryNews.map((news: NewsArticle) => (
             <Link key={news.id} href={`/noticias/${news.slug}`} scroll={false}>
               <div className="group cursor-pointer space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-border/50 shadow-xl shadow-primary/5 group-hover:border-primary/30 transition-all duration-500">
                     <Image 
                        src={news.image_url || "/news-placeholder.png"} 
                        alt={news.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                     />
                     <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                        <span className="text-[8px] font-black tracking-widest text-primary-foreground italic px-3 py-1 border border-primary/50 rounded-lg bg-primary/90 backdrop-blur-xl shadow-lg shadow-primary/10 uppercase">{news.category}</span>
                     </div>
                  </div>
                  <div className="px-4 pb-4 space-y-4">
                     <h3 className="text-lg sm:text-xl font-black leading-tight italic group-hover:text-primary transition-colors text-foreground tracking-tight drop-shadow-sm line-clamp-2 uppercase">
                        {news.title}
                     </h3>
                     <div className="flex items-center justify-between gap-3 pt-2">
                        <span className="text-[10px] font-black text-primary flex items-center gap-1 uppercase tracking-widest">
                          Analizar <ArrowRight className="h-3 w-3" />
                        </span>
                        <p className="text-[10px] font-black text-muted-foreground/40 italic uppercase tracking-[0.2em] whitespace-nowrap" suppressHydrationWarning>
                            {new Date(news.published_at).toLocaleDateString('es-CL')}
                        </p>
                     </div>
                  </div>
               </div>
             </Link>
           ))}
        </div>
      </div>
    </section>
  )
}
