"use client";

import { useEffect, useState, useMemo, useDeferredValue, memo, useTransition, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck, Users, TrendingUp, TrendingDown, BarChart3,
  Activity, FolderOpen, Download, ChevronUp, ChevronDown, Loader2, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getRCVDashboardData } from "@/actions/rcv";
import { generateAccountingFromRCV } from "@/actions/accounting";
import { formatCLP, formatPeriodo } from "@/lib/rcv-utils";
import { toast } from "sonner";

// Carga dinámica de gráficos para evitar bloqueo de hidratación (SSR: False)
const AnalysisBarChart = dynamic(() => import("./rcv-charts").then(mod => mod.AnalysisBarChart), { 
  ssr: false,
  loading: () => <div className="h-[320px] w-full bg-muted/5 animate-pulse rounded-3xl" />
});
const AnalysisPieChart = dynamic(() => import("./rcv-charts").then(mod => mod.AnalysisPieChart), { 
  ssr: false,
  loading: () => <div className="h-[320px] w-full bg-muted/5 animate-pulse rounded-3xl" />
});

// ==========================================
// TIPOS
// ==========================================
interface TopEntity {
  rut: string;
  nombre: string;
  total: number;
  monto_calculado: number;
  count: number;
  count_suma: number;
  count_resta: number;
  porcentaje: number;
}

interface RCVSummary {
  total_docs_compras: number;
  total_docs_ventas: number;
  monto_compras: number;
  monto_ventas: number;
  monto_calculado_compras: number;
  monto_calculado_ventas: number;
  proveedores_unicos: number;
  clientes_unicos: number;
  balance: number;
}

interface Periodo {
  periodo: string;
  docs_compras: number;
  docs_ventas: number;
}

interface DashboardState {
  periodos: string[];
  summary: RCVSummary | null;
  vendors: TopEntity[];
  customers: TopEntity[];
  loading: boolean;
}

// Los formateadores se movieron a @/lib/rcv-utils

function exportToCSV(entities: TopEntity[], type: "proveedores" | "clientes", periodo: string) {
  const rutKey = type === "proveedores" ? "RUT Proveedor" : "RUT Cliente";
  const header = [rutKey, "Razón Social", "Documentos", "Facturas/Ventas", "Notas Crédito", "Monto Total", "Monto Calculado", "% del Total"];
  const rows = entities.map((e) => [
    e.rut, e.nombre, e.count, e.count_suma, e.count_resta,
    e.total, e.monto_calculado, `${e.porcentaje.toFixed(2)}%`,
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `RCV_${type}_${periodo?.slice(0, 7) || "all"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// SUB-COMPONENTES
// ==========================================
// Tooltip para Recharts (eliminado de aquí, movido a rcv-charts.tsx)

// ==========================================
// COMPONENTES ATÓMICOS MEMOIZADOS
// ==========================================

const EntityRow = memo(({ entity, index, type }: { entity: TopEntity, index: number, type: 'vendor' | 'customer' }) => {
  const isVendor = type === 'vendor';
  return (
    <tr key={entity.rut} className={`hover:bg-${isVendor ? 'primary' : 'emerald-600'}/[0.02] transition-colors group`}>
      <td className="py-6 px-8 text-center text-muted-foreground/40 font-black text-xs">{index + 1}</td>
      <td className="py-6 px-10">
          <span className={`font-mono text-[11px] font-black bg-white px-3 py-1.5 rounded-xl border border-border shadow-sm group-hover:border-${isVendor ? 'primary' : 'emerald-500'}/30 transition-colors uppercase tracking-widest`}>
            {entity.rut}
          </span>
      </td>
      <td className="py-6 px-10">
          <span className="text-foreground font-black uppercase text-xs tracking-tight">{entity.nombre}</span>
      </td>
      <td className="py-6 px-8 text-center">
          <Badge variant="outline" className="font-black border-border shadow-sm">{entity.count}</Badge>
      </td>
      <td className="py-6 px-8 text-center font-black text-emerald-600 text-sm">{entity.count_suma}</td>
      <td className="py-6 px-8 text-center font-black text-rose-600 text-sm">{entity.count_resta > 0 ? `-${entity.count_resta}` : "—"}</td>
      <td className="py-6 px-10 text-right">
          <span className={`font-mono text-sm font-black tracking-tighter block ${entity.monto_calculado >= 0 ? "text-foreground" : "text-rose-600"}`}>
              {formatCLP(entity.monto_calculado)}
          </span>
      </td>
      <td className="py-6 px-10 text-center">
        <span className={`text-[10px] ${isVendor ? 'bg-primary' : 'bg-emerald-600'} text-white rounded-xl px-4 py-2 font-black shadow-lg tracking-widest`}>
          {entity.porcentaje.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
});
EntityRow.displayName = 'EntityRow';

const KPICard = memo(({ label, value, sub, subValue, icon: Icon, color, borderColor, bgIcon, mounted }: any) => (
  <Card className={`bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 ${borderColor} group hover:scale-[1.02] transition-all`}>
    <CardHeader className="p-6 pb-2">
      <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2">
         <Icon className={`h-4 w-4 ${color}`} /> {label}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6 pt-2">
      <div className="text-3xl font-black tracking-tighter text-foreground truncate">{mounted ? value : '---'}</div>
      <div className="flex items-center justify-between mt-2 border-t border-border pt-2">
           <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${bgIcon} shadow-sm border-transparent`}>{sub}</Badge>
           <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{subValue}</span>
      </div>
    </CardContent>
  </Card>
));
KPICard.displayName = 'KPICard';

