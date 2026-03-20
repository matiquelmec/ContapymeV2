import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, FileSpreadsheet, ShoppingCart, TrendingUp,
  CheckCircle, AlertCircle, FileText, History, Search,
  ArrowRight
} from "lucide-react";
import { getActiveOrganizationId } from "@/actions/organizations";
import { getRCVHistory, getRCVSummary } from "@/actions/rcv";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Ecosistema RCV | Contapyme V2",
  description: "Auditoría histórica de importaciones del Registro de Compras y Ventas del SII.",
};

const formatCLP = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);

const formatPeriodo = (periodo: string) => {
  if (!periodo) return "";
  const [y, m] = periodo.split("-");
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${months[parseInt(m) - 1]} ${y}`.toUpperCase();
};

export default async function RCVHistoryPage() {
  const organizationId = await getActiveOrganizationId();

  const [history, summary] = await Promise.all([
    getRCVHistory(organizationId, 50),
    getRCVSummary(organizationId),
  ]);

  const totalDocs = (summary?.total_docs_compras ?? 0) + (summary?.total_docs_ventas ?? 0);
  const totalMonto = (summary?.monto_compras ?? 0) + (summary?.monto_ventas ?? 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10" suppressHydrationWarning={true}>
      
      {/* 1. Navegación y Título Institucional */}
      <div className="flex flex-col gap-6">
        <Link
          href="/dashboard/accounting/rcv"
          className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all pr-4 border-r border-border w-fit pl-1"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a Consola RCV
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4 mb-2">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
                <History className="w-8 h-8 text-primary" />
              </div>
              Auditoría Histórica RCV
            </h1>
            <p className="text-muted-foreground font-bold italic tracking-wide text-sm flex items-center gap-2">
              Trazabilidad completa de lotes importados y estado de integración contable.
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      {/* 2. Resumen Ejecutivo (KPIs Premium) */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-l-8 border-l-primary">
            <CardContent className="p-8">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 leading-none">Dataset Total</p>
              <p className="text-4xl font-black tracking-tighter text-foreground">{totalDocs.toLocaleString("es-CL")}</p>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-2 italic">Acumulado Compras/Ventas</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-l-8 border-l-blue-500">
            <CardContent className="p-8">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 leading-none">Masa Monetaria</p>
              <p className="text-2xl font-black tracking-tighter text-foreground">{formatCLP(totalMonto)}</p>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-4 italic">Suma de todos los ciclos</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-l-8 border-l-amber-500">
            <CardContent className="p-8">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 leading-none">Proveedores Red</p>
              <p className="text-4xl font-black tracking-tighter text-amber-600">{summary.proveedores_unicos}</p>
              <p className="text-[10px] font-bold text-amber-600/60 mt-2 italic">Entidades identificadas</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-l-8 border-l-purple-500">
            <CardContent className="p-8">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 leading-none">Cartera Clientes</p>
              <p className="text-4xl font-black tracking-tighter text-purple-600">{summary.clientes_unicos}</p>
              <p className="text-[10px] font-bold text-purple-600/60 mt-2 italic">Relaciones comerciales</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Maestro de Lotes (Tabla de alta fidelidad) */}
      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-muted/5 border-b border-border py-10 px-12">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <CardTitle className="text-2xl font-black tracking-tighter text-foreground uppercase">Ecosistema de Importaciones</CardTitle>
                    <CardDescription className="text-xs font-bold italic text-muted-foreground">Control de integridad: Documentos con asiento generado indicados con marcador institucional.</CardDescription>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-border shadow-inner">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl">
                        {history.length} LOTES REGISTRADOS
                    </Badge>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="py-40 text-center bg-muted/5">
              <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-border inline-block mb-8">
                <FileText className="w-16 h-16 text-primary/20 mx-auto" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Sin Importaciones Activas</h3>
              <p className="text-muted-foreground text-sm font-bold italic max-w-sm mx-auto mt-3">Para visualizar la trazabilidad histórica, proceda con la carga de documentos SII.</p>
              <Link
                href="/dashboard/accounting/rcv"
                className="inline-flex items-center mt-10 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-primary/20"
              >
                Inyectar archivos RCV
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/10 text-[10px] font-black text-foreground uppercase tracking-[0.2em]">
                    <th className="py-7 px-10">Periodo Fiscal de Cierre</th>
                    <th className="py-7 px-10">Categoría Operativa</th>
                    <th className="py-7 px-10 text-center">Docs</th>
                    <th className="py-7 px-10 text-right">Volumen SII</th>
                    <th className="py-7 px-10 text-right">Cálculo Interno</th>
                    <th className="py-7 px-10 text-center">Integ. Contable</th>
                    <th className="py-7 px-10 text-center">Estado</th>
                    <th className="py-7 px-10 text-right">Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {history.map((item: any, i: number) => {
                    const isPurchase = item.tipo === "purchases";
                    const isFullyAccounted = item.docs_sin_asiento === 0 && item.total_docs > 0;
                    const isPartial = item.docs_con_asiento > 0 && item.docs_sin_asiento > 0;

                    return (
                      <tr
                        key={`${item.periodo}-${item.tipo}-${i}`}
                        className="group hover:bg-primary/[0.02] transition-all duration-300"
                      >
                        {/* Período */}
                        <td className="py-6 px-10">
                          <div className="flex flex-col">
                            <span className="text-foreground font-black uppercase text-sm tracking-tight">{formatPeriodo(item.periodo)}</span>
                            <span className="text-[11px] font-black font-mono text-muted-foreground/60 mt-0.5">{item.periodo?.slice(0, 7)}</span>
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="py-6 px-10">
                          <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border shadow-sm ${
                                isPurchase ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
                            }`}>
                            {isPurchase ? (
                              <ShoppingCart className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingUp className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {isPurchase ? "Compras" : "Ventas"}
                            </span>
                          </div>
                        </td>

                        {/* Docs */}
                        <td className="py-6 px-10 text-center">
                          <span className="text-foreground font-black text-sm">{item.total_docs} ENV</span>
                        </td>

                        {/* Monto Total */}
                        <td className="py-6 px-10 text-right">
                          <span className="text-muted-foreground font-black font-mono text-xs">{formatCLP(item.monto_total)}</span>
                        </td>

                        {/* Monto Calculado */}
                        <td className="py-6 px-10 text-right">
                          <span className={`font-mono text-xs font-black ${item.monto_calculado >= 0 ? "text-foreground" : "text-rose-600"}`}>
                            {formatCLP(item.monto_calculado)}
                          </span>
                        </td>

                        {/* Integración */}
                        <td className="py-6 px-10 text-center">
                          <div className="flex flex-col items-center gap-1">
                             <div className="flex gap-2">
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                    {item.docs_con_asiento} OK
                                </span>
                                {item.docs_sin_asiento > 0 && (
                                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                        {item.docs_sin_asiento} PEN
                                    </span>
                                )}
                             </div>
                          </div>
                        </td>

                        {/* Estado badge */}
                        <td className="py-6 px-10 text-center">
                          {isFullyAccounted ? (
                            <Badge className="bg-emerald-600 text-white border-transparent text-[8px] font-black uppercase tracking-widest px-3 py-1 shadow-lg shadow-emerald-600/20">
                              <CheckCircle className="w-2.5 h-2.5 mr-1.5" />
                              Verificado
                            </Badge>
                          ) : isPartial ? (
                            <Badge className="bg-amber-500 text-white border-transparent text-[8px] font-black uppercase tracking-widest px-3 py-1 shadow-lg shadow-amber-500/20">
                              Parcial
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-border text-[8px] font-black uppercase tracking-widest px-3 py-1">
                              <AlertCircle className="w-2.5 h-2.5 mr-1.5" />
                              Pendiente
                            </Badge>
                          )}
                        </td>

                        {/* Acción */}
                        <td className="py-6 px-10 text-right">
                          <Link
                            href={`/dashboard/accounting/rcv?periodo=${item.periodo}`}
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-5 py-2 rounded-xl transition-all border border-transparent hover:border-primary/20"
                          >
                            Análisis <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
