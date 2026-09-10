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
import { toast } from "sonner";

interface MacroRadarRealtimeProps {
  initialAnalysis?: string;
  indicators?: any[];
}

export function MacroRadarRealtime({ initialAnalysis, indicators = [] }: MacroRadarRealtimeProps) {
  const [analysis, setAnalysis] = useState<string>(
    initialAnalysis || 
    "El escenario cambiario y el nivel de tasas de interés condicionan las decisiones de inversión en la Patagonia. Una cotización estable del dólar beneficia a los importadores de la Zona Franca de Punta Arenas, mientras que los costos de energía y transporte marítimo dependen de la evolución del petróleo internacional."
  );
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("En vivo");

  const getInd = (code: string, fallback: string) => {
    const item = indicators.find((i) => i.codigo === code);
    return item ? `$${Number(item.valor).toLocaleString("es-CL")}` : fallback;
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
    <div className="p-6 sm:p-7 rounded-[2.5rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-950 text-white border border-white/15 shadow-2xl space-y-5 relative overflow-hidden">
      {/* Luz decorativa */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera del Radar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Cpu className="h-3.5 w-3.5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400">
              Radar Macroeconómico
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-black italic tracking-tighter uppercase text-white">
            Impacto <span className="text-primary-foreground font-serif">en Magallanes</span>
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-0.5 text-[8px] font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>NVIDIA NIM AI</span>
          </div>

          <button
            onClick={handleRefreshAnalysis}
            disabled={loading}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Actualizar análisis con NVIDIA Nemotron"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Métricas Oficiales en Vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[8px] font-black text-white/50 uppercase tracking-wider block">
            Dólar Observado
          </span>
          <span className="text-sm sm:text-base font-black text-white tabular-nums font-mono">
            {getInd("dolar", "$932")}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[8px] font-black text-white/50 uppercase tracking-wider block">
            Unidad de Fomento
          </span>
          <span className="text-sm sm:text-base font-black text-white tabular-nums font-mono">
            {getInd("uf", "$39.600")}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[8px] font-black text-white/50 uppercase tracking-wider block">
            Cobre COMEX
          </span>
          <span className="text-sm sm:text-base font-black text-emerald-400 tabular-nums font-mono">
            US$ 4.52/lb
          </span>
        </div>
      </div>

      {/* Caja de Análisis Neural (NVIDIA Nemotron 70B) */}
      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-[9px] font-black text-white/60 uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-primary-foreground">
            <Sparkles className="h-3 w-3 text-amber-300" />
            Síntesis Generada por Nemotron 3.5
          </span>
          <span className="font-mono text-[8px] text-white/40">
            {lastUpdated}
          </span>
        </div>

        <p className="text-xs text-white/85 font-medium leading-relaxed italic text-justify">
          "{analysis}"
        </p>
      </div>

      {/* Enlace y Transparencia con Fuentes Oficiales */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/50 font-bold uppercase tracking-wider">
        <span>Fuente: Banco Central & INE</span>
        <a
          href="https://www.bcentral.cl/calendario-de-eventos"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary-foreground hover:text-white transition-colors"
        >
          <span>Calendario Oficial</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
