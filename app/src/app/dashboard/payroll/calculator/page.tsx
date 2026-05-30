"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calculator, 
  Percent, 
  Info, 
  Shield, 
  DollarSign, 
  Building, 
  Check,
  TrendingUp,
  FileText,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateBaseSalaryAction } from "@/actions/payroll";
import { toast } from "sonner";

const AFPS = [
  { code: "HABITAT", name: "Habitat", commission: 1.27 },
  { code: "CAPITAL", name: "Capital", commission: 1.44 },
  { code: "CUPRUM", name: "Cuprum", commission: 1.44 },
  { code: "MODELO", name: "Modelo", commission: 0.58 },
  { code: "PLANVITAL", name: "Planvital", commission: 1.16 },
  { code: "UNO", name: "Uno", commission: 0.69 },
  { code: "PROVIDA", name: "Provida", commission: 1.45 }
];

const formatCLP = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);

export default function SalaryCalculatorPage() {
  const [targetLiquido, setTargetLiquido] = useState<number>(1000000);
  const [periodo, setPeriodo] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [gratificacionLegal, setGratificacionLegal] = useState<boolean>(true);
  const [afpCode, setAfpCode] = useState<string>("HABITAT");
  const [saludCode, setSaludCode] = useState<string>("FONASA");
  const [planSaludUf, setPlanSaludUf] = useState<number>(0);
  const [tipoContrato, setTipoContrato] = useState<string>("indefinido");
  const [asignacionMovilizacion, setAsignacionMovilizacion] = useState<number>(0);
  const [asignacionColacion, setAsignacionColacion] = useState<number>(0);
  const [esZonaExtrema, setEsZonaExtrema] = useState<boolean>(false);
  const [zonaExtrema, setZonaExtrema] = useState<string>("MAGALLANES");

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await calculateBaseSalaryAction({
        target_liquido: targetLiquido,
        periodo,
        gratificacion_legal: gratificacionLegal,
        afp_code: afpCode,
        salud_code: saludCode,
        plan_salud_uf: planSaludUf,
        tipo_contrato: tipoContrato,
        asignacion_movilizacion: asignacionMovilizacion,
        asignacion_colacion: asignacionColacion,
        es_zona_extrema: esZonaExtrema,
        zona_extrema: zonaExtrema
      });

      if (res.success) {
        setResult(res.data);
        toast.success("Cálculo realizado con éxito");
      } else {
        toast.error(res.error || "Error al calcular el sueldo base");
      }
    } catch (err) {
      toast.error("Ocurrió un error al procesar el cálculo inverso");
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar el cálculo inicial
  useEffect(() => {
    handleCalculate();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700">
      {/* ===== CABECERA ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <Link href="/dashboard/payroll" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 mb-3 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a Remuneraciones
          </Link>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-2">
            Calculadora de <span className="text-primary italic">Sueldo Inverso</span>
          </h1>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary opacity-50" />
            Ingresa el líquido deseado para determinar el sueldo base y leyes sociales requeridas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PANEL DE CONFIGURACIÓN */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="bg-card border-border shadow-2xl rounded-[2rem] overflow-hidden border-t-8 border-t-primary/20">
            <CardHeader className="bg-muted/5 border-b border-border p-8">
              <CardTitle className="text-lg font-black uppercase text-foreground">Configuración de Sueldo</CardTitle>
              <CardDescription className="text-xs italic font-bold">Ajusta los parámetros para el cálculo del sueldo bruto y base.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              
              {/* Sueldo Líquido Deseado */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Sueldo Líquido Objetivo ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground font-black text-sm">
                    $
                  </div>
                  <input
                    type="number"
                    className="flex h-12 w-full rounded-xl border border-border bg-white pl-8 pr-4 py-2 text-sm font-black tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={targetLiquido}
                    onChange={(e) => setTargetLiquido(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>

              {/* Periodo y Contrato */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Periodo Fiscal</label>
                  <input
                    type="month"
                    className="flex h-12 w-full rounded-xl border border-border bg-white px-4 py-2 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Tipo de Contrato</label>
                  <select
                    className="flex h-12 w-full rounded-xl border border-border bg-white px-4 py-2 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={tipoContrato}
                    onChange={(e) => setTipoContrato(e.target.value)}
                  >
                    <option value="indefinido">Indefinido</option>
                    <option value="fijo">Plazo Fijo / Obra</option>
                  </select>
                </div>
              </div>

              {/* Gratificación y Zona Extrema */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={gratificacionLegal}
                    onChange={(e) => setGratificacionLegal(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-foreground">Gratificación</span>
                    <span className="text-[9px] text-muted-foreground font-bold italic">Art. 50 (25%)</span>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={esZonaExtrema}
                    onChange={(e) => setEsZonaExtrema(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-foreground">Zona Extrema</span>
                    <span className="text-[9px] text-muted-foreground font-bold italic">Deducción DL 889</span>
                  </div>
                </label>
              </div>

              {/* AFP Previsión */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Administradora de Fondos de Pensiones (AFP)</label>
                <select
                  className="flex h-12 w-full rounded-xl border border-border bg-white px-4 py-2 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={afpCode}
                  onChange={(e) => setAfpCode(e.target.value)}
                >
                  {AFPS.map((afp) => (
                    <option key={afp.code} value={afp.code}>
                      {afp.name} ({afp.commission}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Salud Previsión */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Sistema de Salud</label>
                  <select
                    className="flex h-12 w-full rounded-xl border border-border bg-white px-4 py-2 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Plan Salud (UF)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={saludCode === "FONASA"}
                    className="flex h-12 w-full rounded-xl border border-border bg-white px-4 py-2 text-xs font-black tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                    value={planSaludUf}
                    onChange={(e) => setPlanSaludUf(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
              </div>

              {/* Asignaciones no imponibles */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Asig. Movilización ($)</label>
                  <input
                    type="number"
                    className="flex h-12 w-full rounded-xl border border-border bg-white px-4 py-2 text-xs font-black tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={asignacionMovilizacion}
                    onChange={(e) => setAsignacionMovilizacion(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Asig. Colación ($)</label>
                  <input
                    type="number"
                    className="flex h-12 w-full rounded-xl border border-border bg-white px-4 py-2 text-xs font-black tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={asignacionColacion}
                    onChange={(e) => setAsignacionColacion(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>

              <Button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl h-12 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all gap-2 mt-4"
              >
                {loading ? "CALCULANDO..." : "CALCULAR SUELDO BASE"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* REPORTE DE RESULTADOS */}
        <div className="lg:col-span-7 space-y-8">
          {result ? (
            <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-600/20">
              <CardHeader className="bg-muted/5 border-b border-border p-10">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Resultado del Cálculo</CardTitle>
                    <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                      SUELDO BASE CONVERGIDO Y DESGLOSE PREVISIONAL
                    </CardDescription>
                  </div>
                  <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-xl shadow-emerald-600/20">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </CardHeader>
              
              {/* Resumen de KPI */}
              <div className="grid grid-cols-2 gap-0 border-b border-border bg-emerald-600/5">
                <div className="px-10 py-6 border-r border-border/50">
                  <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Sueldo Base Requerido</p>
                  <p className="text-2xl font-black text-emerald-950 tracking-tighter">{formatCLP(result.sueldo_base)}</p>
                </div>
                <div className="px-10 py-6">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Costo Total Empleador</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">
                    {formatCLP(result.liquidacion.total_haberes_brutos + result.liquidacion.afc_empresa + result.liquidacion.sis_empresa)}
                  </p>
                </div>
              </div>

              <CardContent className="p-10 space-y-8">
                
                {/* Desglose Haberes */}
                <div className="space-y-4">
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-700 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Detalle de Haberes (Ingresos)
                  </h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-3 font-mono text-xs text-foreground">
                    <div className="flex justify-between">
                      <span className="font-sans font-bold text-slate-600">Sueldo Base</span>
                      <span className="font-bold">{formatCLP(result.sueldo_base)}</span>
                    </div>
                    {result.liquidacion.gratificacion > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans font-bold text-slate-600">Gratificación Legal (Art. 50)</span>
                        <span className="font-bold">{formatCLP(result.liquidacion.gratificacion)}</span>
                      </div>
                    )}
                    {result.liquidacion.asignacion_movilizacion > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans font-bold text-slate-600">Asignación de Movilización</span>
                        <span className="font-bold">{formatCLP(result.liquidacion.asignacion_movilizacion)}</span>
                      </div>
                    )}
                    {result.liquidacion.asignacion_colacion > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans font-bold text-slate-600">Asignación de Colación</span>
                        <span className="font-bold">{formatCLP(result.liquidacion.asignacion_colacion)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-dashed border-border pt-3 font-black text-sm">
                      <span className="font-sans text-foreground">Total Haberes Brutos</span>
                      <span>{formatCLP(result.liquidacion.total_haberes_brutos)}</span>
                    </div>
                  </div>
                </div>

                {/* Desglose Descuentos */}
                <div className="space-y-4">
                  <h4 className="font-black text-xs uppercase tracking-widest text-rose-700 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-rose-600" /> Retenciones y Descuentos Legales
                  </h4>
                  <div className="bg-rose-50/30 border border-rose-100/50 rounded-2xl p-6 space-y-3 font-mono text-xs text-rose-950">
                    <div className="flex justify-between">
                      <span className="font-sans font-bold text-rose-800/80">Cotización Previsional AFP ({result.liquidacion.afp_code})</span>
                      <span className="font-bold">{formatCLP(result.liquidacion.afp + result.liquidacion.afp_comision)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans font-bold text-rose-800/80">Cotización de Salud ({result.liquidacion.salud_code})</span>
                      <span className="font-bold">{formatCLP(result.liquidacion.salud_total)}</span>
                    </div>
                    {result.liquidacion.afc_trabajador > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans font-bold text-rose-800/80">Seguro de Cesantía (AFC Trabajador)</span>
                        <span className="font-bold">{formatCLP(result.liquidacion.afc_trabajador)}</span>
                      </div>
                    )}
                    {result.liquidacion.impuesto_unico > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans font-bold text-rose-800/80">Impuesto Único de Segunda Categoría</span>
                        <span className="font-bold text-rose-700">{formatCLP(result.liquidacion.impuesto_unico)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-dashed border-rose-200/50 pt-3 font-black text-sm text-rose-900">
                      <span className="font-sans">Total Descuentos Legales</span>
                      <span>-{formatCLP(result.liquidacion.total_descuentos)}</span>
                    </div>
                  </div>
                </div>

                {/* Aportes Patronales */}
                <div className="space-y-4">
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-700 flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-600" /> Aportes y Costos del Empleador (Empresa)
                  </h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-3 font-mono text-xs text-slate-800">
                    <div className="flex justify-between">
                      <span className="font-sans font-bold text-slate-600">Seguro de Invalidez y Sobrevivencia (SIS)</span>
                      <span className="font-bold">{formatCLP(result.liquidacion.sis_empresa)}</span>
                    </div>
                    {result.liquidacion.afc_empresa > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans font-bold text-slate-600">Aporte AFC Empleador</span>
                        <span className="font-bold">{formatCLP(result.liquidacion.afc_empresa)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-dashed border-border pt-3 font-black text-sm">
                      <span className="font-sans text-foreground">Total Aportes Patronales</span>
                      <span>{formatCLP(result.liquidacion.sis_empresa + result.liquidacion.afc_empresa)}</span>
                    </div>
                  </div>
                </div>

                {/* Exención Zona Extrema */}
                {esZonaExtrema && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4 text-blue-900">
                    <Shield className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-black text-xs uppercase tracking-wider mb-1">Beneficios aplicados de Zona Extrema (Magallanes)</h5>
                      <p className="text-[11px] leading-relaxed text-blue-800">
                        Se ha calificado la liquidación con la rebaja tributaria correspondiente al decreto DL 889. 
                        Esto reduce la base del Impuesto Único de Segunda Categoría, optimizando la tributación del trabajador para alcanzar el líquido deseado con un menor costo imponible.
                      </p>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-muted/5 border-2 border-dashed border-border rounded-[2.5rem] min-h-[400px]">
              <div className="bg-muted/10 p-6 rounded-full mb-6">
                <Calculator className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
              </div>
              <h3 className="font-black uppercase tracking-tight text-slate-700">Calculadora Lista</h3>
              <p className="text-xs text-muted-foreground font-bold italic mt-2 max-w-xs">
                Ajusta las opciones a la izquierda y presiona calcular para ver el desglose financiero detallado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
