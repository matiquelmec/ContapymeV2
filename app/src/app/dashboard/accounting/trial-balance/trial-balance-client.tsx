"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Printer, Download, Filter, CheckCircle2, AlertCircle, RefreshCcw, Calendar, Info } from "lucide-react";
import { getTrialBalance } from "@/actions/accounting";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function TrialBalanceClient({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dates, setDates] = useState({
    start: "",
    end: ""
  });

  useEffect(() => {
    setMounted(true);
    setDates({
      start: `${new Date().getFullYear()}-01-01`,
      end: new Date().toISOString().split('T')[0]
    });
  }, []);

  const fetchData = async () => {
    if (!dates.start || !dates.end) return;
    setLoading(true);
    try {
      const result = await getTrialBalance(organizationId, dates.start, dates.end);
      setData(result);
      toast.success("Balance generado exitosamente");
    } catch (error) {
      toast.error("Error crítico al cargar el balance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && organizationId) {
      fetchData();
    }
  }, [organizationId, mounted]);

  if (!mounted) return null;

  const totalSumas = data.reduce((acc, curr) => ({
    debe: acc.debe + curr.debe,
    haber: acc.haber + curr.haber,
    saldo_deudor: acc.saldo_deudor + curr.saldo_deudor,
    saldo_acreedor: acc.saldo_acreedor + curr.saldo_acreedor
  }), { debe: 0, haber: 0, saldo_deudor: 0, saldo_acreedor: 0 });

  const isSquare = Math.abs(totalSumas.debe - totalSumas.haber) < 0.01;

  return (
    <div className="space-y-8 animate-in fade-in duration-700" suppressHydrationWarning={true}>
      {/* 1. Panel de Control y Filtros Premium */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 bg-card border border-border rounded-[2.5rem] shadow-2xl">
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Ciclo de Inicio</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <Input 
                type="date" 
                value={dates.start} 
                onChange={(e) => setDates({...dates, start: e.target.value})}
                className="pl-12 bg-muted/10 border-2 border-border text-foreground font-black text-xs uppercase h-14 w-48 rounded-3xl shadow-sm focus:ring-primary focus:border-primary transition-all hover:border-primary/50"
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Ciclo de Término</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <Input 
                type="date" 
                value={dates.end} 
                onChange={(e) => setDates({...dates, end: e.target.value})}
                className="pl-12 bg-muted/10 border-2 border-border text-foreground font-black text-xs uppercase h-14 w-48 rounded-3xl shadow-sm focus:ring-primary focus:border-primary transition-all hover:border-primary/50"
              />
            </div>
          </div>
          <Button 
              onClick={fetchData} 
              className="gap-3 font-black uppercase text-[10px] tracking-widest rounded-full shadow-xl shadow-primary/20 h-14 px-10 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
              disabled={loading}
          >
            {loading ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Filter className="h-5 w-5" />}
            Sincronizar Inteligencia
          </Button>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button variant="outline" className="gap-2 font-black uppercase text-[10px] tracking-widest h-14 px-8 rounded-full border-2 border-border hover:bg-muted shadow-sm active:scale-95 transition-all flex-1 lg:flex-none">
                <Printer className="h-5 w-5 text-primary" /> Imprimir
            </Button>
            <Button variant="outline" className="gap-2 font-black uppercase text-[10px] tracking-widest h-14 px-8 rounded-full border-2 border-border hover:bg-muted shadow-sm active:scale-95 transition-all flex-1 lg:flex-none">
                <Download className="h-5 w-5 text-primary" /> Data Export
            </Button>
        </div>
      </div>

      {/* 2. Estado de Cuadratura - Indicador Visual */}
      {/* 2. Estado de Cuadratura - Indicador Visual */}
      <div className={`p-8 rounded-[2.5rem] border-2 flex items-center justify-between shadow-lg transition-all duration-500 overflow-hidden relative ${isSquare ? 'bg-emerald-50/50 border-emerald-500/20 text-emerald-800' : 'bg-rose-50/50 border-rose-500/20 text-rose-800'}`}>
        <div className="flex items-center gap-6 z-10">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-inner ${isSquare ? 'bg-emerald-100 border-emerald-500/30' : 'bg-rose-100 border-rose-500/30'}`}>
            {isSquare ? <CheckCircle2 className="h-8 w-8 text-emerald-600" /> : <AlertCircle className="h-8 w-8 text-rose-600" />}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight">Estado de Integridad Contable</h3>
            <p className={`text-[11px] font-bold uppercase tracking-[0.1em] ${isSquare ? 'text-emerald-700/60' : 'text-rose-700/60'}`}>
              {isSquare ? 'Verificación exitosa: Libro diario y mayor cuadrados.' : 'Alerta crítica: Discrepancia requiere auditoría urgente.'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Diferencia Neta Detectada</span>
            <span className="text-4xl font-black tracking-tighter">${Math.abs(totalSumas.debe - totalSumas.haber).toLocaleString('es-CL')}</span>
        </div>
        {/* Decorative background element */}
        <div className={`absolute -right-8 -bottom-8 opacity-[0.03] transform rotate-12 ${isSquare ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isSquare ? <CheckCircle2 className="w-64 h-64" /> : <AlertCircle className="w-64 h-64" />}
        </div>
      </div>

      {/* 3. Estructura del Balance */}
      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="bg-muted/5 border-b border-border/50 py-8 px-10">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div className="space-y-2">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight text-foreground">Detalle de Sumas y Saldos</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Visión tridimensional de la posición de cada cuenta en el maestro.</CardDescription>
                </div>
                <div className="flex items-center justify-center gap-3 bg-white px-6 py-3 rounded-full border-2 border-border shadow-md shrink-0">
                    <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.5)] ${isSquare ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Traspaso Directo NIIF</span>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30 border-border">
                  <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-32">Código IFRS</TableHead>
                  <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60">Cuenta Contable Estratégica</TableHead>
                  <TableHead className="text-right px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-40">Débitos Suma</TableHead>
                  <TableHead className="text-right px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-40">Créditos Suma</TableHead>
                  <TableHead className="text-right px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-primary/80 w-44 bg-blue-50/20">Saldo Deudor</TableHead>
                  <TableHead className="text-right px-10 py-6 font-black uppercase text-[10px] tracking-[0.15em] text-amber-700/80 w-44 bg-amber-50/20">Saldo Acreedor</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody className="divide-y divide-border/30">
                {data.map((row) => (
                  <TableRow key={row.codigo} className="hover:bg-primary/[0.02] transition-colors group">
                    <TableCell className="px-10 py-6 font-mono text-[11px] font-black tracking-[0.2em] text-muted-foreground/50">
                        {row.codigo}
                    </TableCell>
                    <TableCell className="px-10 py-6">
                        <span className="text-foreground font-black uppercase text-xs tracking-tight">{row.nombre}</span>
                    </TableCell>
                    <TableCell className="text-right px-10 py-6 font-bold text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        {row.debe > 0 ? row.debe.toLocaleString('es-CL') : <span className="opacity-0">—</span>}
                    </TableCell>
                    <TableCell className="text-right px-10 py-6 font-bold text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        {row.haber > 0 ? row.haber.toLocaleString('es-CL') : <span className="opacity-0">—</span>}
                    </TableCell>
                    <TableCell className="text-right px-10 py-6 bg-blue-50/10 group-hover:bg-blue-50/30 transition-colors">
                        <span className="text-sm font-black text-primary">
                            {row.saldo_deudor > 0 ? row.saldo_deudor.toLocaleString('es-CL') : <span className="opacity-0">—</span>}
                        </span>
                    </TableCell>
                    <TableCell className="text-right px-10 py-6 bg-amber-50/10 group-hover:bg-amber-50/30 transition-colors">
                         <span className="text-sm font-black text-amber-600">
                            {row.saldo_acreedor > 0 ? row.saldo_acreedor.toLocaleString('es-CL') : <span className="opacity-0">—</span>}
                         </span>
                    </TableCell>
                  </TableRow>
                ))}
                
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 text-muted-foreground opacity-30">
                        <div className="p-8 bg-muted rounded-full">
                           <Search className="h-12 w-12" />
                        </div>
                        <span className="font-black uppercase text-xs tracking-[0.2em] italic">No se detectaron transacciones registradas.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {data.length > 0 && (
                <tfoot className="bg-muted/30 border-t-8 border-primary/10">
                    <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={2} className="px-10 py-10 font-black uppercase text-[11px] tracking-[0.2em] text-foreground">Total Consolidado Institucional</TableCell>
                        <TableCell className="text-right px-10 py-10">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-foreground">${totalSumas.debe.toLocaleString('es-CL')}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Suma Débitos</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right px-10 py-10">
                             <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-foreground">${totalSumas.haber.toLocaleString('es-CL')}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Suma Créditos</span>
                             </div>
                        </TableCell>
                        <TableCell className="text-right px-10 py-10 bg-primary/5 border-l border-primary/10">
                             <div className="flex flex-col items-end">
                                <span className="text-primary text-2xl font-black tracking-tighter">${totalSumas.saldo_deudor.toLocaleString('es-CL')}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-1 whitespace-nowrap">Acumulado Deudor</span>
                             </div>
                        </TableCell>
                        <TableCell className="text-right px-10 py-10 bg-amber-600/5 border-l border-amber-600/10">
                             <div className="flex flex-col items-end">
                                <span className="text-amber-600 text-2xl font-black tracking-tighter">${totalSumas.saldo_acreedor.toLocaleString('es-CL')}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/60 mt-1 whitespace-nowrap">Acumulado Acreedor</span>
                             </div>
                        </TableCell>
                    </TableRow>
                </tfoot>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Institutional Legal Disclaimer & Help */}
      <div className="flex items-start gap-5 p-8 bg-blue-50/50 border border-blue-100 rounded-[2.5rem] shadow-inner mb-6">
        <div className="h-14 w-14 rounded-2xl bg-white border border-blue-200 shadow-sm flex items-center justify-center shrink-0">
          <Info className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <strong className="text-primary font-black uppercase text-[11px] tracking-[0.2em] block mb-2">Metodología de Cuadratura IFRS NIIF:</strong>
          <p className="text-[11px] text-blue-900/60 font-bold leading-relaxed italic">
            Este balance refleja la suma algebraica de débitos y créditos proyectados sobre la naturaleza instrumental de cada cuenta contable estratégica. En caso de discrepancia en la diferencia neta, se recomienda auditar el <span className="text-primary underline underline-offset-4 decoration-primary/30">Libro Diario Electrónico</span> para identificar asientos huérfanos o desajustes decimales automáticos.
          </p>
        </div>
      </div>
    </div>
  );
}
