"use client";

import { useState, useMemo, useEffect } from "react";
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
  X,
  Filter
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ModernHeroBento } from "@/components/home/modern-hero-bento";
import { StickyCategoryDock } from "@/components/home/sticky-category-dock";
import { MacroRadarRealtime } from "@/components/home/macro-radar-realtime";
import { PublicSalaryCalculator } from "@/components/public-salary-calculator";
import { NewsCardSkeleton, SmallNewsCardSkeleton } from "@/components/skeleton-loader";
import { AdBannerSlot } from "@/components/ads/ad-banner-slot";

/** 📰 Tipo de Noticia Profesional (Contapymepuq) */
export interface NewsArticle {
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

export interface DiarioRegionalSectionProps {
  initialNews: NewsArticle[];
  indicators?: any[];
}

/** 🧬 Motor Editorial Experto: Scoring de Relevancia Dinámica y Frescura en Tiempo Real */
export function newsRelevanceScoring(news: NewsArticle[]): { hero: NewsArticle | null; secondary: NewsArticle[] } {
  if (news.length === 0) return { hero: null, secondary: [] };

  // 1. Orden cronológico estricto de más reciente a más antigua
  const sortedByDate = [...news].sort((a, b) => 
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  // 2. Selección de Noticia Hero (evalúa el pool de las 10 noticias más recientes)
  const recentPool = sortedByDate.slice(0, 10);
  const scoredRecent = recentPool.map(article => {
    let score = 0;
    const cat = article.category?.toUpperCase() || "";

    if (cat.includes("SII") || cat.includes("LEGAL")) score += 50;
    else if (cat.includes("FINANZAS")) score += 40;
    else if (cat.includes("ECONOMÍA")) score += 35;
    else if (cat.includes("INVERSIONES")) score += 30;
    else score += 10;

    if (article.is_featured) score += 100;

    return { article, score };
  });

  scoredRecent.sort((a, b) => b.score - a.score);
  const hero = scoredRecent[0]?.article || sortedByDate[0] || null;

  // 3. Flujo de Noticias Secundarias (Las 8 noticias más recientes del día, excluyendo la Hero)
  const secondary = sortedByDate.filter(n => !hero || n.id !== hero.id).slice(0, 8);

  return { hero, secondary };
}

/** 🧠 IA Inferencia: Análisis de Impacto y Recomendación PYME */
export function generateNewsAnalysis(article: NewsArticle) {
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

const CLIENT_UNIQUE_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1280&fit=crop&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1280&fit=crop&q=80"
];

/** 🛡️ Filtro de Cero Imágenes Duplicadas en Tiempo de Renderizado */
export function ensureUniqueNewsImages(hero: NewsArticle | null, secondary: NewsArticle[]): { hero: NewsArticle | null; secondary: NewsArticle[] } {
  const seenImages = new Set<string>();
  
  const cleanHero = hero ? { ...hero } : null;
  if (cleanHero && cleanHero.image_url) {
    seenImages.add(cleanHero.image_url);
  }

  const cleanSecondary = secondary.map((item, idx) => {
    let currentImg = item.image_url;
    
    if (!currentImg || seenImages.has(currentImg) || currentImg === "/news-placeholder.png") {
      const fallback = CLIENT_UNIQUE_FALLBACK_IMAGES.find(img => !seenImages.has(img)) 
        || CLIENT_UNIQUE_FALLBACK_IMAGES[idx % CLIENT_UNIQUE_FALLBACK_IMAGES.length];
      currentImg = fallback;
    }
    
    seenImages.add(currentImg);
    return { ...item, image_url: currentImg };
  });

  return { hero: cleanHero, secondary: cleanSecondary };
}

export function DiarioRegionalSection({ initialNews, indicators = [] }: DiarioRegionalSectionProps) {
  const [liveNews, setLiveNews] = useState<NewsArticle[]>(initialNews);
  const [analyzedNews, setAnalyzedNews] = useState<NewsArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");

  useEffect(() => {
    setLiveNews(initialNews);
  }, [initialNews]);

  // 🔄 Suscripción a Supabase Realtime para noticias en vivo
  useEffect(() => {
    let channel: any;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("regional_news_realtime_stream")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "regional_news",
          },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              const newArticle = payload.new as NewsArticle;
              if (newArticle && newArticle.id) {
                setLiveNews((prev) => {
                  if (prev.some((n) => n.id === newArticle.id)) return prev;
                  return [newArticle, ...prev];
                });
              }
            } else if (payload.eventType === "DELETE") {
              const deletedId = payload.old?.id;
              if (deletedId) {
                setLiveNews((prev) => prev.filter((n) => n.id !== deletedId));
              }
            } else if (payload.eventType === "UPDATE") {
              const updatedArticle = payload.new as NewsArticle;
              if (updatedArticle && updatedArticle.id) {
                setLiveNews((prev) =>
                  prev.map((n) => (n.id === updatedArticle.id ? updatedArticle : n))
                );
              }
            }
          }
        );
      channel.subscribe();
    } catch (err) {
      console.error("Error al suscribir noticias a Realtime:", err);
    }

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const rawScoring = newsRelevanceScoring(liveNews);
  const { hero: heroNews, secondary: secondaryNews } = ensureUniqueNewsImages(rawScoring.hero, rawScoring.secondary);

  // Filtro reactivo de noticias secundarias por categoría
  const filteredSecondaryNews = useMemo(() => {
    if (selectedCategory === "TODAS") return secondaryNews;

    const filtered = secondaryNews.filter((n) => {
      const cat = n.category?.toUpperCase() || "";
      if (selectedCategory === "ECONOMÍA") {
        return cat.includes("ECONOM") || cat.includes("FINANZ") || cat.includes("INVER");
      }
      if (selectedCategory === "SII") {
        return cat.includes("SII") || cat.includes("LEGAL") || cat.includes("TRIBUTAR");
      }
      return cat.includes(selectedCategory);
    });

    // Fallback: si no hay noticias en esa categoría específica, muestra las secundarias normales
    return filtered.length > 0 ? filtered : secondaryNews;
  }, [secondaryNews, selectedCategory]);

  return (
    <section id="diario" className="py-16 bg-white text-foreground overflow-hidden relative scroll-mt-32" suppressHydrationWarning>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")'}} suppressHydrationWarning />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" suppressHydrationWarning />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10 space-y-12" suppressHydrationWarning>
        {/* Cabecera Principal */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-8" suppressHydrationWarning>
            <div className="space-y-4 relative">
               <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-primary/80 italic">
                 <span className="w-8 h-[1px] bg-primary/50" />
                 <Landmark className="h-3 w-3 animate-pulse text-primary" /> Diario & Portal Económico de la Patagonia
               </div>
               <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.95] sm:leading-[0.9] italic text-foreground">
                 Diario Regional <br />
                 <span className="text-primary italic font-serif">de Magallanes</span> <span className="text-muted-foreground/40">& Finanzas Australes.</span>
               </h2>
               <p className="text-muted-foreground font-medium italic text-xs sm:text-base leading-relaxed max-w-xl">
                 Información estratégica para emprendedores, empresas y la comunidad de Magallanes. El pulso diario de nuestra economía, inversiones regionales y actualidad global.
               </p>
            </div>
             <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <Link href="/calculadora" className="flex-1 sm:flex-initial">
                  <Button className="w-full text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-xl hover:shadow-primary/20 rounded-2xl h-11 px-6 transition-all active:scale-95">
                    Calculadora
                  </Button>
                </Link>
                <Link href="/empleos" className="flex-1 sm:flex-initial">
                  <Button variant="outline" className="w-full text-xs font-black uppercase tracking-widest border-primary/30 text-primary hover:bg-primary/10 rounded-2xl h-11 px-6 transition-all">
                    Empleos
                  </Button>
                </Link>
                <Link href="/noticias" className="flex-1 sm:flex-initial">
                  <Button variant="outline" className="w-full text-xs font-black uppercase tracking-widest border-border text-muted-foreground hover:bg-muted rounded-2xl h-11 px-6 transition-all">
                    Hemeroteca
                  </Button>
                </Link>
                <Link href="/anunciar" className="flex-1 sm:flex-initial">
                  <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest border border-dashed border-border text-muted-foreground hover:bg-muted rounded-2xl h-11 px-6 transition-all">
                    Anuncia
                  </Button>
                </Link>
             </div>
        </div>

        {/* 🌟 NUEVO CENTRO DE CONTROL: BENTO GRID 2.0 MODULAR */}
        <ModernHeroBento 
          heroNews={heroNews} 
          indicators={indicators} 
          onAnalyzeNews={(article) => setAnalyzedNews(article)} 
        />

        {/* 📰 SECCIÓN EDITORIAL: FLUJO SECUNDARIO & WIDGETS LATERALES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          {/* Columna Izquierda / Central: Stream de Noticias Secundarias (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">
                  Flujo de Actualidad Regional
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              </div>

              {/* Filtros Rápidos en Portada */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {["TODAS", "ECONOMÍA", "SII"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarjetas Secundarias en Grilla 2x2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredSecondaryNews.map((news) => (
                <article
                  key={news.id}
                  className="group bg-zinc-50/60 dark:bg-zinc-900/40 rounded-3xl p-4 border border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-between space-y-3"
                >
                  <Link href={`/noticias/${news.slug}`} scroll={false} className="space-y-3 block">
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-border/40">
                      <img
                        src={news.image_url || "/news-placeholder.png"}
                        alt={news.title}
                        className="object-cover transition-transform duration-500 group-hover:scale-105 w-full h-full absolute inset-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2">
                        <span className="text-[8px] font-black tracking-widest text-white italic px-2.5 py-0.5 rounded bg-primary/95 uppercase">
                          {news.category}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-black uppercase italic leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {news.title}
                    </h4>
                  </Link>

                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground pt-2 border-t border-border/40">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAnalyzedNews(news);
                      }}
                      className="text-primary font-black uppercase tracking-wider flex items-center gap-1 hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      Analizar IA <ArrowRight className="h-3 w-3" />
                    </button>
                    <span className="font-mono text-[9px] uppercase tracking-wider" suppressHydrationWarning>
                      {new Date(news.published_at).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Radar Macroeconómico NVIDIA NIM, Video Facturín y Anuncios (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <MacroRadarRealtime indicators={indicators} />

            {/* Video de Facturín */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 border border-primary/20 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600 px-2.5 py-0.5 bg-emerald-500/10 rounded-full">
                  Facturín ERP
                </span>
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">SII Certificado</span>
              </div>
              <h5 className="text-sm font-black italic tracking-tighter uppercase text-foreground">
                Facturación <span className="font-serif italic text-primary">Express</span>
              </h5>
              <div className="relative rounded-2xl overflow-hidden border border-primary/10 shadow bg-black w-full">
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
              <p className="text-[10px] font-medium text-muted-foreground text-center">
                Emisión instantánea de DTE y boletas bajo normativa SII.
              </p>
              <Link href="/dashboard" className="inline-flex items-center justify-between w-full bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl h-10 px-4 hover:bg-emerald-700 transition-all">
                <span>Probar Gratis</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Banner Publicitario */}
            <AdBannerSlot position="news_sidebar" className="w-full" />
          </div>
        </div>

        {/* Sección de Software ContaPyme */}
        <div className="mt-16 py-16 rounded-[3rem] bg-gradient-to-tr from-slate-50 via-white to-sky-500/[0.03] border border-border/70 p-8 sm:p-12 shadow-sm space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Plataforma Empresarial ContaPyme</span>
            <h2 className="text-2xl sm:text-4xl font-black italic tracking-tighter uppercase text-foreground">
              Gestión Contable & Nómina <br />
              <span className="text-primary font-serif">Optimizada para Magallanes</span>
            </h2>
            <p className="text-muted-foreground font-medium text-xs sm:text-sm">
              Software contable integral con normativa chilena: bonificación DL 889, exenciones Zona Franca y conciliación automática.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-border/60 shadow-xs space-y-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Landmark className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-black uppercase italic text-foreground">Facturación SII & DTE</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Boletas y facturas sincronizadas con el SII y conciliación bancaria instantánea.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-border/60 shadow-xs space-y-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-black uppercase italic text-foreground">Nómina & Libro LRE</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Liquidaciones con firma digital, feriado austral de 20 días y reporte a la DT.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-border/60 shadow-xs space-y-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-black uppercase italic text-foreground">Beneficio DL 889</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Cálculo de bonificación a la contratación regional y exenciones de Zona Franca.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link href="/login">
              <Button size="lg" className="text-xs font-black uppercase tracking-widest h-12 px-8 rounded-full bg-primary text-primary-foreground hover:shadow-xl hover:shadow-primary/25 transition-all">
                Iniciar Prueba Gratis de 14 Días <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ⚓ DOCK FLOTANTE CONTEXTUAL CON SCROLL */}
      <StickyCategoryDock 
        activeCategory={selectedCategory} 
        onSelectCategory={(cat) => setSelectedCategory(cat)} 
      />

      {/* Modal de Análisis de Impacto IA */}
      {analyzedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-white/20 rounded-[2.5rem] w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setAnalyzedNews(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2">
              <span className="text-[8px] font-black tracking-widest text-primary-foreground italic px-2.5 py-0.5 rounded bg-primary uppercase inline-block">
                {analyzedNews.category}
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase leading-tight italic text-foreground tracking-tight pr-6">
                {analyzedNews.title}
              </h3>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">
                Análisis de Impacto Regional — ContaPyme PUQ
              </p>
            </div>

            <div className="space-y-4 divide-y divide-border/60 pt-1">
              <div className="space-y-1.5 pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 1. Impacto en Magallanes (IA)
                </h4>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed italic text-justify">
                  "{generateNewsAnalysis(analyzedNews).impact}"
                </p>
              </div>

              <div className="space-y-1.5 pt-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> 2. Recomendación Contable / Legal
                </h4>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed italic text-justify">
                  "{generateNewsAnalysis(analyzedNews).advice}"
                </p>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-3">
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
                className="text-xs font-black uppercase tracking-widest rounded-xl h-11 px-6"
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
