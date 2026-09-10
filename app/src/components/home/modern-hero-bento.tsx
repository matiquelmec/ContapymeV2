"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BadgeCheck, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  Sparkles, 
  RefreshCw,
  Clock,
  Radio
} from "lucide-react";
import { AustralWeatherWidget } from "./austral-weather-widget";
import { QuickSalarySlider } from "./quick-salary-slider";
import { createClient } from "@/lib/supabase/client";
import { syncAllDataAction } from "@/actions/indicators";
import { toast } from "sonner";
import type { Indicator } from "@/lib/types/dashboard";

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

interface ModernHeroBentoProps {
  heroNews: NewsArticle | null;
  indicators: Indicator[];
  onAnalyzeNews?: (article: NewsArticle) => void;
}

export function ModernHeroBento({ heroNews, indicators = [], onAnalyzeNews }: ModernHeroBentoProps) {
  const [liveIndicators, setLiveIndicators] = useState<Indicator[]>(indicators);
  const [updatedCodes, setUpdatedCodes] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setLiveIndicators(indicators);
  }, [indicators]);

  // Suscribirse a Supabase Realtime para cambios en los indicadores
  useEffect(() => {
    let channel: any;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("modern_bento_indicators")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "economic_indicators",
          },
          (payload: any) => {
            const newRecord = payload.new as Indicator;
            if (newRecord && newRecord.codigo) {
              setLiveIndicators((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((i) => i.codigo === newRecord.codigo);
                if (idx !== -1) {
                  updated[idx] = { ...updated[idx], ...newRecord };
                } else {
                  updated.push(newRecord);
                }
                return updated;
              });

              setUpdatedCodes((prev) => ({ ...prev, [newRecord.codigo]: true }));
              setTimeout(() => {
                setUpdatedCodes((prev) => ({ ...prev, [newRecord.codigo]: false }));
              }, 2500);
            }
          }
        );
      channel.subscribe();
    } catch (err) {
      console.error("Error al suscribir indicators a Realtime:", err);
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

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    const toastId = toast.loading("Actualizando indicadores económicos en vivo...");
    try {
      const res = await syncAllDataAction();
      if (res.success) {
        toast.success("Indicadores económicos actualizados", { id: toastId });
      } else {
        toast.error("Actualización parcial", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const getIndicatorVal = (code: string) => {
    const ind = liveIndicators.find((i) => i.codigo === code);
    if (!ind) return "---";
    return Number(ind.valor).toLocaleString("es-CL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="space-y-8">
      {/* Grilla Principal Bento 2.0 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 🏆 COLUMNA HERO (8 de 12 en Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          {heroNews ? (
            <div className="group relative h-full min-h-[420px] sm:min-h-[500px] rounded-[2.5rem] overflow-hidden border border-border/60 shadow-2xl hover:border-primary/40 transition-all duration-700 flex flex-col justify-between p-6 sm:p-10">
              {/* Imagen de Fondo de Alta Definición */}
              <div className="absolute inset-0 z-0">
                <img
                  src={heroNews.image_url || "/news-placeholder.png"}
                  alt={heroNews.title}
                  className="object-cover transition-transform duration-1000 group-hover:scale-[1.04] w-full h-full absolute inset-0"
                />
                {/* Gradiente Cinematográfico Oscuro */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/65 to-zinc-950/30" />
              </div>

              {/* Insignias Superiores */}
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="bg-rose-600/95 backdrop-blur-xl px-3 py-1 rounded-full border border-rose-400/30 shadow-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Última Hora</span>
                  </div>
                  <div className="bg-white/95 backdrop-blur-xl px-3 py-1 rounded-full border border-primary/20 shadow-lg flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Verificado</span>
                  </div>
                </div>

                <div className="bg-black/50 backdrop-blur-xl px-3 py-1 rounded-full border border-white/20 text-white/90 text-[9px] font-black tracking-widest uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3 text-sky-400" />
                  <span>3 min lectura</span>
                </div>
              </div>

              {/* Contenido Inferior del Hero */}
              <div className="relative z-10 space-y-4 pt-20">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black tracking-widest text-primary-foreground italic px-3 py-1 border border-primary/50 rounded-lg bg-primary/95 backdrop-blur-xl shadow-lg uppercase">
                    {heroNews.category}
                  </span>
                  <span className="text-[9px] font-bold tracking-widest text-white/70 uppercase">
                    {heroNews.source_name || "Prensa Magallanes"}
                  </span>
                </div>

                <Link href={`/noticias/${heroNews.slug}`} scroll={false}>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-[1.05] italic drop-shadow-2xl text-white tracking-tighter uppercase group-hover:text-primary-foreground/90 transition-colors">
                    {heroNews.title}
                  </h3>
                </Link>

                <p className="text-xs sm:text-sm text-white/80 font-medium leading-relaxed line-clamp-2 max-w-2xl">
                  {heroNews.summary || "Accede al análisis completo de impacto económico y legal para las empresas de la Patagonia."}
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/15">
                  <span className="text-[10px] font-black text-white/70 uppercase tracking-widest italic" suppressHydrationWarning>
                    {new Date(heroNews.published_at).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>

                  <div className="flex items-center gap-3">
                    {onAnalyzeNews && (
                      <button
                        onClick={() => onAnalyzeNews(heroNews)}
                        className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/25 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 text-amber-300" />
                        <span>Impacto Pyme (IA)</span>
                      </button>
                    )}

                    <Link
                      href={`/noticias/${heroNews.slug}`}
                      scroll={false}
                      className="text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-lg"
                    >
                      <span>Leer Noticia</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] rounded-[2.5rem] bg-zinc-100 animate-pulse" />
          )}
        </div>

        {/* 🧭 COLUMNA LATERAL INTERACTIVA (4-5 de 12 en Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 justify-between">
          {/* Widget 1: Clima Austral Interactivo */}
          <AustralWeatherWidget />

          {/* Widget 2: Simulador Express de Sueldos */}
          <QuickSalarySlider />
        </div>
      </div>

      {/* 📊 BARRA DE PULSO DE MERCADO EN TIEMPO REAL */}
      <div className="p-4 sm:p-5 rounded-[2rem] bg-zinc-950 text-white border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400">
                Market Pulse Magallanes
              </span>
              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                Realtime
              </span>
            </div>
            <p className="text-xs font-black text-white/90 italic">
              Indicadores Económicos Oficiales SII & Banco Central
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-black">
          <div className={`transition-all duration-500 px-2 py-1 rounded-lg ${updatedCodes["uf"] ? "bg-emerald-500/20 text-emerald-400 scale-105" : ""}`}>
            <span className="text-white/50 text-[10px] mr-1.5 uppercase">UF:</span>
            <span className="text-white tabular-nums font-mono">${getIndicatorVal("uf")}</span>
          </div>

          <div className={`transition-all duration-500 px-2 py-1 rounded-lg ${updatedCodes["dolar"] ? "bg-emerald-500/20 text-emerald-400 scale-105" : ""}`}>
            <span className="text-white/50 text-[10px] mr-1.5 uppercase">Dólar:</span>
            <span className="text-white tabular-nums font-mono">${getIndicatorVal("dolar")}</span>
          </div>

          <div className={`transition-all duration-500 px-2 py-1 rounded-lg ${updatedCodes["utm"] ? "bg-emerald-500/20 text-emerald-400 scale-105" : ""}`}>
            <span className="text-white/50 text-[10px] mr-1.5 uppercase">UTM:</span>
            <span className="text-white tabular-nums font-mono">${getIndicatorVal("utm")}</span>
          </div>

          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all disabled:opacity-50"
            title="Sincronizar indicadores ahora"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
