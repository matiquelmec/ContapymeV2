"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Calculator, 
  Share2, 
  Copy, 
  Check, 
  ArrowRight,
  TrendingUp,
  Percent,
  DollarSign,
  Building,
  Shield,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Parámetros legales estándar chilenos (2025/2026)
const SUELDO_MINIMO = 529000;
const UTM_VALOR = 67294;
const UF_VALOR = 38000;
const TOPE_AFP_UF = 84.3;

const AFPS = [
  { code: "HABITAT", name: "Habitat", commission: 1.27 },
  { code: "CAPITAL", name: "Capital", commission: 1.44 },
  { code: "CUPRUM", name: "Cuprum", commission: 1.44 },
  { code: "MODELO", name: "Modelo", commission: 0.58 },
  { code: "PLANVITAL", name: "Planvital", commission: 1.16 },
  { code: "UNO", name: "Uno", commission: 0.69 },
  { code: "PROVIDA", name: "Provida", commission: 1.45 }
];

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

function forwardCalculation(params: {
  base: number;
  gratificacion: boolean;
  afpCode: string;
  saludCode: string;
  planSaludUf: number;
  tipoContrato: string;
  asignacionMovilizacion: number;
  asignacionColacion: number;
  esZonaExtrema: boolean;
}) {
  const {
    base,
    gratificacion,
    afpCode,
    saludCode,
    planSaludUf,
    tipoContrato,
    asignacionMovilizacion,
    asignacionColacion,
    esZonaExtrema
  } = params;

  // 1. Gratificación
  let grat = 0;
  if (gratificacion) {
    const topeGrat = Math.floor((4.75 * SUELDO_MINIMO) / 12);
    grat = Math.min(Math.floor(base * 0.25), topeGrat);
  }

  // Haberes imponibles y brutos
  const brutoImponible = base + grat;
  const totalHaberesBrutos = brutoImponible + asignacionMovilizacion + asignacionColacion;

  // 2. Límites imponibles
  const topePesos = Math.floor(TOPE_AFP_UF * UF_VALOR);
  const imponibleTope = Math.min(brutoImponible, topePesos);

  // 3. AFP
  const afpInfo = AFPS.find(a => a.code === afpCode) || AFPS[0];
  const afpRate = (10.0 + afpInfo.commission) / 100.0;
  const afp = Math.floor(imponibleTope * afpRate);

  // 4. Salud
  let saludTotal = 0;
  let saludVoluntaria = 0;
  const salud7Pct = Math.floor(imponibleTope * 0.07);

  if (saludCode === "FONASA") {
    saludTotal = salud7Pct;
  } else {
    // Isapre
    const planPesos = Math.floor(planSaludUf * UF_VALOR);
    saludTotal = Math.max(salud7Pct, planPesos);
    saludVoluntaria = Math.max(0, saludTotal - salud7Pct);
  }

  // 5. AFC (Seguro Cesantía)
  let afcTrabajador = 0;
  let afcEmpresa = 0;
  if (tipoContrato === "indefinido") {
    afcTrabajador = Math.floor(imponibleTope * 0.006);
    afcEmpresa = Math.floor(imponibleTope * 0.024);
  } else {
    afcTrabajador = 0;
    afcEmpresa = Math.floor(imponibleTope * 0.03);
  }

  // SIS
  const sisEmpresa = Math.floor(imponibleTope * 0.0149);

  // 6. Impuesto Único de Segunda Categoría
  const baseImpuesto = imponibleTope - afp - salud7Pct - afcTrabajador;
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

  // Rebaja de Zona Extrema (DL 889): 98% de rebaja al impuesto en Magallanes
  if (esZonaExtrema) {
    impuesto = Math.floor(impuesto * 0.02);
  }

  const totalDescuentosLegales = afp + saludTotal + afcTrabajador + impuesto;
  const liquido = totalHaberesBrutos - totalDescuentosLegales;

  return {
    sueldoBase: base,
    gratificacion: grat,
    asignacionMovilizacion,
    asignacionColacion,
    totalHaberesBrutos,
    afp,
    salud: salud7Pct,
    saludVoluntaria,
    saludTotal,
    afcTrabajador,
    afcEmpresa,
    sisEmpresa,
    impuesto,
    totalDescuentosLegales,
    sueldoLiquido: liquido
  };
}

function runBisection(params: {
  targetLiquido: number;
  gratificacion: boolean;
  afpCode: string;
  saludCode: string;
  planSaludUf: number;
  tipoContrato: string;
  asignacionMovilizacion: number;
  asignacionColacion: number;
  esZonaExtrema: boolean;
}) {
  let low = 0;
  let high = Math.max(100000000, params.targetLiquido * 3);
  
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const res = forwardCalculation({ ...params, base: mid });
    if (res.sueldoLiquido < params.targetLiquido) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return forwardCalculation({ ...params, base: Math.round(low) });
}

