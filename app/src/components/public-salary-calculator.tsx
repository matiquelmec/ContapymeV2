"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Calculator, 
  Share2, 
  Copy, 
  Check, 
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Percent,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Parámetros legales estándar chilenos (2025/2026)
const SUELDO_MINIMO = 529000;
const UTM_VALOR = 67294;
const UF_VALOR = 38000;
const TOPE_AFP_UF = 84.3;

const TRAMOS_IMPUESTO = [
  { inf: 0, sup: 13.5, tasa: 0.00, rebaja: 0.000 },
  { inf: 13.5, sup: 30.0, tasa: 0.04, rebaja: 0.540 },
  { inf: 30.0, sup: 50.0, tasa: 0.08, rebaja: 1.740 },
  { inf: 50.0, sup: 70.0, tasa: 0.135, rebaja: 4.490 },
  { inf: 70.0, sup: 90.0, tasa: 0.23, rebaja: 11.140 },
  { inf: 90.0, sup: 120.0, tasa: 0.304, rebaja: 17.800 },
  { inf: 120.0, sup: 310.0, tasa: 0.35, rebaja: 23.320 },
  { inf: 310.0, sup: Infinity, tasa: 0.40, rebaja: 38.820 }
];

function forwardCalculation(base: number, gratificacion: boolean, indefinido: boolean) {
  let grat = 0;
  if (gratificacion) {
    const topeGrat = Math.floor((4.75 * SUELDO_MINIMO) / 12);
    grat = Math.min(Math.floor(base * 0.25), topeGrat);
  }
  
  const bruto = base + grat;
  const topePesos = Math.floor(TOPE_AFP_UF * UF_VALOR);
  const imponible = Math.min(bruto, topePesos);
  
  const afp = Math.floor(imponible * 0.112); // Promedio estimado de 10% + 1.2% comisión
  const salud = Math.floor(imponible * 0.07); // Fonasa estándar
  const afc = indefinido ? Math.floor(imponible * 0.006) : 0;
  
  const baseImpuesto = imponible - afp - salud - afc;
  
  let impuesto = 0;
  if (baseImpuesto > 0) {
    const baseUtm = baseImpuesto / UTM_VALOR;
    for (const tramo of TRAMOS_IMPUESTO) {
      if (baseUtm >= tramo.inf && baseUtm < tramo.sup) {
        impuesto = Math.floor((baseImpuesto * tramo.tasa) - (tramo.rebaja * UTM_VALOR));
        if (impuesto < 0) impuesto = 0;
        break;
      }
    }
  }
  
  const descuentos = afp + salud + afc + impuesto;
  const liquido = bruto - descuentos;
  
  return {
    sueldoBase: base,
    gratificacion: grat,
    bruto,
    afp,
    salud,
    afc,
    impuesto,
    descuentos,
    liquido
  };
}

function runBisection(targetLiquido: number, gratificacion: boolean, indefinido: boolean) {
  let low = 0;
  let high = Math.max(100000000, targetLiquido * 3);
  
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const res = forwardCalculation(mid, gratificacion, indefinido);
    if (res.liquido < targetLiquido) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return forwardCalculation(Math.round(low), gratificacion, indefinido);
}

const formatCLP = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);

