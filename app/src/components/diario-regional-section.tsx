"use client";

import { useState } from "react";
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
  ArrowDownRight,
  X
} from "lucide-react";
import { HeroBentoGrid } from "@/components/hero-bento";
import { GlobalMarketPanel } from "@/components/global-market-panel";
import { MacroCalendarWidget } from "@/components/macro-calendar-widget";
import { PublicSalaryCalculator } from "@/components/public-salary-calculator";

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
export function newsRelevanceScoring(news: NewsArticle[]): { hero: NewsArticle | null; secondary: NewsArticle[] } {
  if (news.length === 0) return { hero: null, secondary: [] };

  // Estabilizar scoring sin Date.now() para evitar discrepancias de hidratación SSR/cliente.
  // En su lugar, usamos el orden relativo de published_at para puntuar la frescura.
  const sortedByDate = [...news].sort((a, b) => 
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const scoredNews = news.map(article => {
    let score = 0;
    const cat = article.category?.toUpperCase() || "";

    if (cat.includes("SII") || cat.includes("LEGAL")) score += 100;
    else if (cat.includes("FINANZAS")) score += 90;
    else if (cat.includes("ECONOMÍA")) score += 80;
    else if (cat.includes("INVERSIONES")) score += 70;
    else if (cat.includes("MAGALLANES") || cat.includes("ACTUAL")) score += 40;
    else score += 10;

    // Puntuar frescura por posición relativa en vez de Date.now()
    const recencyIndex = sortedByDate.findIndex(n => n.id === article.id);
    if (recencyIndex === 0) score += 40;
    else if (recencyIndex <= 2) score += 30;
    else if (recencyIndex <= 5) score += 20;

    if (article.is_featured) score += 1000;

    return { ...article, finalScore: score };
  });

  const ranked = [...scoredNews].sort((a, b) => (b as any).finalScore - (a as any).finalScore);
  const hero = ranked[0] || null;
  const secondary = ranked.slice(1, 7);

  return { hero, secondary };
}

/** 🧠 IA Inferencia: Análisis de Impacto y Recomendación PYME */
function generateNewsAnalysis(article: NewsArticle) {
  const category = article.category?.toUpperCase() || "";
  const title = article.title?.toUpperCase() || "";

  let impact = "Esta noticia o evento regional afecta de forma indirecta la planificación financiera y los costos operativos de las PYMEs locales en la Patagonia.";
  let advice = "Recomendamos evaluar el impacto presupuestario de este hecho económico y mantener el control de gastos a través de la conciliación automática.";

  if (category.includes("SII") || category.includes("LEGAL")) {
    impact = "Esta normativa legal o tributaria afecta directamente la estructura de costos operativos de las PYMEs en Magallanes. Las modificaciones en derechos laborales o regulaciones del SII exigen un ajuste inmediato en la planificación mensual de egresos para evitar contingencias y multas.";
    advice = "Recomendamos agendar una auditoría interna con tu contador para revisar los contratos de trabajo vigentes y la parametrización de haberes en tu software de remuneraciones. Asegúrate de registrar las modificaciones en el Libro de Remuneraciones Electrónico (LRE) antes del plazo legal.";
  } else if (category.includes("ECONOMÍA") || category.includes("FINANZAS") || category.includes("INVERSIONES")) {
    impact = "Los ajustes presupuestarios o movimientos macroeconómicos regionales influyen en el flujo de caja local y en el poder adquisitivo de los consumidores en Punta Arenas. Un recorte o redistribución de fondos públicos puede contraer la demanda en ciertos sectores de servicios y comercio.";
    advice = "Es aconsejable revisar y proyectar un escenario conservador de flujo de caja para los próximos 3 meses. Evita adquirir deudas a tasa variable y prioriza la optimización de gastos operativos fijos. Utiliza herramientas de conciliación automática para mantener un control exhaustivo del presupuesto diario.";
  } else {
    impact = "Los eventos de actualidad y el desarrollo urbano/turístico en comunas como Punta Arenas o Timaukel tienen un impacto indirecto pero positivo en el dinamismo comercial. Atraen flujo de personas y fomentan encadenamientos productivos locales (transporte, alimentación, servicios).";
    advice = "Monitorea las oportunidades de licitación o alianzas comerciales que surjan de estos proyectos de desarrollo. Mantén tu facturación electrónica al día mediante Facturín para responder de inmediato ante cotizaciones y nuevos clientes locales.";
  }

  // Personalizaciones finas basadas en palabras clave específicas de Magallanes
  if (title.includes("AEROPUERTO")) {
    impact = "La ampliación de la infraestructura del aeropuerto de Punta Arenas aumentará significativamente la capacidad de pasajeros diarios. Esto beneficiará de manera directa al turismo, la hotelería, el transporte local y los servicios gastronómicos de la provincia.";
    advice = "Las PYMEs turísticas y de transportes deben prepararse digitalizando sus métodos de cobro y facturación. Asegúrate de emitir facturas y boletas electrónicas al instante y en regla ante el SII para captar el flujo de clientes institucionales y corporativos que visitarán la zona.";
  } else if (title.includes("CONTRIBUCIONES")) {
    impact = "Eximir contribuciones representa un alivio fiscal directo para las familias y PYMEs propietarias de inmuebles en la región, liberando liquidez que puede ser reinyectada en consumo o capital de trabajo.";
    advice = "Si tu propiedad califica para la exención, registra contablemente este menor gasto proyectado en tus activos fijos y actualiza tu balance general para reflejar con exactitud la valorización de tus bienes raíces.";
  } else if (title.includes("CULTURA")) {
    impact = "El recorte presupuestario a la cultura limita la contratación de servicios locales de producción, diseño, catering y gestión de eventos artísticos en Punta Arenas, afectando la liquidez de emprendedores creativos.";
    advice = "Los profesionales de la industria creativa y cultural deben buscar vías de financiamiento mixto (privado/corporativo) y revisar minuciosamente su planificación tributaria para optimizar sus costos fijos y mantener la viabilidad durante este periodo de menor gasto público.";
  }

  return { impact, advice };
}

export function DiarioRegionalSection({ initialNews, indicators = [] }: DiarioRegionalSectionProps) {
  const [analyzedNews, setAnalyzedNews] = useState<NewsArticle | null>(null);
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
               <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.95] sm:leading-[0.9] italic text-foreground text-shadow-sm">
                 Diario <span className="text-primary italic font-serif">Punta Arenas</span> <br />
                 <span className="text-muted-foreground/30">& Financiero Regional.</span>
               </h2>
               <p className="text-muted-foreground font-medium italic text-sm sm:text-lg leading-relaxed max-w-lg">
                 Información estratégica para el contador chileno, con el balance perfecto entre economía regional y global.
               </p>
            </div>
             <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/calculadora" className="w-full sm:w-auto">
                  <Button className="w-full text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-xl hover:shadow-primary/20 rounded-2xl h-12 px-8 transition-all active:scale-95">
                    Calculadora Tributaria
                  </Button>
                </Link>
                <Link href="/noticias" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full text-xs font-black uppercase tracking-widest border-border text-muted-foreground hover:bg-muted rounded-2xl h-12 px-8 transition-all">
                    Hemeroteca Regional
                  </Button>
                </Link>
                <Link href="/contacto" className="w-full sm:w-auto">
                  <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest border border-dashed border-border text-muted-foreground hover:bg-muted rounded-2xl h-12 px-8 transition-all">
                    Anuncia
                  </Button>
                </Link>
             </div>
         </div>
         {/* Deduplicación: Obtener la noticia principal del Diario y excluirla del Bento Grid */}
        {(() => {
          const bentoNews = heroNews ? initialNews.filter((n: any) => n.id !== heroNews.id) : initialNews;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
               {/* 📰 COLUMNA IZQUIERDA: FLUJO DE NOTICIAS (Ancho: 3/12 en desktop) */}
               <div className="lg:col-span-3 space-y-6 order-2 lg:order-1 border-t lg:border-t-0 lg:border-r border-zinc-150 pt-8 lg:pt-0 lg:pr-6">
                 <div className="flex items-center gap-2 pb-3 border-b border-zinc-150">
                   <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary italic">Flujo de Noticias</span>
                   <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                   </span>
                 </div>
                 
                 <div className="space-y-6 divide-y divide-zinc-100">
                   {secondaryNews.map((news: NewsArticle, idx: number) => (
                     <div key={news.id} className={`pt-6 ${idx === 0 ? 'pt-0' : ''} group cursor-pointer space-y-3`}>
                       <Link href={`/noticias/${news.slug}`} scroll={false}>
                         <div className="space-y-3">
                           <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-md">
                             <img 
                                src={news.image_url || "/news-placeholder.png"} 
                                alt={news.title} 
                                className="object-cover transition-transform duration-500 group-hover:scale-105 w-full h-full absolute inset-0"
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                             <div className="absolute bottom-2 left-2">
                                <span className="text-[7px] font-black tracking-widest text-primary-foreground italic px-2 py-0.5 border border-primary/50 rounded bg-primary/95 uppercase">{news.category}</span>
                             </div>
                           </div>
                           <div className="space-y-2">
                             <h4 className="text-xs font-black uppercase italic leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {news.title}
                             </h4>
                             <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/60">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setAnalyzedNews(news);
                                  }}
                                  className="text-primary font-black uppercase tracking-wider flex items-center gap-1 hover:text-primary/80 transition-colors cursor-pointer focus:outline-none"
                                >
                                  Analizar <ArrowRight className="h-2.5 w-2.5" />
                                </button>
                                <span className="italic uppercase tracking-widest font-mono" suppressHydrationWarning>
                                   {new Date(news.published_at).toLocaleDateString('es-CL', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                                </span>
                             </div>
                           </div>
                         </div>
                       </Link>
                     </div>
                   ))}
                 </div>
               </div>

               {/* 🏆 COLUMNA CENTRAL: NOTICIA HERO & SLINGSHOT (Ancho: 6/12 en desktop) */}
               <div className="lg:col-span-6 space-y-8 order-1 lg:order-2 px-0 lg:px-4">
                  {/* Noticia Principal (Hero - Estilo Patagonia Times) */}
                  {heroNews ? (
                    <Link href={`/noticias/${heroNews.slug}`} scroll={false}>
                      <div className="group cursor-pointer space-y-4">
                        <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl hover:border-primary/40 transition-all duration-700">
                           <img 
                              src={heroNews.image_url || "/news-placeholder.png"} 
                              alt={heroNews.title} 
                              className="object-cover transition-transform duration-1000 group-hover:scale-[1.03] w-full h-full absolute inset-0"
                            />
                            
                           {/* Top Badges (Insignias Superiores) */}
                           <div className="absolute inset-x-0 top-0 p-3 sm:p-5 flex justify-between items-center z-10">
                              <div className="bg-rose-600/95 backdrop-blur-xl px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-rose-400/30 shadow-lg flex items-center gap-1.5">
                                 <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                 <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white">Última Hora</span>
                              </div>
                              <div className="bg-white/95 backdrop-blur-xl px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-primary/20 shadow-lg flex items-center gap-1.5">
                                 <BadgeCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                                 <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-primary">Verificado</span>
                              </div>
                           </div>

                           {/* Gradient Background */}
                           <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

                           {/* Bottom Content Container */}
                           <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 space-y-2 sm:space-y-3 z-10">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] sm:text-[9px] font-black tracking-widest text-primary-foreground italic px-2.5 py-0.5 sm:px-3 sm:py-1 border border-primary/50 rounded-lg bg-primary/95 backdrop-blur-xl shadow-lg uppercase">{heroNews.category}</span>
                                <span className="text-[8px] sm:text-[9px] font-black tracking-widest text-white/90 italic px-2.5 py-0.5 sm:px-3 sm:py-1 border border-white/20 rounded-lg bg-black/50 backdrop-blur-xl uppercase">3 min lectura</span>
                              </div>
                              <h3 className="text-base sm:text-2xl md:text-3xl font-black leading-tight italic drop-shadow-2xl text-white tracking-tighter uppercase line-clamp-2 sm:line-clamp-3">
                                 {heroNews.title}
                              </h3>
                              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-black text-white/80 uppercase tracking-widest italic pt-0.5" suppressHydrationWarning>
                                 <span>{heroNews.source_name || "Prensa Magallanes"}</span>
                                 <span>{new Date(heroNews.published_at).toLocaleDateString('es-CL', {day: '2-digit', month: 'long', year: 'numeric'})}</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl bg-muted/10 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 p-6 sm:p-12 text-center border-dashed">
                       <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center animate-pulse">
                          <Globe className="h-8 w-8 text-primary/20" />
                       </div>
                       <h3 className="text-xl font-black tracking-tighter uppercase italic text-muted-foreground/40">Sintonizando Central de Noticias</h3>
                       <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-widest max-w-xs">
                          Verificando fuentes regionales. La integridad de la información es nuestro activo más valioso.
                       </p>
                    </div>
                  )}

                  {/* Panel de Análisis de Mercado (Slingshot) */}
                  {/* <GlobalMarketPanel indicators={indicators} /> */}
               </div>

               {/* 🏛️ COLUMNA DERECHA: WIDGETS & PUBLICIDAD (Ancho: 3/12 en desktop) */}
               <div className="lg:col-span-3 space-y-8 order-3 border-t lg:border-t-0 lg:border-l border-zinc-150 pt-8 lg:pt-0 lg:pl-6">
                  {/* Clima e Indicadores en Vivo */}
                  <HeroBentoGrid indicators={indicators} news={bentoNews} />

                  {/* Calendario Macro */}
                  <MacroCalendarWidget />

                  {/* Ads Patrocinados & Facturín */}
                  <div className="space-y-6">
                     {/* Video de Facturín */}
                     <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-50 to-white border border-primary/15 space-y-4 relative overflow-hidden group shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="relative space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600 px-2 py-0.5 bg-emerald-500/10 rounded-full">
                                  Facturín
                              </span>
                              <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-widest">SII / Legal</span>
                           </div>
                           <h5 className="text-sm font-black italic tracking-tighter uppercase text-foreground leading-tight">
                              Facturación <span className="font-serif italic text-primary">Express</span>
                           </h5>
                           <div className="relative rounded-xl overflow-hidden border border-primary/10 shadow bg-black w-full">
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
                           <p className="text-[8.5px] font-semibold text-muted-foreground/60 italic text-center leading-normal">
                              Emisión de boletas y facturas al instante bajo normativa del SII.
                           </p>
                           <Link href="/dashboard" className="inline-flex items-center justify-between w-full bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest rounded-lg h-9 px-4 hover:bg-emerald-700 transition-all active:scale-95 group/btn">
                              <span>Probar Gratis</span>
                              <ArrowRight className="h-3.5 w-3.5 text-white group-hover/btn:translate-x-0.5 transition-transform" />
                           </Link>
                        </div>
                     </div>

                     {/* Ad 1: Zona Franca */}
                     <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100/50 border border-zinc-200/60 shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-500" />
                        <div className="relative space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded">
                                 Alianza Comercial
                              </span>
                              <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-widest">Patrocinado</span>
                           </div>
                           <h5 className="text-sm font-black italic tracking-tighter uppercase text-foreground leading-tight">
                              Zona Franca <br/><span className="text-primary font-serif">Punta Arenas</span>
                           </h5>
                           <p className="text-[9.5px] font-semibold text-muted-foreground/70 leading-relaxed line-clamp-2">
                              El polo comercial libre de impuestos más grande de la Patagonia. Encuentra tecnología y retail.
                           </p>
                           <Link href="/contacto" className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-primary pt-2 hover:underline">
                              <span>Ver Catálogo</span>
                              <ArrowUpRight className="h-3 w-3" />
                           </Link>
                        </div>
                     </div>

                     {/* Ad 2: Cerveza Austral */}
                     <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100/50 border border-zinc-200/60 shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-500" />
                        <div className="relative space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded">
                                 Gastronomía Local
                              </span>
                              <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-widest">Patrocinado</span>
                           </div>
                           <h5 className="text-sm font-black italic tracking-tighter uppercase text-foreground leading-tight">
                              Cerveza Austral <br/><span className="text-emerald-600 font-serif">Origen Patagónico</span>
                           </h5>
                           <p className="text-[9.5px] font-semibold text-muted-foreground/70 leading-relaxed line-clamp-2">
                              Elaborada con las aguas más puras del fin del mundo desde 1896.
                           </p>
                           <Link href="/contacto" className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-emerald-600 pt-2 hover:underline">
                              <span>Conocer Más</span>
                              <ArrowUpRight className="h-3 w-3" />
                           </Link>
                        </div>
                     </div>

                     {/* Ad 3: Austral Inversiones */}
                     <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-4 relative overflow-hidden group shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all duration-500" />
                        <div className="relative space-y-2.5">
                           <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                                 Publicidad
                              </span>
                              <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-widest">Patrocinado</span>
                           </div>
                           <h5 className="text-sm font-black italic tracking-tighter uppercase text-foreground leading-tight">
                              Austral <span className="font-serif italic text-primary">Inversiones</span>
                           </h5>
                           <p className="text-[9.5px] font-semibold text-muted-foreground/70 leading-relaxed italic">
                              "Optimizamos la gestión patrimonial y tributaria en Magallanes."
                           </p>
                       <Link href="/contacto" className="inline-flex items-center justify-between w-full bg-primary text-primary-foreground font-black text-[9px] uppercase tracking-widest rounded-lg h-8 px-4 hover:shadow-md transition-all">
                              <span>Consultar</span>
                              <ArrowUpRight className="h-3 w-3 text-primary-foreground" />
                           </Link>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          );
        })()}

        {/* Sección de Ventas Premium del Software ContaPyme */}
        <div className="mt-20 py-20 border-t border-zinc-150 relative overflow-hidden rounded-[3.5rem] bg-gradient-to-tr from-slate-50 via-white to-sky-500/[0.02] border border-neutral-200/60 text-slate-850 px-8 md:px-16 shadow-[0_30px_80px_rgba(30,58,138,0.02)]">
          {/* Auroras de fondo muy suaves */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/5 to-sky-500/[0.02] rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-600/[0.02] to-primary/5 rounded-full blur-[140px] pointer-events-none" />
          
          <div className="relative z-10 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Plataforma Empresarial ContaPyme</span>
              <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
                Gestión Contable & Nómina <br />
                <span className="text-primary italic font-serif">Optimizada para Magallanes</span>
              </h2>
              <p className="text-slate-500 font-medium italic text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
                Software contable integral diseñado para normativas del SII en Chile, bonificación a la contratación DL 889, exenciones de Zona Franca y gestión diaria de flujo de caja.
              </p>
            </div>

            {/* Grilla Bento de Características */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              
              {/* Tarjeta 1: Facturación */}
              <div className="p-8 rounded-[2rem] bg-white/80 border border-neutral-200/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 space-y-4 group">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  <Landmark className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-black italic uppercase tracking-tight text-slate-800">Facturación SII & DTE</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Emisión instantánea de boletas, facturas y guías electrónicas sincronizadas directamente con el SII y conciliación bancaria automática.
                </p>
              </div>

              {/* Tarjeta 2: Remuneraciones */}
              <div className="p-8 rounded-[2rem] bg-white/80 border border-neutral-200/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 space-y-4 group">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-black italic uppercase tracking-tight text-slate-800">Nómina & Libro LRE DT</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Liquidaciones con firma digital, feriado legal de 20 días en Magallanes y exportación directa al Libro de Remuneraciones Electrónico.
                </p>
              </div>

              {/* Tarjeta 3: Conciliación */}
              <div className="p-8 rounded-[2rem] bg-white/80 border border-neutral-200/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 space-y-4 group">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-black italic uppercase tracking-tight text-slate-800">Beneficios DL 889 & Zona Franca</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Cálculo de bonificación a la contratación DL 889, exenciones tributarias de Zona Franca y auditoría comparativa de ahorro fiscal.
                </p>
              </div>

            </div>

            {/* Botón de Acción Principal */}
            <div className="text-center pt-4">
              <Link href="/login" className="inline-block">
                <Button size="lg" className="inline-flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-widest h-12 sm:h-14 px-8 sm:px-12 rounded-full bg-primary text-primary-foreground hover:shadow-2xl hover:shadow-primary/30 transition-all whitespace-nowrap group">
                  Iniciar Prueba Gratis de 14 Días <ArrowRight className="ml-2.5 h-4 w-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Auditoría de Impacto IA (Glassmorphic) */}
      {analyzedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl border border-white/40 rounded-[2.5rem] w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 relative">
            
            {/* Botón cerrar */}
            <button 
              onClick={() => setAnalyzedNews(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Cabecera del Análisis */}
            <div className="space-y-3">
              <span className="text-[8px] font-black tracking-widest text-primary-foreground italic px-3 py-1 border border-primary/50 rounded bg-primary/95 uppercase inline-block">
                {analyzedNews.category}
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase leading-tight italic text-foreground tracking-tight pr-8">
                {analyzedNews.title}
              </h3>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] italic">
                Cruce de Impacto Inteligente — ContaPyme PUQ
              </p>
            </div>

            {/* Contenido Analítico */}
            <div className="space-y-5 divide-y divide-zinc-150 pt-2">
              
              {/* Sección 1: Impacto local */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 pt-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 1. El Impacto en Magallanes (IA)
                </h4>
                <p className="text-xs font-semibold text-zinc-700 leading-relaxed text-justify italic">
                  "{generateNewsAnalysis(analyzedNews).impact}"
                </p>
              </div>

              {/* Sección 2: Recomendaciones */}
              <div className="space-y-2 pt-4">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> 2. Recomendación Contable / Legal
                </h4>
                <p className="text-xs font-semibold text-zinc-700 leading-relaxed text-justify italic">
                  "{generateNewsAnalysis(analyzedNews).advice}"
                </p>
              </div>

            </div>

            {/* Acciones */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link href={`/noticias/${analyzedNews.slug}`} scroll={false} className="flex-1">
                <Button 
                  onClick={() => setAnalyzedNews(null)}
                  className="w-full text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-lg rounded-xl h-11"
                >
                  Leer Noticia Completa
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => setAnalyzedNews(null)}
                className="text-xs font-black uppercase tracking-widest border-zinc-200 text-zinc-500 hover:bg-zinc-100 rounded-xl h-11 px-6"
              >
                Cerrar
              </Button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
