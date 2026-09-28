"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Briefcase,
  MessageCircle,
  Sparkles,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Parámetros legales estándar chilenos (2025/2026)
const DEFAULT_LEGAL_PARAMS = {
  sueldo_minimo: 539000,
  tope_afp_uf: 90.0,
  tope_afc_uf: 135.2,
  uf_valor: 40120,
  utm_valor: 69889,
  sis_pct: 1.49,
  mutual_pct: 0.93,
  bonificacion_zona_extrema_pct: 17.0
};

const DEFAULT_AFPS = [
  { code: "HABITAT", name: "Habitat", commission: 1.27 },
  { code: "CAPITAL", name: "Capital", commission: 1.44 },
  { code: "CUPRUM", name: "Cuprum", commission: 1.44 },
  { code: "MODELO", name: "Modelo", commission: 0.58 },
  { code: "PLANVITAL", name: "Planvital", commission: 1.16 },
  { code: "UNO", name: "Uno", commission: 0.49 },
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

const ZONAS_EXTREMAS: Record<string, { label: string; rebajaImpuesto: number; porcentajeAsigZona: number }> = {
  MAGALLANES: { label: "Magallanes y de la Antártica Chilena", rebajaImpuesto: 0.98, porcentajeAsigZona: 0.875 },
  AYSEN: { label: "Aysén del Gral. Carlos Ibáñez", rebajaImpuesto: 0.98, porcentajeAsigZona: 0 },
  CHILOE: { label: "Provincia de Chiloé", rebajaImpuesto: 0.98, porcentajeAsigZona: 0 },
  PALENA: { label: "Provincia de Palena", rebajaImpuesto: 0.98, porcentajeAsigZona: 0 },
  ARICA: { label: "Arica y Parinacota", rebajaImpuesto: 0.5, porcentajeAsigZona: 0 },
  TARAPACA: { label: "Tarapacá", rebajaImpuesto: 0.5, porcentajeAsigZona: 0 }
};

const ASIGNACION_FAMILIAR_TRAMOS = [
  { tramo: "A", topeRenta: 539330, monto: 21243 },
  { tramo: "B", topeRenta: 787747, monto: 14516 },
  { tramo: "C", topeRenta: 1228614, monto: 4590 },
  { tramo: "D", topeRenta: Infinity, monto: 0 }
];

const obtenerGrado1A = () => 535000;

export interface CalculationResult {
  sueldoBase: number;
  gratificacion: number;
  asignacionMovilizacion: number;
  asignacionColacion: number;
  asignacionFamiliar: number;
  cargasFamiliares: number;
  tramoAsignacion: string;
  brutoImponible: number;
  totalHaberesBrutos: number;
  afp: number;
  afpComision: number;
  salud: number;
  saludVoluntaria: number;
  saludTotal: number;
  afcTrabajador: number;
  afcEmpresa: number;
  sisEmpresa: number;
  mutualEmpresa: number;
  impuestoUnico: number;
  impuestoUnicoSinRebaja: number;
  asignacionZonaExtrema: number;
  rebajaZonaExtrema: number;
  totalDescuentosLegales: number;
  sueldoLiquido: number;
  // Métricas Previred & Ley 19.853
  retencionesPrevisionalesSueldo: number;
  totalCargosEmpresa: number;
  totalPrevired: number;
  costoTotalEmpresa: number;
  pisoMagallanes19853: number;
  cumplePisoMagallanes19853: boolean;
  topeImponibleTgrIpc: number;
  bonificacionLey19853: number;
  bonificacionTgrTopeIpc: number;
  porcentajeRecuperacionRetenciones: number;
  porcentajeRecuperacionPrevired: number;
  porcentajeRecuperacionSueldoEmpresarial: number;
  porcentajeRecuperacionRetencionesReal: number;
  porcentajeRecuperacionPreviredReal: number;
  porcentajeRecuperacionSueldoEmpresarialReal: number;
  costoNetoRealEmpresa: number;
  // Escudo Fiscal SII (Sueldo Empresarial Art. 31 N° 6 LIR)
  gastoAceptadoMensualSii: number;
  gastoAceptadoAnualSii: number;
  ahorroRentaAnual125: number;
  ahorroRentaAnual25: number;
  ahorroAfcMensual: number;
  ahorroAfcAnual: number;
}

function forwardCalculation(params: {
  base: number;
  gratificacion: boolean;
  afpCode: string;
  saludCode: string;
  planSaludUf: number;
  tipoContrato: string; // 'indefinido' | 'fijo' | 'sueldo_empresarial'
  asignacionMovilizacion: number;
  asignacionColacion: number;
  cargasFamiliares?: number;
  incluirMutual?: boolean;
  legalParams: typeof DEFAULT_LEGAL_PARAMS;
  afps: Array<{ code: string; name: string; commission: number }>;
  esZonaExtrema: boolean;
  zonaExtrema: string;
}): CalculationResult {
  const {
    base,
    gratificacion,
    afpCode,
    saludCode,
    planSaludUf,
    tipoContrato,
    asignacionMovilizacion,
    asignacionColacion,
    cargasFamiliares = 0,
    incluirMutual = true,
    legalParams,
    afps,
    esZonaExtrema,
    zonaExtrema
  } = params;

  // 1. Gratificación Legal (Art. 50 Código del Trabajo)
  let grat = 0;
  if (gratificacion && tipoContrato !== "sueldo_empresarial") {
    const topeGrat = Math.floor((4.75 * legalParams.sueldo_minimo) / 12);
    grat = Math.min(Math.floor(base * 0.25), topeGrat);
  } else if (gratificacion && tipoContrato === "sueldo_empresarial") {
    // En sueldo empresarial el dueño puede fijarse gratificación voluntaria o todo sueldo base
    const topeGrat = Math.floor((4.75 * legalParams.sueldo_minimo) / 12);
    grat = Math.min(Math.floor(base * 0.25), topeGrat);
  }

  // Remuneración imponible
  const brutoImponible = base + grat;

  // Asignación Familiar
  let asigFamiliarMonto = 0;
  let tramoAsignacion = "D";
  if (cargasFamiliares > 0 && tipoContrato !== "sueldo_empresarial") {
    for (const t of ASIGNACION_FAMILIAR_TRAMOS) {
      if (brutoImponible <= t.topeRenta) {
        asigFamiliarMonto = t.monto * cargasFamiliares;
        tramoAsignacion = t.tramo;
        break;
      }
    }
  }

  const totalHaberesBrutos = brutoImponible + asignacionMovilizacion + asignacionColacion + asigFamiliarMonto;

  // 2. Límites y Topes Imponibles Reales
  const topePesosAFP = Math.floor(legalParams.tope_afp_uf * legalParams.uf_valor);
  const topePesosAFC = Math.floor(legalParams.tope_afc_uf * legalParams.uf_valor);

  const baseAFP = Math.min(brutoImponible, topePesosAFP);
  const baseSalud = baseAFP; // Mismo tope que AFP (90 UF)
  const baseAFC = Math.min(brutoImponible, topePesosAFC);

  // 3. AFP (Cotización 10% + Comisión)
  const afpInfo = afps.find(a => a.code === afpCode) || afps[0];
  const descuentoAfp = Math.floor(baseAFP * 0.10);
  const descuentoAfpComision = Math.floor(baseAFP * (afpInfo.commission / 100.0));

  // 4. Previsión Salud (Fonasa 7% vs Isapre)
  const descuentoSaludLegal = Math.floor(baseSalud * 0.07);
  let descuentoSaludTotal = descuentoSaludLegal;
  let descuentoSaludVoluntaria = 0;

  if (saludCode === "ISAPRE" && planSaludUf > 0) {
    let planPesos = Math.floor(planSaludUf * legalParams.uf_valor);
    planPesos = Math.min(planPesos, baseSalud);
    if (planPesos > descuentoSaludLegal) {
      descuentoSaludVoluntaria = planPesos - descuentoSaludLegal;
    }
    descuentoSaludTotal = Math.max(descuentoSaludLegal, planPesos);
  }

  // 5. AFC Seguro de Cesantía (Ley 19.728)
  let descuentoAfcTrab = 0;
  let afcEmpresa = 0;

  if (tipoContrato === "sueldo_empresarial") {
    // 🛡️ SUELDO EMPRESARIAL: El socio o titular no cotiza AFC (sin vínculo de subordinación laboral)
    descuentoAfcTrab = 0;
    afcEmpresa = 0;
  } else if (tipoContrato === "indefinido") {
    descuentoAfcTrab = Math.floor(baseAFC * 0.006); // 0.6% trabajador
    afcEmpresa = Math.floor(baseAFC * 0.024);       // 2.4% empleador
  } else {
    // Plazo fijo o por obra
    descuentoAfcTrab = 0;                          // 0% trabajador
    afcEmpresa = Math.floor(baseAFC * 0.030);       // 3.0% empleador
  }

  // SIS (Seguro de Invalidez y Sobrevivencia - pagado por empleador)
  const sisEmpresa = Math.floor(baseAFP * (legalParams.sis_pct / 100.0));

  // Mutual de Seguridad (Ley 16.744 + SANNA: 0.93% estándar)
  const mutualEmpresa = incluirMutual ? Math.floor(baseAFP * (legalParams.mutual_pct / 100.0)) : 0;

  // 6. Impuesto Único de Segunda Categoría (IRPF Mensual)
  let baseImpuesto = brutoImponible - descuentoAfp - descuentoAfpComision - descuentoSaludLegal - descuentoAfcTrab;
  let asignacionZona = 0;
  let rebajaMonto = 0;

  if (esZonaExtrema && zonaExtrema in ZONAS_EXTREMAS) {
    const porcentajeAsigZona = ZONAS_EXTREMAS[zonaExtrema].porcentajeAsigZona;
    if (porcentajeAsigZona > 0) {
      asignacionZona = Math.round(obtenerGrado1A() * porcentajeAsigZona);
      baseImpuesto = Math.max(0, baseImpuesto - asignacionZona);
    }
  }

  baseImpuesto = Math.max(0, baseImpuesto);
  let impuestoBruto = 0;
  let impuesto = 0;

  if (baseImpuesto > 0) {
    const baseUtm = baseImpuesto / legalParams.utm_valor;
    for (const tramo of TRAMOS_IMPUESTO) {
      if (baseUtm >= tramo.inf && baseUtm < tramo.sup) {
        impuestoBruto = Math.floor((baseImpuesto * tramo.tasa) - (tramo.rebaja * legalParams.utm_valor));
        if (impuestoBruto < 0) impuestoBruto = 0;
        break;
      }
    }
  }

  impuesto = impuestoBruto;

  if (esZonaExtrema && zonaExtrema in ZONAS_EXTREMAS && impuestoBruto > 0) {
    rebajaMonto = Math.round(impuestoBruto * ZONAS_EXTREMAS[zonaExtrema].rebajaImpuesto);
    impuesto = impuestoBruto - rebajaMonto;
  }

  const totalDescuentosLegales = descuentoAfp + descuentoAfpComision + descuentoSaludTotal + descuentoAfcTrab + impuesto;
  const liquido = totalHaberesBrutos - totalDescuentosLegales;

  // ── 7. LEY N° 19.853 (17% BONIFICACIÓN TGR) & TOTAL PREVIRED ───────────────
  const retencionesPrevisionalesSueldo = descuentoAfp + descuentoAfpComision + descuentoSaludTotal + descuentoAfcTrab;
  const totalCargosEmpresa = sisEmpresa + afcEmpresa + mutualEmpresa;
  const totalPrevired = (descuentoAfp + descuentoAfpComision + descuentoSaludLegal + descuentoAfcTrab) + totalCargosEmpresa;
  const costoTotalEmpresa = totalHaberesBrutos + totalCargosEmpresa;

  const pisoMagallanes19853 = Math.round(legalParams.sueldo_minimo * 1.20);
  const cumplePisoMagallanes19853 = brutoImponible > pisoMagallanes19853;

  // Bonificación 17% calculada sobre la remuneración imponible
  let bonificacionLey19853 = 0;
  if (esZonaExtrema && (zonaExtrema in ZONAS_EXTREMAS) && cumplePisoMagallanes19853) {
    bonificacionLey19853 = Math.round(brutoImponible * (legalParams.bonificacion_zona_extrema_pct / 100.0));
  }

  // En el portal oficial de TGR la ley aplica el tope legal reajustado por IPC
  // Base histórica $182.000 (2012) -> $271.686 en 2025 ($46.187 bono) -> $281.195 en 2026 ($47.803 bono máx)
  const topeImponibleTgrIpc = 281195;
  const bonificacionTgrTopeIpc = (esZonaExtrema && (zonaExtrema in ZONAS_EXTREMAS) && cumplePisoMagallanes19853)
    ? Math.round(Math.min(brutoImponible, topeImponibleTgrIpc) * (legalParams.bonificacion_zona_extrema_pct / 100.0))
    : 0;

  // Comparativa y porcentajes de recuperación (17% Teórico Sin Tope)
  const porcentajeRecuperacionRetenciones = (retencionesPrevisionalesSueldo > 0 && bonificacionLey19853 > 0)
    ? Number(((bonificacionLey19853 / retencionesPrevisionalesSueldo) * 100).toFixed(2))
    : 0;

  const porcentajeRecuperacionPrevired = (totalPrevired > 0 && bonificacionLey19853 > 0)
    ? Number(((bonificacionLey19853 / totalPrevired) * 100).toFixed(2))
    : 0;

  // En sueldo empresarial las retenciones son solo AFP + Salud
  const retencionesSueldoEmpresarial = descuentoAfp + descuentoAfpComision + descuentoSaludTotal;
  const porcentajeRecuperacionSueldoEmpresarial = (retencionesSueldoEmpresarial > 0 && bonificacionLey19853 > 0)
    ? Number(((bonificacionLey19853 / retencionesSueldoEmpresarial) * 100).toFixed(2))
    : 0;

  // Porcentajes de recuperación REALES aplicando el Tope Legal TGR ($47.803 máx)
  const porcentajeRecuperacionRetencionesReal = (retencionesPrevisionalesSueldo > 0 && bonificacionTgrTopeIpc > 0)
    ? Number(((bonificacionTgrTopeIpc / retencionesPrevisionalesSueldo) * 100).toFixed(2))
    : 0;

  const porcentajeRecuperacionPreviredReal = (totalPrevired > 0 && bonificacionTgrTopeIpc > 0)
    ? Number(((bonificacionTgrTopeIpc / totalPrevired) * 100).toFixed(2))
    : 0;

  const porcentajeRecuperacionSueldoEmpresarialReal = (retencionesSueldoEmpresarial > 0 && bonificacionTgrTopeIpc > 0)
    ? Number(((bonificacionTgrTopeIpc / retencionesSueldoEmpresarial) * 100).toFixed(2))
    : 0;

  const costoNetoRealEmpresa = costoTotalEmpresa - bonificacionTgrTopeIpc;

  // Escudo Fiscal SII (Art. 31 N° 6 LIR — Sueldo Empresarial como Gasto Aceptado)
  const gastoAceptadoMensualSii = costoTotalEmpresa;
  const gastoAceptadoAnualSii = costoTotalEmpresa * 12;
  const ahorroRentaAnual125 = Math.round(gastoAceptadoAnualSii * 0.125);
  const ahorroRentaAnual25 = Math.round(gastoAceptadoAnualSii * 0.25);
  const ahorroAfcMensual = Math.round(baseAFC * 0.03);
  const ahorroAfcAnual = ahorroAfcMensual * 12;

  return {
    sueldoBase: base,
    gratificacion: grat,
    asignacionMovilizacion,
    asignacionColacion,
    asignacionFamiliar: asigFamiliarMonto,
    cargasFamiliares,
    tramoAsignacion,
    brutoImponible,
    totalHaberesBrutos,
    afp: descuentoAfp,
    afpComision: descuentoAfpComision,
    salud: descuentoSaludLegal,
    saludVoluntaria: descuentoSaludVoluntaria,
    saludTotal: descuentoSaludTotal,
    afcTrabajador: descuentoAfcTrab,
    afcEmpresa,
    sisEmpresa,
    mutualEmpresa,
    impuestoUnico: impuesto,
    impuestoUnicoSinRebaja: impuestoBruto,
    asignacionZonaExtrema: asignacionZona,
    rebajaZonaExtrema: rebajaMonto,
    totalDescuentosLegales,
    sueldoLiquido: liquido,
    retencionesPrevisionalesSueldo,
    totalCargosEmpresa,
    totalPrevired,
    costoTotalEmpresa,
    pisoMagallanes19853,
    cumplePisoMagallanes19853,
    topeImponibleTgrIpc,
    bonificacionLey19853,
    bonificacionTgrTopeIpc,
    porcentajeRecuperacionRetenciones,
    porcentajeRecuperacionPrevired,
    porcentajeRecuperacionSueldoEmpresarial,
    porcentajeRecuperacionRetencionesReal,
    porcentajeRecuperacionPreviredReal,
    porcentajeRecuperacionSueldoEmpresarialReal,
    costoNetoRealEmpresa,
    gastoAceptadoMensualSii,
    gastoAceptadoAnualSii,
    ahorroRentaAnual125,
    ahorroRentaAnual25,
    ahorroAfcMensual,
    ahorroAfcAnual
  };
}

// Bisección inversa de Líquido a Base
function runBisection(params: Parameters<typeof forwardCalculation>[0] & { targetLiquido: number }) {
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

// Modo Bruto Imponible a Líquido
function calculateFromGrossImponible(params: Parameters<typeof forwardCalculation>[0] & { targetBrutoImponible: number }) {
  const { targetBrutoImponible, gratificacion, tipoContrato, legalParams } = params;
  let base = targetBrutoImponible;
  if (gratificacion) {
    const topeGrat = Math.floor((4.75 * legalParams.sueldo_minimo) / 12);
    // Si base * 0.25 <= topeGrat -> base * 1.25 = target -> base = target / 1.25
    const baseEstimada = Math.round(targetBrutoImponible / 1.25);
    if (Math.floor(baseEstimada * 0.25) <= topeGrat) {
      base = baseEstimada;
    } else {
      base = Math.max(0, targetBrutoImponible - topeGrat);
    }
  }
  return forwardCalculation({ ...params, base });
}

// Modo Sueldo Base a Líquido
function calculateFromBase(params: Parameters<typeof forwardCalculation>[0] & { targetBase: number }) {
  return forwardCalculation({ ...params, base: params.targetBase });
}

const formatCLP = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(amount);

function CalculatorContent() {
  const searchParams = useSearchParams();
  
  // Selector de Modo Tridireccional: 'liquido' | 'bruto' | 'base'
  const [calcMode, setCalcMode] = useState<"liquido" | "bruto" | "base">("liquido");
  const [inputValue, setInputValue] = useState<number>(900000);
  
  const [gratificacion, setGratificacion] = useState<boolean>(true);
  const [tipoContrato, setTipoContrato] = useState<string>("indefinido"); // 'indefinido' | 'fijo' | 'sueldo_empresarial'
  const [afpCode, setAfpCode] = useState<string>("UNO");
  const [saludCode, setSaludCode] = useState<string>("FONASA");
  const [planSaludUf, setPlanSaludUf] = useState<number>(0);
  const [asignacionMovilizacion, setAsignacionMovilizacion] = useState<number>(0);
  const [asignacionColacion, setAsignacionColacion] = useState<number>(0);
  const [cargasFamiliares, setCargasFamiliares] = useState<number>(0);
  const [incluirMutual, setIncluirMutual] = useState<boolean>(true);
  
  const [legalParams, setLegalParams] = useState(DEFAULT_LEGAL_PARAMS);
  const [afps, setAfps] = useState(DEFAULT_AFPS);
  const [esZonaExtrema, setEsZonaExtrema] = useState<boolean>(true);
  const [zonaExtrema, setZonaExtrema] = useState<string>("MAGALLANES");
  const [modoTgrConTope, setModoTgrConTope] = useState<boolean>(true);
  const [mostrarLetraChica, setMostrarLetraChica] = useState<boolean>(true);

  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const urlSueldo = searchParams.get("sueldo") || searchParams.get("liq") || searchParams.get("bruto");
    const urlMode = searchParams.get("mode");
    const urlGrat = searchParams.get("grat");
    const urlCont = searchParams.get("cont");
    const urlAfp = searchParams.get("afp");
    const urlSalud = searchParams.get("salud");
    const urlUf = searchParams.get("uf");
    const urlMov = searchParams.get("mov");
    const urlCol = searchParams.get("col");
    const urlZona = searchParams.get("zona");
    const urlZonaCode = searchParams.get("zonaCode");

    if (urlMode === "bruto" || urlMode === "base" || urlMode === "liquido") {
      setCalcMode(urlMode);
    }
    if (urlSueldo) {
      const parsed = parseInt(urlSueldo, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setInputValue(parsed);
      }
    }
    if (urlGrat) setGratificacion(urlGrat === "true");
    if (urlCont) setTipoContrato(urlCont);
    if (urlAfp) setAfpCode(urlAfp.toUpperCase());
    if (urlSalud) setSaludCode(urlSalud.toUpperCase());
    if (urlUf) setPlanSaludUf(parseFloat(urlUf) || 0);
    if (urlMov) setAsignacionMovilizacion(parseInt(urlMov, 10) || 0);
    if (urlCol) setAsignacionColacion(parseInt(urlCol, 10) || 0);
    if (urlZona) setEsZonaExtrema(urlZona === "true");
    if (urlZonaCode && urlZonaCode.toUpperCase() in ZONAS_EXTREMAS) setZonaExtrema(urlZonaCode.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    const period = new Date().toISOString().slice(0, 7);
    fetch(`/api/public/payroll-params?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        const legal = data?.legal_params;
        if (legal) {
          setLegalParams({
            sueldo_minimo: Number(legal.sueldo_minimo ?? DEFAULT_LEGAL_PARAMS.sueldo_minimo),
            tope_afp_uf: Number(legal.tope_afp_uf ?? DEFAULT_LEGAL_PARAMS.tope_afp_uf),
            tope_afc_uf: Number(legal.tope_afc_uf ?? DEFAULT_LEGAL_PARAMS.tope_afc_uf),
            uf_valor: Number(data?.economic_params?.uf_valor ?? DEFAULT_LEGAL_PARAMS.uf_valor),
            utm_valor: Number(data?.economic_params?.utm_valor ?? DEFAULT_LEGAL_PARAMS.utm_valor),
            sis_pct: Number(legal.sis_pct ?? DEFAULT_LEGAL_PARAMS.sis_pct),
            mutual_pct: Number(legal.mutual_pct ?? DEFAULT_LEGAL_PARAMS.mutual_pct),
            bonificacion_zona_extrema_pct: Number(legal.bonificacion_zona_extrema_pct ?? DEFAULT_LEGAL_PARAMS.bonificacion_zona_extrema_pct)
          });
        }
        if (legal?.afp_commissions) {
          const names: Record<string, string> = {
            HABITAT: "Habitat",
            CAPITAL: "Capital",
            CUPRUM: "Cuprum",
            MODELO: "Modelo",
            PLANVITAL: "Planvital",
            UNO: "Uno",
            PROVIDA: "Provida"
          };
          const dynamicAfps = Object.entries(legal.afp_commissions).map(([code, commission]) => ({
            code,
            name: names[code] || code,
            commission: Number(commission)
          }));
          if (dynamicAfps.length > 0) setAfps(dynamicAfps);
        }
      })
      .catch(() => {});
  }, []);

  const result = useMemo(() => {
    const params = {
      base: 0,
      gratificacion,
      afpCode,
      saludCode,
      planSaludUf,
      tipoContrato,
      asignacionMovilizacion,
      asignacionColacion,
      cargasFamiliares,
      incluirMutual,
      legalParams,
      afps,
      esZonaExtrema,
      zonaExtrema
    };

    if (calcMode === "liquido") {
      return runBisection({ ...params, targetLiquido: inputValue });
    } else if (calcMode === "bruto") {
      return calculateFromGrossImponible({ ...params, targetBrutoImponible: inputValue });
    } else {
      return calculateFromBase({ ...params, targetBase: inputValue });
    }
  }, [
    calcMode,
    inputValue,
    gratificacion,
    afpCode,
    saludCode,
    planSaludUf,
    tipoContrato,
    asignacionMovilizacion,
    asignacionColacion,
    cargasFamiliares,
    incluirMutual,
    legalParams,
    afps,
    esZonaExtrema,
    zonaExtrema
  ]);

  const handleShareLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/calculadora?mode=${calcMode}&sueldo=${inputValue}&grat=${gratificacion}&cont=${tipoContrato}&afp=${afpCode}&salud=${saludCode}&uf=${planSaludUf}&mov=${asignacionMovilizacion}&col=${asignacionColacion}&zona=${esZonaExtrema}&zonaCode=${zonaExtrema}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Enlace de simulación exacta copiado.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/calculadora?mode=${calcMode}&sueldo=${inputValue}&grat=${gratificacion}&cont=${tipoContrato}&afp=${afpCode}&salud=${saludCode}&uf=${planSaludUf}&mov=${asignacionMovilizacion}&col=${asignacionColacion}&zona=${esZonaExtrema}&zonaCode=${zonaExtrema}`;
    const text = encodeURIComponent(
      `📊 Simulación de Sueldo Contapymepuq:\n- Sueldo Imponible: ${formatCLP(result?.brutoImponible || 0)}\n- Sueldo Líquido: ${formatCLP(result?.sueldoLiquido || 0)}\n- Reembolso TGR Ley 19.853 (17% Magallanes): ${formatCLP(result?.bonificacionLey19853 || 0)} (${result?.porcentajeRecuperacionRetenciones}% recuperado)\n\nSimula el tuyo en vivo aquí: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* COLUMNA IZQUIERDA: CONFIGURACIÓN DE INPUTS */}
      <div className="lg:col-span-5 space-y-6 bg-white/70 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-neutral-200/60 shadow-sm">
        
        {/* Selector de Modo de Simulación */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block flex items-center justify-between">
            <span>Modo de Simulación</span>
            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Tridireccional 2026
            </span>
          </span>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setCalcMode("liquido");
                if (result?.sueldoLiquido) setInputValue(result.sueldoLiquido);
              }}
              className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                calcMode === "liquido"
                  ? "bg-white text-primary shadow-sm scale-[1.02]"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              💰 Líquido
            </button>
            <button
              type="button"
              onClick={() => {
                setCalcMode("bruto");
                if (result?.brutoImponible) setInputValue(result.brutoImponible);
              }}
              className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                calcMode === "bruto"
                  ? "bg-white text-primary shadow-sm scale-[1.02]"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              💼 Imponible
            </button>
            <button
              type="button"
              onClick={() => {
                setCalcMode("base");
                if (result?.sueldoBase) setInputValue(result.sueldoBase);
              }}
              className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                calcMode === "base"
                  ? "bg-white text-primary shadow-sm scale-[1.02]"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              📄 Sueldo Base
            </button>
          </div>
        </div>

        {/* Input Principal de Monto */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block flex justify-between">
            <span>
              {calcMode === "liquido" && "Sueldo Líquido Objetivo (Bolsillo)"}
              {calcMode === "bruto" && "Sueldo Bruto Imponible Total"}
              {calcMode === "base" && "Sueldo Base Contractual"}
            </span>
            <span className="font-mono text-primary font-bold text-xs">{formatCLP(inputValue)}</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 inset-y-0 flex items-center text-sm font-black text-slate-400">$</span>
            <input 
              id="field_targetmonto" 
              name="field_targetmonto"
              type="number"
              className="w-full h-12 rounded-xl border border-primary/20 bg-white pl-8 pr-4 text-sm font-black tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
              value={inputValue}
              onChange={(e) => setInputValue(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <p className="text-[9px] text-slate-400 italic">
            {calcMode === "liquido" && "Resuelve la base contractual necesaria tras todos los descuentos legales."}
            {calcMode === "bruto" && "Calcula el desglose partiendo del imponible total (ej: $1.098.764)."}
            {calcMode === "base" && "Suma la gratificación legal y calcula las leyes sociales correspondientes."}
          </p>
        </div>

        {/* Tipo de Contrato y Régimen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Régimen / Contrato</label>
            <select 
              id="field_tipocontrato" 
              name="field_tipocontrato"
              className="w-full h-11 rounded-xl border border-primary/15 bg-white px-3 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-800"
              value={tipoContrato}
              onChange={(e) => setTipoContrato(e.target.value)}
            >
              <option value="indefinido">Indefinido (Con AFC 0.6%)</option>
              <option value="fijo">Plazo Fijo / Obra</option>
              <option value="sueldo_empresarial">👑 Sueldo Empresarial (Socio - Sin AFC)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Previsión AFP</label>
            <select 
              id="field_afpcode" 
              name="field_afpcode"
              className="w-full h-11 rounded-xl border border-primary/15 bg-white px-3 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-800"
              value={afpCode}
              onChange={(e) => setAfpCode(e.target.value)}
            >
              {afps.map(a => (
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
              id="field_saludcode" 
              name="field_saludcode"
              className="w-full h-11 rounded-xl border border-primary/15 bg-white px-3 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-800"
              value={saludCode}
              onChange={(e) => {
                setSaludCode(e.target.value);
                if (e.target.value === "FONASA") setPlanSaludUf(0);
              }}
            >
              <option value="FONASA">FONASA (7%)</option>
              <option value="ISAPRE">ISAPRE (Pactado)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="planSaludUf" className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Plan Isapre (UF)</label>
            <input
              id="planSaludUf"
              name="planSaludUf"
              type="number"
              step="0.01"
              disabled={saludCode === "FONASA"}
              className="w-full h-11 rounded-xl border border-primary/15 bg-white px-3 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 text-slate-800"
              value={planSaludUf}
              onChange={(e) => setPlanSaludUf(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
        </div>

        {/* Asignaciones no imponibles y Cargas Familiares */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="asignacionMovilizacion" className="text-[9px] font-black uppercase tracking-widest text-slate-500 block truncate">Movilización ($)</label>
            <input
              id="asignacionMovilizacion"
              name="asignacionMovilizacion"
              type="number"
              className="w-full h-10 rounded-xl border border-primary/15 bg-white px-2.5 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={asignacionMovilizacion}
              onChange={(e) => setAsignacionMovilizacion(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="asignacionColacion" className="text-[9px] font-black uppercase tracking-widest text-slate-500 block truncate">Colación ($)</label>
            <input
              id="asignacionColacion"
              name="asignacionColacion"
              type="number"
              className="w-full h-10 rounded-xl border border-primary/15 bg-white px-2.5 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={asignacionColacion}
              onChange={(e) => setAsignacionColacion(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cargasFamiliares" className="text-[9px] font-black uppercase tracking-widest text-slate-500 block truncate">Cargas Fam.</label>
            <input
              id="cargasFamiliares"
              name="cargasFamiliares"
              type="number"
              min="0"
              max="10"
              className="w-full h-10 rounded-xl border border-primary/15 bg-white px-2.5 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={cargasFamiliares}
              onChange={(e) => setCargasFamiliares(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>

        {/* Toggles Rápidos */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pt-3 border-t border-neutral-100">
          <label htmlFor="gratificacion" className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="gratificacion"
              name="gratificacion"
              type="checkbox"
              checked={gratificacion}
              onChange={(e) => setGratificacion(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-slate-300 text-primary focus:ring-primary/10"
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-700">Gratificación Legal</span>
              <span className="text-[8px] text-slate-400 font-bold italic">Art. 50 (25% tope)</span>
            </div>
          </label>

          <label htmlFor="esZonaExtrema" className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="esZonaExtrema"
              name="esZonaExtrema"
              type="checkbox"
              checked={esZonaExtrema}
              onChange={(e) => setEsZonaExtrema(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-slate-300 text-primary focus:ring-primary/10"
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-700">Zona Extrema</span>
              <span className="text-[8px] text-emerald-600 font-black italic">Ley 19.853 (17% TGR)</span>
            </div>
          </label>
        </div>

        {esZonaExtrema && (
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Región Austral Beneficiaria</label>
            <select 
              id="field_zonaextrema" 
              name="field_zonaextrema"
              className="w-full h-11 rounded-xl border border-primary/20 bg-emerald-50/50 px-3 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all text-emerald-950"
              value={zonaExtrema}
              onChange={(e) => setZonaExtrema(e.target.value)}
            >
              {Object.entries(ZONAS_EXTREMAS).map(([code, zone]) => (
                <option key={code} value={code}>{zone.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: DESGLOSE Y REPORTES */}
      <div className="lg:col-span-7 space-y-6">
        {result ? (
          <div className="space-y-6">
            
            {/* Tarjetas KPI de Resultados Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-2xl p-5 text-center space-y-1">
                <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600" /> Sueldo Imponible
                </p>
                <p className="text-2xl font-black text-emerald-950 tracking-tighter">{formatCLP(result.brutoImponible)}</p>
                <p className="text-[8.5px] font-bold text-slate-400 italic">Base de cálculo cotizaciones</p>
              </div>

              <div className="bg-primary/[0.04] border border-primary/15 rounded-2xl p-5 text-center space-y-1">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center justify-center gap-1">
                  <DollarSign className="w-3 h-3 text-primary" /> Sueldo Líquido
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCLP(result.sueldoLiquido)}</p>
                <p className="text-[8.5px] font-bold text-slate-400 italic">Monto directo a bolsillo</p>
              </div>

              <div className="bg-slate-500/[0.04] border border-slate-500/15 rounded-2xl p-5 text-center space-y-1">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Building className="w-3 h-3 text-slate-600" /> Planilla Previred
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCLP(result.totalPrevired)}</p>
                <p className="text-[8.5px] font-bold text-slate-400 italic">Retenciones + Aportes empresa</p>
              </div>
            </div>

            {/* 🏔️ PANEL INTELIGENTE LEY N° 19.853 (BONIFICACIÓN 17% TGR & RECUPERACIÓN) */}
            {esZonaExtrema && (
              <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-zinc-950 text-white rounded-[2rem] p-6 sm:p-8 border border-emerald-500/30 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                        Análisis Ley N° 19.853 • Bonificación TGR 17% (Magallanes)
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        Subsidio fiscal a la mano de obra depositado mensualmente a la cuenta de la empresa
                      </p>
                    </div>
                  </div>
                  
                  {tipoContrato === "sueldo_empresarial" ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" /> Socio Dueño: Bono TGR Bloqueado por Autojefatura
                    </span>
                  ) : result.cumplePisoMagallanes19853 ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Califica Piso (&gt;$646.800)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" /> Requiere Sueldo &gt; $646.800
                    </span>
                  )}
                </div>

                {/* 👑 PANEL ESCUDO FISCAL SII (EXCLUSIVO CUANDO ESTÁ ACTIVO SUELDO EMPRESARIAL) */}
                {tipoContrato === "sueldo_empresarial" && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-emerald-950/80 border border-indigo-400/30 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">👑</span>
                        <div>
                          <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-300">
                            Escudo Fiscal SII • Sueldo Empresarial (Art. 31 N° 6 LIR)
                          </h5>
                          <p className="text-[10px] text-zinc-300">
                            Tu beneficio real como socio/dueño está en el ahorro de Impuesto a la Renta (F22) y exención de AFC, NO en el bono TGR:
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2.5 py-1 rounded-full">
                        100% Gasto Aceptado SII
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-black/40 border border-indigo-400/20 space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 block">
                          Rebaja Utilidad Anual (SII)
                        </span>
                        <p className="text-xl font-black text-white">{formatCLP(result.gastoAceptadoAnualSii)}</p>
                        <p className="text-[9px] text-zinc-400">{formatCLP(result.gastoAceptadoMensualSii)}/mes deducibles</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-400/25 space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block">
                          Ahorro Impuesto Renta (F22)
                        </span>
                        <p className="text-xl font-black text-emerald-400">{formatCLP(result.ahorroRentaAnual25)}/año</p>
                        <p className="text-[9px] text-zinc-400">
                          Tasa 25% ({formatCLP(result.ahorroRentaAnual125)} al 12,5% ProPyme)
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-sky-400/20 space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-sky-300 block">
                          Ahorro Exención AFC (3%)
                        </span>
                        <p className="text-xl font-black text-sky-300">{formatCLP(result.ahorroAfcAnual)}/año</p>
                        <p className="text-[9px] text-zinc-400">{formatCLP(result.ahorroAfcMensual)}/mes ahorrados en AFC</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selector de Realidad TGR (Con Tope Legal IPC vs 17% Teórico Sin Tope) */}
                {result.cumplePisoMagallanes19853 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/40 p-2 rounded-2xl border border-white/10">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-300 pl-2">
                      {tipoContrato === "sueldo_empresarial"
                        ? "Simulación Referencial TGR (Solo aplica a Empleados Dependientes):"
                        : "Criterio de Cálculo TGR:"}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setModoTgrConTope(true)}
                        className={`px-3 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          modoTgrConTope
                            ? "bg-emerald-500 text-slate-950 shadow-sm"
                            : "text-zinc-400 hover:text-white bg-white/5"
                        }`}
                      >
                        🔒 Tope Real TGR ({formatCLP(result.bonificacionTgrTopeIpc)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoTgrConTope(false)}
                        className={`px-3 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          !modoTgrConTope
                            ? "bg-amber-400 text-slate-950 shadow-sm"
                            : "text-zinc-400 hover:text-white bg-white/5"
                        }`}
                      >
                        🧮 17% Sin Tope ({formatCLP(result.bonificacionLey19853)})
                      </button>
                    </div>
                  </div>
                )}

                {/* Métricas de Reembolso y Porcentajes de Recuperación */}
                {result.cumplePisoMagallanes19853 ? (
                  <div className="space-y-5">
                    {(() => {
                      const bonoActivo = modoTgrConTope ? result.bonificacionTgrTopeIpc : result.bonificacionLey19853;
                      const pctSueldoActivo = modoTgrConTope
                        ? (tipoContrato === "sueldo_empresarial" ? result.porcentajeRecuperacionSueldoEmpresarialReal : result.porcentajeRecuperacionRetencionesReal)
                        : (tipoContrato === "sueldo_empresarial" ? result.porcentajeRecuperacionSueldoEmpresarial : result.porcentajeRecuperacionRetenciones);
                      const pctPreviredActivo = modoTgrConTope
                        ? result.porcentajeRecuperacionPreviredReal
                        : result.porcentajeRecuperacionPrevired;

                      return (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block">
                                {modoTgrConTope ? "Abono Real TGR (Topado)" : "Reembolso 17% (Sin Tope)"}
                              </span>
                              <p className="text-2xl font-black text-white tracking-tight">{formatCLP(bonoActivo)}</p>
                              <p className="text-[9px] text-zinc-400">
                                {modoTgrConTope
                                  ? `17% sobre tope legal ${formatCLP(result.topeImponibleTgrIpc)}`
                                  : `17% directo sobre ${formatCLP(result.brutoImponible)}`}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block">
                                Recuperado del Sueldo
                              </span>
                              <p className="text-2xl font-black text-emerald-400 tracking-tight">
                                {pctSueldoActivo}%
                              </p>
                              <p className="text-[9px] text-zinc-400">
                                {modoTgrConTope
                                  ? `Recuperación efectiva con tope TGR`
                                  : (tipoContrato === "sueldo_empresarial" ? "Cubre el 97,2% de Salud + AFP" : "Cubre casi el 94% de retenciones")}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block">
                                Recuperado de Previred
                              </span>
                              <p className="text-2xl font-black text-emerald-400 tracking-tight">
                                {pctPreviredActivo}%
                              </p>
                              <p className="text-[9px] text-zinc-400">Sobre la planilla total pagada</p>
                            </div>
                          </div>

                          {/* Explicación del Doble Candado cuando está en modo Real vs Sin Tope */}
                          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10.5px] text-amber-200/95 leading-relaxed">
                            <strong>⚖️ La Paradoja de Magallanes (Doble Candado Legal):</strong> La Ley N° 19.853 exige pagar un sueldo imponible mayor a <strong>$646.800</strong> (+20% IMM) para activar el beneficio, pero calcula el 17% solo hasta el <strong>tope imponible histórico reajustado por IPC ({formatCLP(result.topeImponibleTgrIpc)} en 2026 / $271.686 en 2025)</strong>. Por eso TGR deposita un máximo real de <strong>{formatCLP(result.bonificacionTgrTopeIpc)}</strong> mensuales por trabajador (y no {formatCLP(result.bonificacionLey19853)}).
                          </div>

                          {/* Tabla Comparativa de Recuperación */}
                          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                            <table className="w-full text-left text-xs font-mono">
                              <thead className="bg-white/5 text-[9px] uppercase tracking-wider text-zinc-300">
                                <tr>
                                  <th className="p-3">Concepto Analizado</th>
                                  <th className="p-3">Monto Previred</th>
                                  <th className="p-3 text-emerald-400">
                                    {modoTgrConTope ? "Abono Real TGR" : "17% Sin Tope"}
                                  </th>
                                  <th className="p-3 text-right">% Recuperado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-zinc-300 text-xs">
                                <tr>
                                  <td className="p-3 font-sans font-bold">Retenciones del Sueldo (Trabajador)</td>
                                  <td className="p-3">{formatCLP(result.retencionesPrevisionalesSueldo)}</td>
                                  <td className="p-3 text-emerald-400 font-bold">{formatCLP(bonoActivo)}</td>
                                  <td className="p-3 text-right font-black text-emerald-400">
                                    {pctSueldoActivo}%
                                  </td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-sans font-bold">Total Previred (Inc. Aportes Patronales)</td>
                                  <td className="p-3">{formatCLP(result.totalPrevired)}</td>
                                  <td className="p-3 text-emerald-400 font-bold">{formatCLP(bonoActivo)}</td>
                                  <td className="p-3 text-right font-black text-emerald-400">{pctPreviredActivo}%</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}

                    {/* Nota Legal & Advertencia Sueldo Empresarial */}
                    <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                      tipoContrato === "sueldo_empresarial"
                        ? "bg-rose-500/10 border-rose-500/30"
                        : "bg-emerald-500/10 border-emerald-500/20"
                    }`}>
                      <div className="flex items-start gap-2">
                        <Info className={`w-4 h-4 shrink-0 mt-0.5 ${
                          tipoContrato === "sueldo_empresarial" ? "text-rose-400" : "text-emerald-400"
                        }`} />
                        <div className="space-y-1.5">
                          <p className="text-zinc-200 text-[11px] leading-relaxed">
                            {tipoContrato === "sueldo_empresarial" ? (
                              <span>
                                ⚠️ <strong>Estrategia Blindada (Separación Tributaria vs. Laboral):</strong> Usa tu Sueldo Empresarial para rebajar <strong>{formatCLP(result.gastoAceptadoAnualSii)}/año</strong> de utilidad en el SII y ahorrar <strong>{formatCLP(result.ahorroAfcAnual)}/año</strong> en AFC, pero <strong>NO solicites el 17% a la TGR por tu propio RUT de socio dueño</strong> (al no existir subordinación laboral bajo el Código del Trabajo, TGR/Contraloría objetan el pago automático en auditorías y exigen su restitución con multas). Reserva el bono de <strong>{formatCLP(result.bonificacionTgrTopeIpc)}/mes</strong> para tus empleados contratados.
                              </span>
                            ) : (
                              <span>
                                💡 <strong>¿Eres el dueño o socio de la SpA/Ltda?:</strong> El Sueldo Empresarial te exime del 3% de AFC y rebaja <strong>{formatCLP(result.gastoAceptadoAnualSii)}/año</strong> como gasto aceptado en el SII (ahorrando hasta <strong>{formatCLP(result.ahorroRentaAnual25)}/año</strong> en Impuesto a la Renta), aunque te excluye de pedir el bono TGR por falta de subordinación laboral.
                              </span>
                            )}
                          </p>
                          {tipoContrato !== "sueldo_empresarial" ? (
                            <button
                              type="button"
                              onClick={() => setTipoContrato("sueldo_empresarial")}
                              className="text-[10px] font-black uppercase text-emerald-400 underline hover:text-emerald-300 transition-colors pt-1 cursor-pointer block"
                            >
                              ➔ Simular como Sueldo Empresarial (Ver Escudo Fiscal SII y Exención AFC)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setTipoContrato("indefinido")}
                              className="text-[10px] font-black uppercase text-rose-300 underline hover:text-white transition-colors pt-1 cursor-pointer block"
                            >
                              ➔ Volver a Contrato Indefinido (Empleado Externo con Derecho a Bono TGR)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acordeón de las 5 Letras Chicas de TGR y SII */}
                    <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setMostrarLetraChica(!mostrarLetraChica)}
                        className="w-full p-3.5 flex items-center justify-between text-left text-[10px] font-black uppercase tracking-wider text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          Las 5 &ldquo;Letras Chicas&rdquo; de TGR y SII que debes conocer
                        </span>
                        <span className="text-zinc-400">{mostrarLetraChica ? "▲ Ocultar" : "▼ Ver Detalle"}</span>
                      </button>
                      {mostrarLetraChica && (
                        <div className="p-4 pt-1 border-t border-white/10 text-[10.5px] text-zinc-300 space-y-2 leading-relaxed">
                          <p>
                            <strong className="text-white">1. Tope Imponible Real ({formatCLP(result.topeImponibleTgrIpc)}):</strong> El 17% NO se paga hasta las 90 UF ni hasta el Grado 1A; tiene su propio techo reajustado por IPC ($271.686 en 2025 = $46.187; {formatCLP(result.topeImponibleTgrIpc)} en 2026 = {formatCLP(result.bonificacionTgrTopeIpc)} máx. por trabajador).
                          </p>
                          <p>
                            <strong className="text-white">2. Muerte Súbita por Atraso (Día 13):</strong> Si pagas PreviRed el día 14 (1 solo día fuera del plazo legal electrónico), <strong>pierdes el 100% del bono TGR de ese mes</strong> de forma irreversible.
                          </p>
                          <p>
                            <strong className="text-white">3. Paga Impuesto a la Renta (Art. 29 LIR):</strong> El SII dictaminó que el bono Ley 19.853 <strong>NO es ingreso no renta</strong>; es un ingreso bruto tributable que paga Impuesto de Primera Categoría (12,5% / 25%).
                          </p>
                          <p>
                            <strong className="text-white">4. Prohibido Teletrabajo fuera de Magallanes:</strong> El trabajador debe vivir y trabajar físicamente de forma permanente en la zona. Incluir remotos de otras regiones constituye <strong>delito de Fraude al Fisco</strong>.
                          </p>
                          <p>
                            <strong className="text-white">5. Exclusiones Legales:</strong> No aplica para boletas de honorarios, trabajadoras de casa particular, bancos, financieras, aseguradoras ni gran minería.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400" /> Requisito legal Ley 19.853 en Magallanes:
                    </p>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Para acceder a la bonificación fiscal del 17%, la remuneración imponible debe ser superior en un 20% al Sueldo Mínimo mensual (mínimo <strong>$646.800 CLP</strong>). Con el sueldo actual de {formatCLP(result.brutoImponible)}, faltan {formatCLP(Math.max(0, result.pisoMagallanes19853 - result.brutoImponible + 1))} imponibles para activar este subsidio.
                    </p>
                  </div>
                )}
              </div>
            )}

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
                  {result.asignacionFamiliar > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Asignación Familiar (Tramo {result.tramoAsignacion} - {result.cargasFamiliares} cargas):</span>
                      <span className="font-bold text-emerald-600">+{formatCLP(result.asignacionFamiliar)}</span>
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
                  <Percent className="w-3.5 h-3.5 text-rose-600" /> Retenciones Legales (Descuentos al Sueldo)
                </h4>
                <div className="font-mono text-xs space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span>AFP ({afpCode} - 10% + comisión):</span>
                    <span className="font-bold text-rose-600">-{formatCLP(result.afp + result.afpComision)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Salud ({saludCode} - {saludCode === "FONASA" ? "7%" : `${formatCLP(result.saludTotal)} total`}):</span>
                    <span className="font-bold text-rose-600">-{formatCLP(result.saludTotal)}</span>
                  </div>
                  {result.afcTrabajador > 0 ? (
                    <div className="flex justify-between text-slate-700">
                      <span>Seguro Cesantía (AFC 0.6%):</span>
                      <span className="font-bold text-rose-600">-{formatCLP(result.afcTrabajador)}</span>
                    </div>
                  ) : (
                    tipoContrato === "sueldo_empresarial" && (
                      <div className="flex justify-between text-slate-400 italic">
                        <span>Seguro Cesantía (AFC):</span>
                        <span>Exento (Sueldo Empresarial)</span>
                      </div>
                    )
                  )}
                  {result.impuestoUnico > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Impuesto Único Segunda Categoría:</span>
                      <span className="font-bold text-rose-700">-{formatCLP(result.impuestoUnico)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-sans font-black text-xs text-slate-900">
                    <span>Subtotal Descuentos al Sueldo:</span>
                    <span className="text-rose-600">-{formatCLP(result.totalDescuentosLegales)}</span>
                  </div>
                </div>
              </div>

              {/* Cargos Patronales y Planilla Previred */}
              <div className="space-y-2 pb-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-600" /> Aportes del Empleador (Cargos Empresa)
                </h4>
                <div className="font-mono text-xs space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span>Seguro Invalidez (SIS {legalParams.sis_pct}%):</span>
                    <span className="font-bold">{formatCLP(result.sisEmpresa)}</span>
                  </div>
                  {result.afcEmpresa > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Aporte AFC Empleador:</span>
                      <span className="font-bold">{formatCLP(result.afcEmpresa)}</span>
                    </div>
                  )}
                  {result.mutualEmpresa > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Mutual de Seguridad + Ley SANNA ({legalParams.mutual_pct}%):</span>
                      <span className="font-bold">{formatCLP(result.mutualEmpresa)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-sans font-black text-xs text-slate-900">
                    <span>Total Aportes de la Empresa:</span>
                    <span>{formatCLP(result.totalCargosEmpresa)}</span>
                  </div>
                  <div className="flex justify-between border-t border-emerald-500/20 bg-emerald-50/50 p-2.5 rounded-xl font-sans font-black text-xs text-emerald-950">
                    <span>Total Planilla Pagada en Previred:</span>
                    <span className="text-emerald-700">{formatCLP(result.totalPrevired)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rebaja Tributaria Asignación de Zona (Art. 29 DL 889) */}
            {esZonaExtrema && result.asignacionZonaExtrema > 0 && (
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-5 flex gap-4 text-sky-900">
                <Shield className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-black text-[10px] uppercase tracking-wider">Beneficio Tributario Trabajador (Art. 29 DL 889)</h5>
                  <p className="text-[10.5px] leading-relaxed text-sky-900/90 font-medium">
                    Deducción de base tributable por asignación de zona: <strong>{formatCLP(result.asignacionZonaExtrema)}</strong> y rebaja de impuesto determinado de <strong>{formatCLP(result.rebajaZonaExtrema)}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* CTA de Conversión al Software */}
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/[0.07] via-sky-500/[0.02] to-transparent border border-primary/20 space-y-4 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0 mt-0.5">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">Plataforma ContaPyme Magallanes</span>
                  <h4 className="text-sm font-black italic tracking-tighter uppercase text-slate-800 leading-tight">
                    ¿Quieres liquidar sueldos con bonificación DL 889 y LRE automático?
                  </h4>
                  <p className="text-[10.5px] leading-relaxed text-slate-500 font-medium">
                    ContaPymePUQ genera tus liquidaciones masivas de sueldo, aplica las exenciones de la Ley 19.853 y envía el archivo oficial del Libro de Remuneraciones Electrónico (LRE) a la Dirección del Trabajo en un clic.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prueba gratuita de 14 días</span>
                <Link href="/login">
                  <Button className="rounded-xl font-black uppercase tracking-widest text-[9px] bg-primary hover:shadow-lg hover:shadow-primary/20 transition-all h-9 px-5">
                    Probar ContaPyme Gratis →
                  </Button>
                </Link>
              </div>
            </div>

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
            Calculadora de Sueldo <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-sky-600 to-blue-500 font-extrabold">Inteligente Chile</span>
          </h2>
          <p className="text-neutral-500 font-bold italic text-xs leading-relaxed max-w-lg mx-auto">
            Simula en tiempo real sueldo líquido, bruto imponible o base contractual con leyes sociales de Previred y beneficios de Zona Extrema (Ley 19.853 / D.L. 889).
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