function CalculatorContent() {
  const searchParams = useSearchParams();
  const [liquido, setLiquido] = useState<number>(1000000);
  const [gratificacion, setGratificacion] = useState<boolean>(true);
  const [indefinido, setIndefinido] = useState<boolean>(true);
  
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Leer params de la URL si existen
  useEffect(() => {
    const urlLiquido = searchParams.get("liq");
    const urlGrat = searchParams.get("grat");
    const urlInd = searchParams.get("ind");

    if (urlLiquido) setLiquido(Math.max(0, parseInt(urlLiquido) || 1000000));
    if (urlGrat) setGratificacion(urlGrat === "true");
    if (urlInd) setIndefinido(urlInd === "true");
  }, [searchParams]);

  useEffect(() => {
    const res = runBisection(liquido, gratificacion, indefinido);
    setResult(res);
  }, [liquido, gratificacion, indefinido]);

  const handleShareLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}?liq=${liquido}&grat=${gratificacion}&ind=${indefinido}`;
    
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Enlace de cálculo copiado al portapapeles.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}?liq=${liquido}&grat=${gratificacion}&ind=${indefinido}`;
    const text = encodeURIComponent(
      `📊 ¡Calculé un Sueldo Base de ${formatCLP(result?.sueldoBase || 0)} para obtener un líquido de ${formatCLP(liquido)}! Calcula el tuyo aquí: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="space-y-2.5">
        <div className="relative">
          <span className="absolute left-3 inset-y-0 flex items-center text-xs font-black text-slate-400">$</span>
          <input
            type="number"
            className="w-full h-9 rounded-lg border border-primary/15 bg-white pl-6 pr-3 text-xs font-black tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Sueldo Líquido Deseado"
            value={liquido}
            onChange={(e) => setLiquido(Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>

        <div className="flex items-center justify-between gap-2 px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={gratificacion}
              onChange={(e) => setGratificacion(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/10"
            />
            <span className="text-[10px] font-black uppercase text-slate-600">Con Gratificación</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={indefinido}
              onChange={(e) => setIndefinido(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/10"
            />
            <span className="text-[10px] font-black uppercase text-slate-600">Indefinido</span>
          </label>
        </div>
      </div>

      {/* Resultados rápidos */}
      {result && (
        <div className="bg-slate-100/80 border border-slate-200/50 rounded-xl p-3.5 space-y-2.5 font-mono text-[10.5px]">
          <div className="flex justify-between items-center text-slate-800">
            <span className="font-sans font-bold text-slate-500">Sueldo Base:</span>
            <span className="font-black text-xs text-primary">{formatCLP(result.sueldoBase)}</span>
          </div>
          {result.gratificacion > 0 && (
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-sans font-bold text-slate-500">Gratificación:</span>
              <span className="font-bold">{formatCLP(result.gratificacion)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-sans font-bold text-slate-500">Retenciones Previsionales:</span>
            <span className="font-bold text-rose-600">-{formatCLP(result.afp + result.salud + result.afc)}</span>
          </div>
          {result.impuesto > 0 && (
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-sans font-bold text-slate-500">Impuesto Único:</span>
              <span className="font-bold text-rose-700">-{formatCLP(result.impuesto)}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-dashed border-slate-300 pt-2 font-sans font-black text-xs text-slate-900">
            <span>Sueldo Bruto:</span>
            <span>{formatCLP(result.bruto)}</span>
          </div>
        </div>
      )}

      {/* Botones de acción viral */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          size="sm"
          variant="outline"
          onClick={handleShareLink}
          className="h-8 text-[9px] font-black uppercase tracking-wider rounded-lg border-zinc-200 hover:bg-slate-50 transition-all gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "COPIADO" : "COPIAR LINK"}
        </Button>
        <Button 
          size="sm"
          onClick={handleShareWhatsApp}
          className="h-8 text-[9px] font-black uppercase tracking-wider rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          WHATSAPP
        </Button>
      </div>
    </div>
  );
}

export function PublicSalaryCalculator() {
  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-50 to-white border border-primary/15 space-y-4 relative overflow-hidden group shadow-md hover:shadow-lg transition-all duration-300">
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-500" />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary px-2 py-0.5 bg-primary/10 rounded-full flex items-center gap-1">
            <Calculator className="w-3 h-3" /> Calculadora Express
          </span>
          <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-widest">Viral Tool</span>
        </div>
        <h5 className="text-sm font-black italic tracking-tighter uppercase text-foreground leading-tight">
          Sueldo <span className="font-serif italic text-primary">Líquido a Base</span>
        </h5>
        <p className="text-[9.5px] font-semibold text-muted-foreground/70 leading-normal">
          Calcula al instante el sueldo base y las retenciones requeridas para tu líquido deseado en Chile.
        </p>

        <Suspense fallback={<div className="h-28 flex items-center justify-center text-xs font-bold text-slate-400">Cargando simulador...</div>}>
          <CalculatorContent />
        </Suspense>
      </div>
    </div>
  );
}
