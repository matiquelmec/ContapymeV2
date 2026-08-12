"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart3, 
  PieChart, 
  Download, 
  RefreshCcw,
  TrendingUp,
  Scale,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Loader2,
  Lock
} from "lucide-react";
import { getFinancialReports } from "@/actions/accounting";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ReportsClient({ organizationId }: { organizationId: string }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFetchReports = async () => {
    setLoading(true);
    try {
      const data = await getFinancialReports(organizationId, year, month);
      if (data) {
        setReports(data);
        toast.success("Intelligence Report consolidado");
      } else {
        toast.error("Motor de reportes no disponible");
      }
    } catch (error) {
      toast.error("Error crítico de sincronización contable");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reports) return;

    // Convert data to CSV format
    const headers = ["Sección", "Tipo", "Código", "Nombre", "Monto"];
    const erRows = reports.estado_resultados.detalles.map((d: any) => [
      "ESTADO DE RESULTADOS", 
      d.tipo.toUpperCase(), 
      d.codigo, 
      d.nombre, 
      d.monto
    ]);
    const bgRows = reports.balance_general.detalles.map((d: any) => [
      "BALANCE GENERAL", 
      d.tipo.toUpperCase(), 
      d.codigo, 
      d.nombre, 
      d.monto
    ]);

    const allRows = [headers, ...erRows, ...bgRows];
    const csvContent = "\uFEFF" + allRows.map(row => 
      row.map((value: any) => `"${String(value).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FINANCIAL_INTELLIGENCE_${year}_${month || 'ANUAL'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Resumen consolidado exportado");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" suppressHydrationWarning={true}>
      {/* 1. Panel de Control Estratégico */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 lg:p-10 bg-card border border-border rounded-[2.5rem] shadow-2xl ring-1 ring-black/[0.03]">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center border border-primary/10 shadow-inner">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight text-foreground">Financial Intelligence</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Visión multidimensional de la posición económica.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-3 bg-muted/10 border-2 border-border rounded-full px-6 py-2 shadow-sm h-14 flex-1 lg:flex-none hover:border-primary/50 transition-colors">
            <Calendar className="h-5 w-5 text-primary" />
            <select id="field_year" name="field_year" 
              className="bg-transparent border-0 text-xs font-black uppercase tracking-widest focus:ring-0 outline-none text-foreground w-full"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-muted/10 border-2 border-border rounded-3xl px-6 py-2 shadow-sm h-14 flex-1 lg:flex-none hover:border-primary/50 transition-colors">
            <Filter className="h-5 w-5 text-primary" />
            <select id="field_month" name="field_month" 
              className="bg-transparent border-0 text-xs font-black uppercase tracking-widest focus:ring-0 outline-none pr-4 text-foreground w-full"
              value={month || ""}
              onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="" className="text-primary font-black">REPORTE ANUAL</option>
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1} className="font-bold">
                  {new Date(0, i).toLocaleString('es', { month: 'long' }).toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleFetchReports} disabled={loading} className="gap-3 font-black uppercase text-[10px] tracking-widest rounded-full shadow-xl shadow-primary/20 h-14 px-10 hover:scale-105 active:scale-95 transition-all w-full md:w-auto">
            {loading ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <RefreshCcw className="h-5 w-5" />}
            Sincronizar Inteligencia
          </Button>
        </div>
      </div>

      {reports ? (
        <Tabs defaultValue="results" className="w-full space-y-10">
          <TabsList className="grid w-full grid-cols-2 bg-muted/40 p-2 rounded-full h-[5.5rem] border border-border shadow-inner">
            <TabsTrigger value="results" className="gap-3 font-black uppercase tracking-widest text-[10px] rounded-full data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all duration-300">
              <BarChart3 className="h-5 w-5" /> Estado de Resultados
            </TabsTrigger>
            <TabsTrigger value="balance" className="gap-3 font-black uppercase tracking-widest text-[10px] rounded-full data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all duration-300">
              <Scale className="h-5 w-5" /> Balance Institucional
            </TabsTrigger>
          </TabsList>

          {/* 1. Estado de Resultados */}
          <TabsContent value="results" className="space-y-8 animate-in slide-in-from-left-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-emerald-100 shadow-xl overflow-hidden relative group rounded-[2.5rem] border-l-[16px] border-l-emerald-500/80 hover:border-l-emerald-500 transition-colors">
                <CardHeader className="p-8 lg:p-10">
                  <CardDescription className="text-emerald-600 font-black uppercase text-[10px] tracking-widest mb-2">Total Ingresos Operativos</CardDescription>
                  <CardTitle className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground">${reports.estado_resultados.ingresos.toLocaleString('es-CL')}</CardTitle>
                </CardHeader>
                <div className="absolute top-6 right-6 p-4 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                  <ArrowUpRight className="h-20 w-20 text-emerald-500" />
                </div>
              </Card>

              <Card className="bg-white border-rose-100 shadow-xl overflow-hidden relative group rounded-[2.5rem] border-l-[16px] border-l-rose-500/80 hover:border-l-rose-500 transition-colors">
                <CardHeader className="p-8 lg:p-10">
                  <CardDescription className="text-rose-600 font-black uppercase text-[10px] tracking-widest mb-2">Gastos y Costos Totales</CardDescription>
                  <CardTitle className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground">${reports.estado_resultados.gastos.toLocaleString('es-CL')}</CardTitle>
                </CardHeader>
                <div className="absolute top-6 right-6 p-4 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                  <ArrowDownRight className="h-20 w-20 text-rose-500" />
                </div>
              </Card>

              <Card className={`overflow-hidden shadow-2xl rounded-[2.5rem] border-4 ${reports.estado_resultados.resultado >= 0 ? 'border-primary/40 bg-primary/5' : 'border-amber-400/40 bg-amber-400/5'}`}>
                <CardHeader className="p-8 lg:p-10">
                  <CardDescription className="font-black uppercase text-[11px] tracking-[0.2em] text-foreground/40 mb-2">{reports.estado_resultados.resultado >= 0 ? 'Resultado: Superávit de Gestión' : 'Resultado: Déficit de Gestión'}</CardDescription>
                  <CardTitle className={`text-4xl lg:text-5xl font-black tracking-tighter ${reports.estado_resultados.resultado >= 0 ? 'text-primary' : 'text-amber-600'}`}>
                    ${reports.estado_resultados.resultado.toLocaleString('es-CL')}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 bg-muted/5 py-8 px-10">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-black uppercase tracking-tight text-foreground">Desglose Analítico Operativo</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Consolidación transaccional por nivel de cuenta.</CardDescription>
                </div>
                <Button 
                  onClick={handleExportCSV}
                  variant="outline" 
                  className="gap-2 font-black uppercase text-[10px] tracking-widest h-12 px-6 rounded-full border-2 border-border hover:bg-muted shadow-sm transition-all duration-300"
                >
                  <Download className="h-5 w-5 text-primary" /> Data Export CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/30 border-border">
                        <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-40">Código</TableHead>
                        <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 text-foreground">Cuenta Maestro Contable</TableHead>
                        <TableHead className="text-right px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-52">Monto Neto Percibido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/30">
                      {reports.estado_resultados.detalles.map((d: any) => (
                        <TableRow 
                          key={d.codigo} 
                          className="group hover:bg-primary/[0.02] transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/dashboard/accounting/ledger?account=${d.codigo}`}
                        >
                          <TableCell className="px-10 py-6 font-mono text-[11px] font-black tracking-[0.2em] text-muted-foreground/50">{d.codigo}</TableCell>
                          <TableCell className="px-10 py-6">
                              <span className="text-foreground font-black uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{d.nombre}</span>
                          </TableCell>
                          <TableCell className={`text-right px-10 py-6 font-black text-sm group-hover:bg-primary/[0.02] transition-colors ${d.tipo === 'ingreso' ? 'text-emerald-700' : 'text-rose-600'}`}>
                            <div className="flex items-center justify-end gap-2">
                               {d.tipo === 'ingreso' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                               ${d.monto.toLocaleString('es-CL')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Balance General */}
          <TabsContent value="balance" className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-primary/95 border-primary shadow-2xl rounded-[2.5rem] overflow-hidden relative border-l-[16px] border-l-primary/40 group">
                <CardHeader className="p-8 lg:p-10">
                  <CardDescription className="text-white/60 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Masa Patrimonial (Activos)</CardDescription>
                  <CardTitle className="text-4xl lg:text-5xl font-black tracking-tighter text-white">${reports.balance_general.activos.toLocaleString('es-CL')}</CardTitle>
                </CardHeader>
                <div className="absolute top-6 right-6 p-4 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500 text-white">
                  <Lock className="w-20 h-20" />
                </div>
              </Card>
              <Card className="bg-white border-rose-100 shadow-xl rounded-[2.5rem] overflow-hidden border-l-[16px] border-l-rose-500/80 hover:border-l-rose-500 transition-colors">
                <CardHeader className="p-8 lg:p-10">
                  <CardDescription className="text-rose-600 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Pasivos e Intereses</CardDescription>
                  <CardTitle className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground">${reports.balance_general.pasivos.toLocaleString('es-CL')}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-white border-indigo-100 shadow-xl rounded-[2.5rem] overflow-hidden border-l-[16px] border-l-indigo-500/80 hover:border-l-indigo-500 transition-colors">
                <CardHeader className="p-8 lg:p-10">
                  <CardDescription className="text-indigo-600 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Patrimonio y Plusvalía</CardDescription>
                  <CardTitle className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground">${reports.balance_general.patrimonio.toLocaleString('es-CL')}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary">
              <CardHeader className="border-b border-border/50 bg-muted/5 py-8 px-10">
                <CardTitle className="text-2xl font-black uppercase tracking-tight text-foreground flex flex-col sm:flex-row sm:items-center gap-4">
                    Balance General Consolidado
                    <Badge className={`${reports.balance_general.is_balanced ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} text-[10px] font-black uppercase tracking-widest px-4 py-1.5 w-fit`}>
                      {reports.balance_general.is_balanced ? 'Ecuación Cuadrada (A = P + K)' : 'Descuadre Detectado'}
                    </Badge>
                </CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mt-3">Ecuación fundamental de la contabilidad patrimonial.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/30 border-border">
                        <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-32">Código</TableHead>
                        <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60">Cuenta de Balance</TableHead>
                        <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-44">Clasificación</TableHead>
                        <TableHead className="text-right px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-44">Valorización Neta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/30">
                      {reports.balance_general.detalles.sort((a:any, b:any) => a.codigo.localeCompare(b.codigo)).map((d: any) => (
                        <TableRow 
                          key={d.codigo} 
                          className={`group hover:bg-primary/[0.02] transition-colors ${d.is_virtual ? 'bg-indigo-50/20 italic' : 'cursor-pointer'}`}
                          onClick={() => {
                            if (!d.is_virtual) {
                              window.location.href = `/dashboard/accounting/ledger?account=${d.codigo}`;
                            }
                          }}
                        >
                          <TableCell className="px-10 py-6 font-mono text-[11px] font-black tracking-[0.2em] text-muted-foreground/50">{d.codigo}</TableCell>
                          <TableCell className="px-10 py-6">
                              <div className="flex flex-col">
                                <span className="text-foreground font-black uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{d.nombre}</span>
                                {d.is_virtual && <span className="text-[9px] font-black text-indigo-600 tracking-widest mt-1 uppercase">Ajuste de Ejercicio</span>}
                              </div>
                          </TableCell>
                          <TableCell className="px-10 py-6 capitalize">
                             <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border shadow-sm ${
                               d.tipo === 'activo' ? 'bg-emerald-50/50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-50' : 
                               d.tipo === 'pasivo' ? 'bg-rose-50/50 text-rose-700 border-rose-200 group-hover:bg-rose-50' : 
                               'bg-indigo-50/50 text-indigo-700 border-indigo-200 group-hover:bg-indigo-50'
                             } transition-colors`}>
                               {d.tipo}
                             </span>
                          </TableCell>
                          <TableCell className="text-right px-10 py-6">
                             <span className="text-foreground font-black text-sm tracking-tight">${d.monto.toLocaleString('es-CL')}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Sumatoria de Cierre Institucional */}
                      <TableRow className="bg-primary/5 hover:bg-primary/10 border-t-8 border-primary/20 transition-all">
                        <TableCell colSpan={3} className="px-10 py-10">
                          <div className="flex flex-col">
                              <span className="text-primary/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2 leading-none">Activos Netos</span>
                              <span className="text-primary font-black tracking-widest uppercase text-sm">Suma Total de Recursos (A)</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-10 py-10 border-l border-primary/10">
                          <span className="text-primary text-4xl font-black tracking-tighter">
                            ${reports.balance_general.activos.toLocaleString('es-CL')}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30 hover:bg-muted/50 border-t border-border transition-all">
                        <TableCell colSpan={3} className="px-10 py-10">
                          <div className="flex flex-col">
                              <span className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2 leading-none">Financiamiento Externo e Interno</span>
                              <span className="text-foreground font-black tracking-widest uppercase text-sm">Total Pasivos + Patrimonio (P + K)</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-10 py-10 border-l border-border/50">
                          <span className="text-foreground text-4xl font-black tracking-tighter opacity-80">
                            ${(reports.balance_general.pasivos + reports.balance_general.patrimonio).toLocaleString('es-CL')}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 bg-card border-4 border-dashed rounded-[3rem] opacity-60 border-border shadow-inner animate-pulse">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl mb-10 border border-border">
             <FileText className="h-20 w-20 text-primary/20" />
           </div>
           <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Inteligencia Pendiente</h3>
           <p className="text-muted-foreground text-sm font-bold italic max-w-sm text-center mt-3 leading-relaxed">
             Para visualizar la salud financiera integral de la entidad, determine el periodo comercial y proceda con la carga de datos maestros.
           </p>
           <Button variant="outline" className="mt-8 h-14 px-10 rounded-full font-black uppercase text-[10px] tracking-[0.2em] border-primary/20 shadow-xl shadow-primary/5 hover:bg-primary/5 active:scale-95 transition-all text-primary" onClick={handleFetchReports}>
                <RefreshCcw className="h-4 w-4 mr-3" />
                Sincronización Rápida
           </Button>
        </div>
      )}
    </div>
  );
}