const formatCLP = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);

function CalculatorContent() {
  const searchParams = useSearchParams();
  const [targetLiquido, setTargetLiquido] = useState<number>(1000000);
  const [gratificacion, setGratificacion] = useState<boolean>(true);
  const [tipoContrato, setTipoContrato] = useState<string>("indefinido");
  const [afpCode, setAfpCode] = useState<string>("HABITAT");
  const [saludCode, setSaludCode] = useState<string>("FONASA");
  const [planSaludUf, setPlanSaludUf] = useState<number>(0);
  const [asignacionMovilizacion, setAsignacionMovilizacion] = useState<number>(0);
  const [asignacionColacion, setAsignacionColacion] = useState<number>(0);
  const [esZonaExtrema, setEsZonaExtrema] = useState<boolean>(true); // Por defecto en Magallanes (portada regional)

  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Cargar de URL si existe
  useEffect(() => {
    const urlLiq = searchParams.get("liq");
    const urlGrat = searchParams.get("grat");
    const urlCont = searchParams.get("cont");
    const urlAfp = searchParams.get("afp");
    const urlSalud = searchParams.get("salud");
    const urlUf = searchParams.get("uf");
    const urlMov = searchParams.get("mov");
    const urlCol = searchParams.get("col");
    const urlZona = searchParams.get("zona");

    if (urlLiq) setTargetLiquido(Math.max(0, parseInt(urlLiq) || 1000000));
    if (urlGrat) setGratificacion(urlGrat === "true");
    if (urlCont) setTipoContrato(urlCont);
    if (urlAfp) setAfpCode(urlAfp.toUpperCase());
    if (urlSalud) setSaludCode(urlSalud.toUpperCase());
    if (urlUf) setPlanSaludUf(parseFloat(urlUf) || 0);
    if (urlMov) setAsignacionMovilizacion(parseInt(urlMov) || 0);
    if (urlCol) setAsignacionColacion(parseInt(urlCol) || 0);
    if (urlZona) setEsZonaExtrema(urlZona === "true");
  }, [searchParams]);

  useEffect(() => {
    const res = runBisection({
      targetLiquido,
      gratificacion,
      afpCode,
      saludCode,
      planSaludUf,
      tipoContrato,
      asignacionMovilizacion,
      asignacionColacion,
      esZonaExtrema
    });
    setResult(res);
  }, [
    targetLiquido,
    gratificacion,
    afpCode,
    saludCode,
    planSaludUf,
    tipoContrato,
    asignacionMovilizacion,
    asignacionColacion,
    esZonaExtrema
  ]);

  const handleShareLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}?liq=${targetLiquido}&grat=${gratificacion}&cont=${tipoContrato}&afp=${afpCode}&salud=${saludCode}&uf=${planSaludUf}&mov=${asignacionMovilizacion}&col=${asignacionColacion}&zona=${esZonaExtrema}`;
    
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Enlace de simulación exacta copiado.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}?liq=${targetLiquido}&grat=${gratificacion}&cont=${tipoContrato}&afp=${afpCode}&salud=${saludCode}&uf=${planSaludUf}&mov=${asignacionMovilizacion}&col=${asignacionColacion}&zona=${esZonaExtrema}`;
    const text = encodeURIComponent(
      `📊 ¡Simulé un Sueldo Base de ${formatCLP(result?.sueldoBase || 0)} para obtener un líquido de ${formatCLP(targetLiquido)}! Calcula el tuyo con leyes sociales en vivo aquí: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Inputs de Entrada */}
      <div className="space-y-3">
        {/* Sueldo Líquido */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Sueldo Líquido Objetivo</label>
          <div className="relative">
            <span className="absolute left-3 inset-y-0 flex items-center text-xs font-black text-slate-400">$</span>
            <input
              type="number"
              className="w-full h-10 rounded-xl border border-primary/15 bg-white pl-6 pr-3 text-xs font-black tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={targetLiquido}
              onChange={(e) => setTargetLiquido(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>

        {/* Tipo de Contrato y AFP */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Contrato</label>
            <select
              className="w-full h-9 rounded-lg border border-primary/15 bg-white px-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={tipoContrato}
              onChange={(e) => setTipoContrato(e.target.value)}
            >
              <option value="indefinido">Indefinido</option>
              <option value="fijo">Plazo Fijo</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Previsión AFP</label>
            <select
              className="w-full h-9 rounded-lg border border-primary/15 bg-white px-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={afpCode}
              onChange={(e) => setAfpCode(e.target.value)}
            >
              {AFPS.map(a => (
                <option key={a.code} value={a.code}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Salud y UF */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Salud</label>
            <select
              className="w-full h-9 rounded-lg border border-primary/15 bg-white px-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={saludCode}
              onChange={(e) => {
                setSaludCode(e.target.value);
                if (e.target.value === "FONASA") setPlanSaludUf(0);
              }}
            >
              <option value="FONASA">FONASA (7%)</option>
              <option value="ISAPRE">ISAPRE</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Plan Isapre (UF)</label>
            <input
              type="number"
              step="0.01"
              disabled={saludCode === "FONASA"}
              className="w-full h-9 rounded-lg border border-primary/15 bg-white px-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
              value={planSaludUf}
              onChange={(e) => setPlanSaludUf(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
        </div>

        {/* Asignaciones no imponibles */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Movilización ($)</label>
            <input
              type="number"
              className="w-full h-9 rounded-lg border border-primary/15 bg-white px-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={asignacionMovilizacion}
              onChange={(e) => setAsignacionMovilizacion(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Colación ($)</label>
            <input
              type="number"
              className="w-full h-9 rounded-lg border border-primary/15 bg-white px-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={asignacionColacion}
              onChange={(e) => setAsignacionColacion(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>

        {/* Toggles Rápidos */}
        <div className="flex items-center justify-between gap-2 px-1 pt-1.5 border-t border-slate-100">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={gratificacion}
              onChange={(e) => setGratificacion(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/10"
            />
            <span className="text-[9px] font-black uppercase text-slate-600">Gratificación (Art. 50)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={esZonaExtrema}
              onChange={(e) => setEsZonaExtrema(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/10"
            />
            <span className="text-[9px] font-black uppercase text-slate-600">Zona Extrema (DL 889)</span>
          </label>
        </div>
      </div>

      {/* Resultados Completos en Acordeón Detallado */}
      {result && (
        <div className="space-y-2.5 pt-2 border-t border-slate-200">
          {/* Tarjeta Principal KPI */}
          <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl p-3.5 text-center space-y-1">
            <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Sueldo Base Requerido</p>
            <p className="text-xl font-black text-emerald-950 tracking-tighter">{formatCLP(result.sueldoBase)}</p>
            <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider">
              Costo Empresa: {formatCLP(result.totalHaberesBrutos + result.afcEmpresa + result.sisEmpresa)}
            </p>
          </div>

          {/* Desglose Detallado */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 space-y-2 font-mono text-[10px]">
            {/* Haberes */}
            <div className="space-y-1 border-b border-dashed border-slate-200 pb-1.5">
              <p className="font-sans font-black text-[8px] uppercase tracking-wider text-slate-400">Haberes (Ingresos)</p>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Sueldo Base:</span>
                <span className="font-bold">{formatCLP(result.sueldoBase)}</span>
              </div>
              {result.gratificacion > 0 && (
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500">Gratificación:</span>
                  <span className="font-bold">{formatCLP(result.gratificacion)}</span>
                </div>
              )}
              {(result.asignacionMovilizacion > 0 || result.asignacionColacion > 0) && (
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500">Asignaciones (No imp):</span>
                  <span className="font-bold">{formatCLP(result.asignacionMovilizacion + result.asignacionColacion)}</span>
                </div>
              )}
            </div>

            {/* Deducciones */}
            <div className="space-y-1 border-b border-dashed border-slate-200 pb-1.5">
              <p className="font-sans font-black text-[8px] uppercase tracking-wider text-slate-400">Retenciones (Descuentos)</p>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">AFP ({afpCode}):</span>
                <span className="font-bold text-rose-600">-{formatCLP(result.afp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Salud ({saludCode}):</span>
                <span className="font-bold text-rose-600">-{formatCLP(result.saludTotal)}</span>
              </div>
              {result.afcTrabajador > 0 && (
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500">AFC Seguro:</span>
                  <span className="font-bold text-rose-600">-{formatCLP(result.afcTrabajador)}</span>
                </div>
              )}
              {result.impuesto > 0 && (
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500">Impuesto Único:</span>
                  <span className="font-bold text-rose-700">-{formatCLP(result.impuesto)}</span>
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="flex justify-between font-sans font-black text-[11px] text-slate-800 pt-0.5">
              <span>Sueldo Bruto:</span>
              <span>{formatCLP(result.totalHaberesBrutos)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción viral */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button 
          size="sm"
          variant="outline"
          onClick={handleShareLink}
          className="h-9 text-[9px] font-black uppercase tracking-wider rounded-lg border-zinc-200 hover:bg-slate-50 transition-all gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "COPIADO" : "COPIAR LINK"}
        </Button>
        <Button 
          size="sm"
          onClick={handleShareWhatsApp}
          className="h-9 text-[9px] font-black uppercase tracking-wider rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all gap-1.5"
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
