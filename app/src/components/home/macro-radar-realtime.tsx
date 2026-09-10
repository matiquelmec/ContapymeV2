"use client";

import { useState, useEffect } from "react";
import { 
  Radio, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  Landmark, 
  ExternalLink,
  Cpu,
  ArrowRight
} from "lucide-react";
import { generateNvidiaMacroAnalysisAction } from "@/actions/nvidia-macro";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface MacroRadarRealtimeProps {
  initialAnalysis?: string;
  indicators?: any[];
}

export function MacroRadarRealtime({ initialAnalysis, indicators = [] }: MacroRadarRealtimeProps) {
  const [liveIndicators, setLiveIndicators] = useState<any[]>(indicators);
  const [updatedCodes, setUpdatedCodes] = useState<Record<string, boolean>>({});
  const [analysis, setAnalysis] = useState<string>(
    initialAnalysis || 
    "El escenario cambiario y el nivel de tasas de interés condicionan las decisiones de inversión en la Patagonia. Una cotización estable del dólar beneficia a los importadores de la Zona Franca de Punta Arenas, mientras que los costos de energía y transporte marítimo dependen de la evolución del petróleo internacional."
  );
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("En vivo");

  useEffect(() => {
    setLiveIndicators(indicators);
  }, [indicators]);

  // Suscripción a Supabase Realtime para cotizaciones en vivo
  useEffect(() => {
    let channel: any;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("macro_radar_realtime_indicators")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "economic_indicators",
          },
          (payload: any) => {
            const newRecord = payload.new;
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
      console.error("Error al suscribir MacroRadar a Realtime:", err);
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

  const getInd = (code: string, fallback: string) => {
    const item = liveIndicators.find((i) => i.codigo === code);
    if (!item) return fallback;
    if (code === "libra_cobre") {
      return `US$ ${Number(item.valor).toFixed(2)}/lb`;
    }
    return `$${Number(item.valor).toLocaleString("es-CL")}`;
  };

  const handleRefreshAnalysis = async () => {
    setLoading(true);
    const toastId = toast.loading("Consultando a NVIDIA Nemotron NIM...");
    try {
      const res = await generateNvidiaMacroAnalysisAction(true);
      if (res.success && res.analysis) {
        setAnalysis(res.analysis);
        setLastUpdated(res.timestamp || "Recién actualizado");
        toast.success("Análisis macroeconómico actualizado por NVIDIA Nemotron", { id: toastId });
      } else {
        toast.error("No se pudo actualizar el análisis", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial del análisis neural
  useEffect(() => {
    if (!initialAnalysis) {
      generateNvidiaMacroAnalysisAction(false).then((res) => {
        if (res.success && res.analysis) {
          setAnalysis(res.analysis);
          if (res.timestamp) setLastUpdated(res.timestamp);
        }
      });
    }
  }, [initialAnalysis]);

  return (
    <div className="p-6 sm:p-7 rounded-[2.5rem] bg-white/80 dark:bg-zinc-900/80 border border-border/80 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.06)] hover:border-primary/40 transition-all duration-500 space-y-5 relative overflow-hidden">
      {/* Luz decorativa austral */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera del Radar */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-3.5 w-3.5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">
              Radar Macroeconómico
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-black italic tracking-tighter uppercase text-foreground">
            Impacto <span className="text-primary font-serif">en Magallanes</span>
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2.5 py-0.5 text-[8px] font-bold text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>NVIDIA NIM AI</span>
          </div>

          <button
            onClick={handleRefreshAnalysis}
            disabled={loading}
            className="p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground/80 hover:text-primary transition-all disabled:opacity-50 cursor-pointer"
            title="Actualizar análisis con NVIDIA Nemotron"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Métricas Oficiales en Vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className={`p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/60 border transition-all duration-500 space-y-1 ${updatedCodes["dolar"] ? "border-emerald-500 bg-emerald-500/10 scale-105" : "border-border/60"}`}>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">
            Dólar Observado
          </span>
          <span className="text-sm sm:text-base font-black text-foreground tabular-nums font-mono">
            {getInd("dolar", "$932")}
          </span>
        </div>

        <div className={`p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/60 border transition-all duration-500 space-y-1 ${updatedCodes["uf"] ? "border-emerald-500 bg-emerald-500/10 scale-105" : "border-border/60"}`}>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">
            Unidad de Fomento
          </span>
          <span className="text-sm sm:text-base font-black text-foreground tabular-nums font-mono">
            {getInd("uf", "$39.600")}
          </span>
        </div>

        <div className={`col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border transition-all duration-500 space-y-1 ${updatedCodes["libra_cobre"] ? "border-emerald-500 scale-105" : "border-emerald-500/20"}`}>
          <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Cobre COMEX
          </span>
          <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400 tabular-nums font-mono">
            {getInd("libra_cobre", "US$ 4.52/lb")}
          </span>
        </div>
      </div>

      {/* Caja de Análisis Neural (NVIDIA Nemotron) */}
      <div className="p-4 rounded-2xl bg-primary/[0.04] dark:bg-primary/[0.08] border border-primary/20 space-y-2.5">
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-primary font-bold">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Síntesis Generada por Nemotron 3.5
          </span>
          <span className="font-mono text-[8px] text-muted-foreground">
            {lastUpdated}
          </span>
        </div>

        <p className="text-xs text-foreground/85 font-medium leading-relaxed italic text-justify">
          "{analysis}"
        </p>
      </div>

      {/* Enlace y Transparencia con Fuentes Oficiales */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
        <span>Fuente: Banco Central & INE</span>
        <a
          href="https://www.bcentral.cl/calendario-de-eventos"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
        >
          <span>Calendario Oficial</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