// Los componentes memoizados de Recharts se movieron a rcv-charts.tsx

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
interface RCVAnalysisProps {
  organizationId: string;
  initialData?: {
    vendors: any[];
    customers: any[];
    summary: any;
    periods: any[];
  }
}

export function RCVAnalysisClient({ organizationId, initialData }: RCVAnalysisProps) {
  // Iniciar siempre en el periodo más reciente (que ya viene ordenado del servidor)
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [state, setState] = useState<DashboardState>({
    periodos: initialData?.periods || [],
    summary: initialData?.summary || null,
    vendors: initialData?.vendors || [],
    customers: initialData?.customers || [],
    loading: !initialData
  });
  const [showCharts, setShowCharts] = useState(!!initialData);
  const [showVendorsTable, setShowVendorsTable] = useState(false);
  const [showCustomersTable, setShowCustomersTable] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

    const [isCentralizing, setIsCentralizing] = useState(false);
  
    // Solución robusta: Diferir el valor de los datos pesados
    const deferredVendors = useDeferredValue(state.vendors);
    const deferredCustomers = useDeferredValue(state.customers);
    const deferredSummary = useDeferredValue(state.summary);
  
    const handleCentralize = async (type: 'purchases' | 'sales') => {
      if (!selectedPeriodo) {
        toast.error("Seleccione un período específico para centralizar.");
        return;
      }
  
      if (!window.confirm(`¿Desea generar los asientos contables para ${type === 'purchases' ? 'COMPRAS' : 'VENTAS'} del período ${formatPeriodo(selectedPeriodo)}?`)) return;
  
      setIsCentralizing(true);
      try {
        const res = await generateAccountingFromRCV({
          organization_id: organizationId,
          periodo: selectedPeriodo,
          type
        });
  
        if (res.success) {
          toast.success(`${res.count || 'Los'} asientos han sido generados en el Libro Diario.`);
        } else {
          toast.error(res.error || "Error al centralizar.");
        }
      } catch (err) {
        toast.error("Error de conexión con el motor contable.");
      } finally {
        setIsCentralizing(false);
      }
    };

  const isFirstFetch = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Si tenemos datos iniciales y es el primer render cliente, omitimos fetch redundante
    if (initialData && isFirstFetch.current) {
      isFirstFetch.current = false;
      return;
    }

    let isCancelled = false;

    async function fetchData() {
      // Si el cliente cambia el periodo, mostramos el loading local
      setIsLoading(true);
      startTransition(() => {
        setState(prev => ({ ...prev, loading: true }));
      });

      try {
        const data = await getRCVDashboardData(organizationId, selectedPeriodo || undefined);
        
        if (isCancelled) return;

        startTransition(() => {
          setState({
            periodos: data.periods,
            vendors: data.vendors,
            customers: data.customers,
            summary: data.summary,
            loading: false
          });
        });

        setTimeout(() => {
          if (!isCancelled) setShowCharts(true);
        }, 300);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchData();
    return () => { isCancelled = true; };
  }, [organizationId, selectedPeriodo, mounted, initialData]);

  const vendorChartData = useMemo(() => deferredVendors.slice(0, 10), [deferredVendors]);
  const customerChartData = useMemo(() => deferredCustomers.slice(0, 10), [deferredCustomers]);
  const periodoLabel = useMemo(() => selectedPeriodo ? formatPeriodo(selectedPeriodo) : "Todos los períodos", [selectedPeriodo]);

  // ELIMINADO: if (!mounted) return null; - Esto causa doble renderizado masivo.
  // En su lugar, usamos el estado inicial de DashboardState que ya tiene loading: true.

  if (!state.loading && state.vendors.length === 0 && state.customers.length === 0 && state.periodos.length === 0) {
    return (
      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/20">
        <CardContent className="py-24 text-center">
          <div className="w-24 h-24 bg-muted/50 rounded-[2rem] border border-border shadow-inner flex items-center justify-center mx-auto mb-6 text-muted-foreground/20">
            <BarChart3 className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-black text-foreground uppercase tracking-widest mb-2">Dataset RCV Secundario</h3>
          <p className="text-muted-foreground text-sm font-bold italic max-w-sm mx-auto">
            El monitor de inteligencia requiere una inyección previa de archivos SII (CSV) para procesar la métrica del período.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8" suppressHydrationWarning>
      
      {/* ---- SELECTOR DE PERÍODO ---- */}
      {state.periodos.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-[2.5rem] border border-border shadow-2xl" suppressHydrationWarning>
          <div className="flex items-center gap-4" suppressHydrationWarning>
              <div className="p-3 bg-muted/50 rounded-2xl border border-border shadow-sm relative" suppressHydrationWarning>
                 {isLoading ? (
                   <Loader2 className="w-6 h-6 text-primary animate-spin" />
                 ) : (
                   <Activity className="w-6 h-6 text-primary" />
                 )}
              </div>
              <div suppressHydrationWarning>
                 <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1 block" suppressHydrationWarning>
                    {isLoading ? "Actualizando Datos..." : "Inteligencia Temporal"}
                 </span>
                 <span className="text-sm text-foreground font-black uppercase tracking-tight" suppressHydrationWarning>
                   {isLoading ? "Cargando período seleccionado" : "Selector de dataset RCV"}
                 </span>
              </div>
          </div>
          <div className="flex gap-2 p-2 bg-muted/30 rounded-[2rem] border border-border overflow-x-auto" suppressHydrationWarning>
            <button
              onClick={() => setSelectedPeriodo("")}
              className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedPeriodo === ""
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-100"
                  : "bg-transparent text-muted-foreground hover:bg-white hover:text-foreground"
              }`}
            >
              VISIÓN GLOBAL
            </button>
            {state.periodos.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriodo(p)}
                className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedPeriodo === p
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-100"
                    : "bg-transparent text-muted-foreground hover:bg-white hover:text-foreground"
                }`}
                suppressHydrationWarning
              >
                {formatPeriodo(p)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- KPIs ---- */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse" suppressHydrationWarning>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-[2.5rem] border-2 border-border/50" suppressHydrationWarning />
          ))}
        </div>
      ) : deferredSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" suppressHydrationWarning>
          <KPICard
            label="Base Compras"
            value={formatCLP(deferredSummary.monto_calculado_compras)}
            sub={`${deferredSummary.total_docs_compras} Docs`}
            subValue="Registros"
            icon={TrendingDown}
            color="text-primary"
            borderColor="border-primary"
            bgIcon="bg-primary/10 text-primary"
            mounted={mounted}
          />
          <KPICard
            label="Base Ventas"
            value={formatCLP(deferredSummary.monto_calculado_ventas)}
            sub={`${deferredSummary.total_docs_ventas} Docs`}
            subValue="Registros"
            icon={TrendingUp}
            color="text-emerald-600"
            borderColor="border-emerald-500"
            bgIcon="bg-emerald-50 text-emerald-700"
            mounted={mounted}
          />
          <KPICard
            label="Red Proveedores"
            value={String(deferredSummary.proveedores_unicos)}
            sub="Compras"
            subValue="Entidades"
            icon={Truck}
            color="text-blue-600"
            borderColor="border-blue-500"
            bgIcon="bg-blue-50 text-blue-700"
            mounted={mounted}
          />
          <KPICard
            label="Cartera Clientes"
            value={String(deferredSummary.clientes_unicos)}
            sub="Ventas"
            subValue="Entidades"
            icon={Users}
            color="text-purple-600"
            borderColor="border-purple-500"
            bgIcon="bg-purple-50 text-purple-700"
            mounted={mounted}
          />
        </div>
      )}

      {/* ---- TABS ANÁLISIS ---- */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse" suppressHydrationWarning>
          <div className="h-[400px] bg-card rounded-[2.5rem] border-2 border-border/50" suppressHydrationWarning />
          <div className="h-[400px] bg-card rounded-[2.5rem] border-2 border-border/50" suppressHydrationWarning />
        </div>
      ) : (
        <Tabs defaultValue="vendors" className="space-y-8" suppressHydrationWarning>
          <TabsList className="bg-card border border-border/50 p-2.5 rounded-[2rem] h-auto w-fit shadow-lg shadow-black/5" suppressHydrationWarning>
            <TabsTrigger value="vendors" className="rounded-2xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl font-black uppercase text-[10px] tracking-[0.2em] px-10 py-3 transition-all data-[state=active]:scale-100 scale-95 opacity-70 data-[state=active]:opacity-100">
              <Truck className="w-4 h-4 mr-3" />
              TOP PROVEEDORES
            </TabsTrigger>
            <TabsTrigger value="customers" className="rounded-2xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-xl font-black uppercase text-[10px] tracking-[0.2em] px-10 py-3 transition-all data-[state=active]:scale-100 scale-95 opacity-70 data-[state=active]:opacity-100">
              <Users className="w-4 h-4 mr-3" />
              TOP CLIENTES
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendors" className="space-y-8 mt-0 focus-visible:outline-none" suppressHydrationWarning>
            {state.vendors.length === 0 ? (
              <Card className="bg-muted/10 border-border rounded-[2.5rem]">
                <CardContent className="py-24 text-center">
                   <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                   <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">
                     Sin transacciones de compra detectadas para {periodoLabel}.
                   </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8" suppressHydrationWarning>
                  <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-500/20" suppressHydrationWarning>
                    <CardHeader className="pb-8 border-b border-border/50 bg-muted/5 p-8" suppressHydrationWarning>
                       <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                         Concentración de Proveedores
                       </CardTitle>
                       <CardDescription className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground italic mt-2">
                         VOLUMEN SEGÚN BASE IMPONIBLE ACTUALIZADA
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                       {showCharts && <AnalysisBarChart data={vendorChartData} />}
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-purple-500/20" suppressHydrationWarning>
                    <CardHeader className="pb-8 border-b border-border/50 bg-muted/5 p-8" suppressHydrationWarning>
                       <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                         Distribución del Mercado
                       </CardTitle>
                       <CardDescription className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground italic mt-2">
                         CUOTA DE PARTICIPACIÓN SOBRE DOCUMENTACIÓN TOTAL
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                       {showCharts && <AnalysisPieChart data={vendorChartData} />}
                    </CardContent>
                  </Card>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-2" suppressHydrationWarning>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none border-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white font-black uppercase text-[10px] tracking-widest rounded-[1.5rem] px-8 h-14 shadow-lg active:scale-95 transition-all"
                    onClick={() => exportToCSV(deferredVendors, "proveedores", selectedPeriodo)}
                    suppressHydrationWarning
                  >
                    <Download className="w-4 h-4 mr-3" />
                    DATA EXPORT CSV
                  </Button>
                  {selectedPeriodo ? (
                    <div className="flex flex-col gap-2 flex-1 sm:flex-none">
                      <Button
                        variant="outline"
                        className="w-full border-2 border-amber-500/20 bg-amber-50/50 text-amber-700 hover:bg-amber-600 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-[1.5rem] px-8 h-14 shadow-lg active:scale-95 transition-all"
                        onClick={() => handleCentralize('purchases')}
                        disabled={isCentralizing}
                      >
                        {isCentralizing ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Activity className="w-4 h-4 mr-3" />}
                        FORZAR RE-CENTRALIZACIÓN
                      </Button>
                      <span className="text-[9px] text-muted-foreground font-semibold px-2">
                        * Use esta opción solo para reconstruir manualmente los asientos de este mes.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 bg-blue-50/50 border border-blue-100 rounded-2xl px-6 py-4 shadow-sm flex-1 sm:flex-none max-w-md">
                      <ShieldCheck className="w-5 h-5 text-blue-600 animate-pulse mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 leading-normal">
                          Centralización Inteligente y Automatizada Activa
                        </span>
                        <span className="text-[10px] text-blue-700 leading-relaxed font-medium">
                          El sistema procesa y genera automáticamente los asientos en el Libro Diario al importar los archivos del SII. Realiza validaciones de integridad en tiempo real (Partida Doble) y previene la duplicidad de documentos de manera inteligente.
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none border-2 border-border/60 bg-white text-foreground hover:bg-muted/50 font-black uppercase text-[10px] tracking-widest rounded-[1.5rem] px-8 h-14 shadow-lg active:scale-95 transition-all"
                    onClick={() => setShowVendorsTable((v) => !v)}
                  >
                    {showVendorsTable ? <ChevronUp className="w-5 h-5 mr-3" /> : <ChevronDown className="w-5 h-5 mr-3" />}
                    {showVendorsTable ? "COLAPSAR REGISTROS" : "DESPLEGAR AUDITORÍA COMPLETA"}
                  </Button>
                </div>

                {showVendorsTable && (
                  <Card className="bg-card border-border shadow-2xl overflow-hidden rounded-[2.5rem] mt-6">
                    <CardHeader className="bg-muted/5 border-b border-border/50 p-8">
                       <CardTitle className="text-lg font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                         <div className="p-2 bg-white rounded-xl shadow-sm border border-border">
                           <Truck className="w-5 h-5 text-primary" />
                         </div>
                         Matriz de Proveedores
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border/50 bg-muted/10 uppercase text-[10px] font-black tracking-[0.25em] text-foreground">
                              <th className="text-center py-6 px-8 w-16">#</th>
                              <th className="text-left py-6 px-10">Id. Fiscal</th>
                              <th className="text-left py-6 px-10">Entidad / Proveedor</th>
                              <th className="text-center py-6 px-8">Docs</th>
                              <th className="text-center py-6 px-8">Fact.</th>
                              <th className="text-center py-6 px-8">NC</th>
                              <th className="text-right py-6 px-10">Monto Auditoría</th>
                              <th className="text-center py-6 px-10">Peso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {state.vendors.map((v, i) => (
                              <EntityRow key={v.rut} entity={v} index={i} type="vendor" />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="customers" className="space-y-8 mt-0 focus-visible:outline-none" suppressHydrationWarning>
            {state.customers.length === 0 ? (
              <Card className="bg-muted/10 border-border rounded-[2.5rem]">
                <CardContent className="py-24 text-center">
                   <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                   <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">
                     Sin transacciones de venta detectadas para {periodoLabel}.
                   </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8" suppressHydrationWarning>
                  <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500/20" suppressHydrationWarning>
                    <CardHeader className="pb-8 border-b border-border/50 bg-muted/5 p-8" suppressHydrationWarning>
                       <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                         Concentración de Clientes
                       </CardTitle>
                       <CardDescription className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground italic mt-2">
                         VOLUMEN SEGÚN BASE IMPONIBLE ACTUALIZADA
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                       {showCharts && <AnalysisBarChart data={customerChartData} />}
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-purple-500/20" suppressHydrationWarning>
                    <CardHeader className="pb-8 border-b border-border/50 bg-muted/5 p-8" suppressHydrationWarning>
                       <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                         Distribución del Canal
                       </CardTitle>
                       <CardDescription className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground italic mt-2">
                         CUOTA DE PARTICIPACIÓN SOBRE DOCUMENTACIÓN EMITIDA
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                       {showCharts && <AnalysisPieChart data={customerChartData} />}
                    </CardContent>
                  </Card>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-2" suppressHydrationWarning>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none border-2 border-emerald-600/20 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-[1.5rem] px-8 h-14 shadow-lg active:scale-95 transition-all"
                    onClick={() => exportToCSV(deferredCustomers, "clientes", selectedPeriodo)}
                  >
                    <Download className="w-4 h-4 mr-3" />
                    DATA EXPORT CSV
                  </Button>
                  {selectedPeriodo ? (
                    <div className="flex flex-col gap-2 flex-1 sm:flex-none">
                      <Button
                        variant="outline"
                        className="w-full border-2 border-amber-500/20 bg-amber-50/50 text-amber-700 hover:bg-amber-600 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-[1.5rem] px-8 h-14 shadow-lg active:scale-95 transition-all"
                        onClick={() => handleCentralize('sales')}
                        disabled={isCentralizing}
                      >
                        {isCentralizing ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Activity className="w-4 h-4 mr-3" />}
                        FORZAR RE-CENTRALIZACIÓN
                      </Button>
                      <span className="text-[9px] text-muted-foreground font-semibold px-2">
                        * Use esta opción solo para reconstruir manualmente los asientos de este mes.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 bg-blue-50/50 border border-blue-100 rounded-2xl px-6 py-4 shadow-sm flex-1 sm:flex-none max-w-md">
                      <ShieldCheck className="w-5 h-5 text-blue-600 animate-pulse mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 leading-normal">
                          Centralización Inteligente y Automatizada Activa
                        </span>
                        <span className="text-[10px] text-blue-700 leading-relaxed font-medium">
                          El sistema procesa y genera automáticamente los asientos en el Libro Diario al importar los archivos del SII. Realiza validaciones de integridad en tiempo real (Partida Doble) y previene la duplicidad de documentos de manera inteligente.
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none border-2 border-border/60 bg-white text-foreground hover:bg-muted/50 font-black uppercase text-[10px] tracking-widest rounded-[1.5rem] px-8 h-14 shadow-lg active:scale-95 transition-all"
                    onClick={() => setShowCustomersTable((v) => !v)}
                  >
                    {showCustomersTable ? <ChevronUp className="w-5 h-5 mr-3" /> : <ChevronDown className="w-5 h-5 mr-3" />}
                    {showCustomersTable ? "COLAPSAR REGISTROS" : "DESPLEGAR AUDITORÍA COMPLETA"}
                  </Button>
                </div>

                {showCustomersTable && (
                  <Card className="bg-card border-border shadow-2xl overflow-hidden rounded-[2.5rem] mt-6">
                    <CardHeader className="bg-muted/5 border-b border-border/50 p-8">
                       <CardTitle className="text-lg font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                         <div className="p-2 bg-white rounded-xl shadow-sm border border-border">
                           <Users className="w-5 h-5 text-emerald-600" />
                         </div>
                         Matriz de Clientes
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border/50 bg-muted/10 uppercase text-[10px] font-black tracking-[0.25em] text-foreground">
                              <th className="text-center py-6 px-8 w-16">#</th>
                              <th className="text-left py-6 px-10">Id. Fiscal</th>
                              <th className="text-left py-6 px-10">Entidad / Cliente</th>
                              <th className="text-center py-6 px-8">Docs</th>
                              <th className="text-center py-6 px-8">Fact.</th>
                              <th className="text-center py-6 px-8">NC</th>
                              <th className="text-right py-6 px-10">Monto Auditoría</th>
                              <th className="text-center py-6 px-10">Peso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {state.customers.map((c, i) => (
                              <EntityRow key={c.rut} entity={c} index={i} type="customer" />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
