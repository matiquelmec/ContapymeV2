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
  HelpCircle,
  Clock,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Parámetros legales estándar chilenos (2025/2026)
const SUELDO_MINIMO = 529000;
const UTM_VALOR = 67294;
const UF_VALOR = 38000;
const TOPE_AFP_UF = 84.3;
const TOPE_AFC_UF = 126.6;

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

  // 1. Gratificación Legal (Art. 50 Código del Trabajo)
  let grat = 0;
  if (gratificacion) {
    const topeGrat = Math.floor((4.75 * SUELDO_MINIMO) / 12);
    grat = Math.min(Math.floor(base * 0.25), topeGrat);
  }

  // Remuneración imponible y haberes totales
  const brutoImponible = base + grat;
  const totalHaberesBrutos = brutoImponible + asignacionMovilizacion + asignacionColacion;

  // 2. Límites y Topes Imponibles Reales
  const topePesosAFP = Math.floor(TOPE_AFP_UF * UF_VALOR);
  const topePesosAFC = Math.floor(TOPE_AFC_UF * UF_VALOR);

  const baseAFP = Math.min(brutoImponible, topePesosAFP);
  const baseSalud = baseAFP; // Mismo tope que AFP
  const baseAFC = Math.min(brutoImponible, topePesosAFC);

  // 3. AFP (Cotización + Comisión)
  const afpInfo = AFPS.find(a => a.code === afpCode) || AFPS[0];
  const descuentoAfp = Math.floor(baseAFP * 0.10);
  const descuentoAfpComision = Math.floor(baseAFP * (afpInfo.commission / 100.0));

  // 4. Previsión Salud (Lógica dual Fonasa vs Isapre)
  const descuentoSaludLegal = Math.floor(baseSalud * 0.07);
  let descuentoSaludTotal = descuentoSaludLegal;
  let descuentoSaludVoluntaria = 0;

  if (saludCode === "ISAPRE" && planSaludUf > 0) {
    let planPesos = Math.floor(planSaludUf * UF_VALOR);
    planPesos = Math.min(planPesos, baseSalud); // Isapre topada al imponible
    if (planPesos > descuentoSaludLegal) {
      descuentoSaludVoluntaria = planPesos - descuentoSaludLegal;
    }
    descuentoSaludTotal = Math.max(descuentoSaludLegal, planPesos);
  }

  // 5. AFC Seguro de Cesantía (Trabajador)
  let descuentoAfcTrab = 0;
  let afcEmpresa = 0;
  if (tipoContrato === "indefinido") {
    descuentoAfcTrab = Math.floor(baseAFC * 0.006);
    afcEmpresa = Math.floor(baseAFC * 0.024);
  } else {
    descuentoAfcTrab = 0; // En contrato a plazo fijo paga 100% el empleador
    afcEmpresa = Math.floor(baseAFC * 0.03);
  }

  // SIS (Seguro de Invalidez y Sobrevivencia - pagado por empleador)
  const sisEmpresa = Math.floor(baseAFP * 0.0149);

  // 6. Impuesto Único de Segunda Categoría (IRPF Mensual)
  // Nota Normativa: La base imponible parte del bruto imponible (sin topes) menos descuentos previsionales obligatorios topados
  let baseImpuesto = brutoImponible - descuentoAfp - descuentoAfpComision - descuentoSaludLegal - descuentoAfcTrab;

  // Deducción por asignación de zona extrema (DL 889 / Asig. Zona Magallanes)
  let asignacionZona = 0;
  if (esZonaExtrema) {
    const grado1a = 210000; // Valor aproximado escala sueldo grado 1A
    asignacionZona = Math.floor(grado1a * 0.875);
    baseImpuesto = Math.max(0, baseImpuesto - asignacionZona);
  }

  baseImpuesto = Math.max(0, baseImpuesto);
  let impuestoBruto = 0;
  let impuesto = 0;
  let rebajaMonto = 0;

  if (baseImpuesto > 0) {
    const baseUtm = baseImpuesto / UTM_VALOR;
    for (const tramo of TRAMOS_IMPUESTO) {
      if (baseUtm >= tramo.inf && baseUtm < tramo.sup) {
        impuestoBruto = Math.floor((baseImpuesto * tramo.tasa) - (tramo.rebaja * UTM_VALOR));
        if (impuestoBruto < 0) impuestoBruto = 0;
        break;
      }
    }
  }

  impuesto = impuestoBruto;

  // Rebaja del impuesto por Zona Extrema (98% de exención para Magallanes)
  if (esZonaExtrema && impuestoBruto > 0) {
    rebajaMonto = Math.floor(impuestoBruto * 0.98);
    impuesto = impuestoBruto - rebajaMonto;
  }

  const totalDescuentosLegales = descuentoAfp + descuentoAfpComision + descuentoSaludTotal + descuentoAfcTrab + impuesto;
  const liquido = totalHaberesBrutos - totalDescuentosLegales;

  return {
    sueldoBase: base,
    gratificacion: grat,
    asignacionMovilizacion,
    asignacionColacion,
    totalHaberesBrutos,
    afp: descuentoAfp,
    afpComision: descuentoAfpComision,
    salud: descuentoSaludLegal,
    saludVoluntaria: descuentoSaludVoluntaria,
    saludTotal: descuentoSaludTotal,
    afcTrabajador: descuentoAfcTrab,
    afcEmpresa,
    sisEmpresa,
    impuestoUnico: impuesto,
    totalDescuentosLegales,
    sueldoLiquido: liquido,
    asignacionZonaExtrema: asignacionZona,
    impuestoUnicoSinRebaja: impuestoBruto,
    rebajaZonaExtrema: rebajaMonto
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
  
  // Realizar última pasada con el entero redondeado
  return forwardCalculation({ ...params, base: Math.round(low) });
}

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
  const [esZonaExtrema, setEsZonaExtrema] = useState<boolean>(true); // Activado por defecto para Magallanes

  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* COLUMNA IZQUIERDA: CONFIGURACIÓN DE INPUTS */}
      <div className="lg:col-span-5 space-y-6 bg-white/60 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-neutral-200/50 shadow-sm">
        <h3 className="text-sm font-black uppercase text-neutral-800 tracking-wider flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" /> Parámetros del Trabajador
        </h3>
        
        {/* Sueldo Líquido */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Sueldo Líquido Objetivo</label>
          <div className="relative">
            <span className="absolute left-3.5 inset-y-0 flex items-center text-xs font-black text-slate-400">$</span>
            <input
              type="number"
              className="w-full h-11 rounded-xl border border-primary/15 bg-white pl-8 pr-4 text-xs font-black tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={targetLiquido}
              onChange={(e) => setTargetLiquido(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>

        {/* Tipo de Contrato y AFP */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Contrato</label>
            <select
              className="w-full h-11 rounded-xl border border-primary/15 bg-white px-3 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={tipoContrato}
              onChange={(e) => setTipoContrato(e.target.value)}
            >
              <option value="indefinido">Indefinido</option>
              <option value="fijo">Plazo Fijo</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Previsión AFP</label>
            <select
              className="w-full h-11 rounded-xl border border-primary/15 bg-white px-3 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={afpCode}
              onChange={(e) => setAfpCode(e.target.value)}
            >
              {AFPS.map(a => (
                <option key={a.code} value={a.code}>{a.name} ({a.commission}%)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Previsión Salud */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Salud</label>
            <select
              className="w-full h-11 rounded-xl border border-primary/15 bg-white px-3 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Plan Pactado (UF)</label>
            <input
              type="number"
              step="0.01"
              disabled={saludCode === "FONASA"}
              className="w-full h-11 rounded-xl border border-primary/15 bg-white px-3 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
              value={planSaludUf}
              onChange={(e) => setPlanSaludUf(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
        </div>

        {/* Asignaciones no imponibles */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Movilización ($)</label>
            <input
              type="number"
              className="w-full h-11 rounded-xl border border-primary/15 bg-white px-3 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={asignacionMovilizacion}
              onChange={(e) => setAsignacionMovilizacion(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Colación ($)</label>
            <input
              type="number"
              className="w-full h-11 rounded-xl border border-primary/15 bg-white px-3 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={asignacionColacion}
              onChange={(e) => setAsignacionColacion(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>

        {/* Toggles Rápidos */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pt-3 border-t border-neutral-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={gratificacion}
              onChange={(e) => setGratificacion(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-slate-300 text-primary focus:ring-primary/10"
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-700">Gratificación Legal</span>
              <span className="text-[8px] text-slate-400 font-bold italic">Art. 50 (25% imponible)</span>
            </div>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={esZonaExtrema}
              onChange={(e) => setEsZonaExtrema(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-slate-300 text-primary focus:ring-primary/10"
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-700">Zona Extrema</span>
              <span className="text-[8px] text-slate-400 font-bold italic">Deducción DL 889 (98%)</span>
            </div>
          </label>
        </div>
      </div>

      {/* COLUMNA DERECHA: DESGLOSE Y REPORTES */}
      <div className="lg:col-span-7 space-y-6">
        {result ? (
          <div className="space-y-6">
            {/* Tarjetas KPI de Resultados Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-[1.8rem] p-6 text-center space-y-1">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center justify-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Sueldo Base Determinado
                </p>
                <p className="text-3xl font-black text-emerald-950 tracking-tighter">{formatCLP(result.sueldoBase)}</p>
                <p className="text-[9px] font-bold text-slate-400 italic">Conversión exacta al peso</p>
              </div>

              <div className="bg-slate-500/[0.04] border border-slate-500/15 rounded-[1.8rem] p-6 text-center space-y-1">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Building className="w-3.5 h-3.5" /> Costo Mensual del Empleador
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">
                  {formatCLP(result.totalHaberesBrutos + result.afcEmpresa + result.sisEmpresa)}
                </p>
                <p className="text-[9px] font-bold text-slate-400 italic">Incluye leyes sociales patronales</p>
              </div>
            </div>

            {/* Ficha Contable Detallada */}
            <div className="bg-white/80 backdrop-blur-md border border-neutral-200/60 rounded-[2rem] p-6 sm:p-8 space-y-5">
              
              {/* Haberes */}
              <div className="space-y-2 border-b border-dashed border-slate-200 pb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Ingresos / Haberes
                </h4>
                <div className="font-mono text-xs space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span>Sueldo Base:</span>
                    <span className="font-bold">{formatCLP(result.sueldoBase)}</span>
                  </div>
                  {result.gratificacion > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Gratificación Legal (Art. 50):</span>
                      <span className="font-bold">{formatCLP(result.gratificacion)}</span>
                    </div>
                  )}
                  {(result.asignacionMovilizacion > 0 || result.asignacionColacion > 0) && (
                    <div className="flex justify-between text-slate-700">
                      <span>Asignaciones no imponibles:</span>
                      <span className="font-bold">{formatCLP(result.asignacionMovilizacion + result.asignacionColacion)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-sans font-black text-xs text-slate-900">
                    <span>Total Haberes Brutos:</span>
                    <span>{formatCLP(result.totalHaberesBrutos)}</span>
                  </div>
                </div>
              </div>

              {/* Deducciones previsionales */}
              <div className="space-y-2 border-b border-dashed border-slate-200 pb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-rose-600" /> Retenciones Legales (Descuentos)
                </h4>
                <div className="font-mono text-xs space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span>AFP ({afpCode} - obligatorio + comisión):</span>
                    <span className="font-bold text-rose-600">-{formatCLP(result.afp + result.afpComision)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Salud ({saludCode} - {saludCode === "FONASA" ? "7%" : `${formatCLP(result.saludTotal)} total`}):</span>
                    <span className="font-bold text-rose-600">-{formatCLP(result.saludTotal)}</span>
                  </div>
                  {result.afcTrabajador > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Seguro Cesantía (AFC 0.6%):</span>
                      <span className="font-bold text-rose-600">-{formatCLP(result.afcTrabajador)}</span>
                    </div>
                  )}
                  {result.impuestoUnico > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Impuesto Único Segunda Categoría:</span>
                      <span className="font-bold text-rose-700">-{formatCLP(result.impuestoUnico)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-sans font-black text-xs text-slate-900">
                    <span>Total Descuentos Legales:</span>
                    <span>-{formatCLP(result.totalDescuentosLegales)}</span>
                  </div>
                </div>
              </div>

              {/* Cargos Patronales */}
              <div className="space-y-2 pb-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-600" /> Aportes del Empleador
                </h4>
                <div className="font-mono text-xs space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span>Seguro Invalidez (SIS 1.49%):</span>
                    <span className="font-bold">{formatCLP(result.sisEmpresa)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Aporte AFC Empresa:</span>
                    <span className="font-bold">{formatCLP(result.afcEmpresa)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerta de Exenciones de Zona Extrema */}
            {esZonaExtrema && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 flex gap-4 text-blue-900">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-black text-[10px] uppercase tracking-wider">Beneficio Zona Extrema Activo</h5>
                  <p className="text-[10.5px] leading-relaxed text-blue-800/90 font-medium">
                    Se está deduciendo <strong className="text-blue-950">{formatCLP(result.asignacionZonaExtrema)}</strong> de la base imponible y aplicando un **98% de exención** sobre el Impuesto Único de Segunda Categoría debido a las exenciones del **D.L. 889** vigentes en Magallanes.
                  </p>
                </div>
              </div>
            )}

            {/* Compartir */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline"
                onClick={handleShareLink}
                className="flex-1 h-11 text-xs font-black uppercase tracking-[0.2em] rounded-xl border-zinc-200 bg-white hover:bg-slate-50 transition-all gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600 animate-pulse" /> : <Copy className="w-4 h-4" />}
                {copied ? "COPIADO" : "COPIAR LINK SIMULACIÓN"}
              </Button>
              <Button 
                onClick={handleShareWhatsApp}
                className="flex-1 h-11 text-xs font-black uppercase tracking-[0.2em] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all gap-2"
              >
                <Share2 className="w-4 h-4" />
                COMPARTIR POR WHATSAPP
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-20 bg-white/40 border border-dashed border-neutral-300 rounded-[2rem]">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Cargando cálculos contables...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PublicSalaryCalculator() {
  return (
    <div className="w-full rounded-[3.5rem] bg-gradient-to-tr from-slate-50 via-white to-sky-500/[0.02] border border-neutral-200/60 p-8 md:p-12 shadow-[0_30px_80px_rgba(30,58,138,0.03)] relative overflow-hidden">
      {/* Auroras Patagónicas */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-primary/10 to-sky-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-sky-600/5 to-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="space-y-8 relative z-10">
        {/* Cabecera Central */}
        <div className="space-y-3 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 shadow-[0_5px_15px_rgba(30,58,138,0.02)]">
            <Calculator className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-primary to-sky-600">Herramienta Financiera en Vivo</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-neutral-900 leading-none">
            Calculadora de Sueldo <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-sky-600 to-blue-500 font-extrabold">Líquido a Base</span>
          </h2>
          <p className="text-neutral-500 font-bold italic text-xs leading-relaxed max-w-lg mx-auto">
            Ingresa tu sueldo líquido deseado y simula instantáneamente la base imponible y el costo de contratación real con normativa chilena 2026.
          </p>
        </div>

        <Suspense fallback={
          <div className="h-60 flex items-center justify-center text-xs font-bold text-slate-400 border border-dashed border-neutral-200 rounded-[2rem]">
            Cargando simulador contable...
          </div>
        }>
          <CalculatorContent />
        </Suspense>
      </div>
    </div>
  );
}
