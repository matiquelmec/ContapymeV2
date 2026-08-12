"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Download, 
  Calendar,
  ArrowRightLeft,
  BookOpen,
  Filter,
  RefreshCcw,
  Info,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Columns,
  Coins
} from "lucide-react";
import { getLedger, exportLedgerAction, exportLceMayorXmlAction } from "@/actions/accounting";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { fCurrency } from "@/lib/utils";

export default function LedgerClient({ organizationId, accounts, orgName, orgRut }: { 
  organizationId: string, 
  accounts: any[],
  orgName?: string,
  orgRut?: string
}) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingLce, setExportingLce] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "t-account">("table");

  useEffect(() => {
    setLedgerData(null);
    setSelectedAccount("");
  }, [organizationId, accounts]);

  const handleFetchLedger = async () => {
    if (!selectedAccount) {
      toast.error("Seleccione una cuenta contable estratégica");
      return;
    }
    setLoading(true);
    try {
      const data = await getLedger(organizationId, selectedAccount, startDate, endDate);
      if (data) {
        setLedgerData(data);
        toast.success("Trazabilidad cargada con éxito");
      } else {
        toast.error("No se detectaron movimientos en el rango");
      }
    } catch (error) {
      toast.error("Error crítico al cargar libro mayor");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!ledgerData) return;
    setExporting(true);
    try {
      const res = await exportLedgerAction(
        organizationId,
        selectedAccount,
        ledgerData.account_name,
        startDate,
        endDate,
        ledgerData,
        orgName,
        orgRut
      );
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename || 'libro_mayor.csv';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Libro Mayor exportado correctamente.');
      } else {
        toast.error(res.error || 'Error al exportar.');
      }
    } catch {
      toast.error('Error inesperado al exportar.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportLce = async () => {
    setExportingLce(true);
    try {
      const periodoStr = startDate.substring(0, 7); // Extracción segura formato YYYY-MM
      const res = await exportLceMayorXmlAction(organizationId, periodoStr);
      if (res.success && res.xml) {
        const blob = new Blob([res.xml], { type: 'application/xml;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename || `LCE_MAYOR_${periodoStr.replace('-', '')}.xml`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Auditoría XML LCE generada exitosamente.');
      } else {
        toast.error(res.error || 'Error de Validación SII al generar XML LCE.');
      }
    } catch {
      toast.error('Error inesperado de motor al generar XML.');
    } finally {
      setExportingLce(false);
    }
  };

  const nature = ledgerData?.naturaleza?.toLowerCase() || "deudora";
  const saldoAnterior = ledgerData?.saldo_anterior || 0;
  
  const isAperturaDebe = saldoAnterior !== 0 && ((nature === "deudora" && saldoAnterior >= 0) || (nature === "acreedora" && saldoAnterior < 0));
  const isAperturaHaber = saldoAnterior !== 0 && ((nature === "acreedora" && saldoAnterior >= 0) || (nature === "deudora" && saldoAnterior < 0));

  const getSourceBadge = (m: any) => {
    const glosa = (m.glosa || "").toUpperCase();
    const source = (m.source_type || "").toUpperCase();
    
    if (source === "NOMINA") {
      return <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase shrink-0">Nómina</Badge>;
    }
    if (source === "RCV" || glosa.includes("BOLETA") || glosa.includes("FACTURA") || glosa.includes("DTE")) {
      const typeLabel = glosa.includes("BOLETA") ? "Boleta" : glosa.includes("FACTURA") ? "Factura" : "DTE";
      return <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase shrink-0">{typeLabel}</Badge>;
    }
    if (glosa.includes("APERTURA") || glosa.includes("INICIAL")) {
      return <Badge className="bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase shrink-0">Apertura</Badge>;
    }
    return <Badge className="bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase shrink-0">Asiento</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" suppressHydrationWarning={true}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 bg-card border border-border rounded-[2.5rem] shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Análisis del Mayor</h2>
            <p className="text-xs font-bold text-muted-foreground italic uppercase tracking-[0.2em]">Dinámica Transaccional Contable</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-3 bg-muted/10 border-2 border-border rounded-[2rem] px-5 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 hover:border-primary/50 transition-all w-full md:w-auto h-14">
            <Search className="h-5 w-5 text-muted-foreground/50 shrink-0" />
            <select id="field_selectedaccount" name="field_selectedaccount" 
              className="bg-transparent border-0 text-xs font-black uppercase tracking-widest focus:ring-0 outline-none w-full text-foreground cursor-pointer"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="" className="text-muted-foreground/50">SELECCIONAR CUENTA...</option>
              {accounts.filter(a => a.acepta_movimiento).map(acc => (
                <option key={acc.id} value={acc.codigo} className="font-bold">
                  [{acc.codigo}] {acc.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-muted/10 border-2 border-border rounded-[2rem] px-5 py-2 shadow-sm hover:border-primary/50 transition-all w-full md:w-auto h-14 shrink-0">
            <Calendar className="h-5 w-5 text-muted-foreground/50 shrink-0" />
            <input 
              id="startDate"
              name="startDate"
              type="date"
              className="bg-transparent border-0 text-[11px] font-black uppercase focus:ring-0 outline-none w-28 text-foreground"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-muted-foreground/30 font-black">—</span>
            <input 
              id="endDate"
              name="endDate"
              type="date"
              className="bg-transparent border-0 text-[11px] font-black uppercase focus:ring-0 outline-none w-28 text-foreground"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <Button onClick={handleFetchLedger} disabled={loading} className="gap-3 font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-xl shadow-primary/20 h-14 px-8 active:scale-95 transition-all w-full md:w-auto shrink-0">
            {loading ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Filter className="h-5 w-5" />}
            Consultar Mayor
          </Button>

          <Button onClick={handleExportLce} disabled={exportingLce} variant="outline" className="gap-3 font-black uppercase text-[11px] tracking-widest border-2 border-primary text-primary hover:bg-primary/5 rounded-3xl h-14 px-8 active:scale-95 transition-all w-full md:w-auto shrink-0 group">
            {exportingLce ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />}
            SII LCE (XML)
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas KPI */}
      {ledgerData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
          <Card className="bg-card border-slate-200/60 shadow-xl rounded-3xl overflow-hidden hover:-translate-y-1 transition-transform relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400 group-hover:w-2 transition-all" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Anterior</span>
              <BookOpen className="h-4.5 w-4.5 text-slate-400" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-black text-slate-800 tracking-tight">
                {fCurrency(ledgerData.saldo_anterior)}
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <Info className="w-3 h-3 text-slate-400" /> Arrastre histórico de la cuenta
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-emerald-200/60 shadow-xl rounded-3xl overflow-hidden hover:-translate-y-1 transition-transform relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 group-hover:w-2 transition-all" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Cargos (Debe)</span>
              <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-black text-emerald-700 tracking-tight">
                {fCurrency(ledgerData.total_debe)}
              </div>
              <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> + {ledgerData.movements.filter((m: any) => m.debe > 0).length} movimientos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-rose-200/60 shadow-xl rounded-3xl overflow-hidden hover:-translate-y-1 transition-transform relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 group-hover:w-2 transition-all" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Total Abonos (Haber)</span>
              <ArrowUpRight className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-black text-rose-600 tracking-tight">
                {fCurrency(ledgerData.total_haber)}
              </div>
              <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> + {ledgerData.movements.filter((m: any) => m.haber > 0).length} movimientos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-indigo-200/60 shadow-xl rounded-3xl overflow-hidden hover:-translate-y-1 transition-transform relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 group-hover:w-2 transition-all" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Saldo Final Neto</span>
              <Coins className="h-4.5 w-4.5 text-indigo-500" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className={`text-2xl font-black tracking-tight ${ledgerData.saldo_final >= 0 ? 'text-indigo-700' : 'text-amber-600'}`}>
                {fCurrency(ledgerData.saldo_final)}
              </div>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5 ${ledgerData.saldo_final >= 0 ? 'text-indigo-500' : 'text-amber-600'}`}>
                {ledgerData.saldo_final >= 0 ? 'Saldo Deudor' : 'Saldo Acreedor'} en cierre
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Resultados del Libro Mayor */}
      {ledgerData && (
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/50 bg-muted/5 py-8 px-10 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <CardTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
                  <span className="text-primary mr-3 text-xl border-r-2 border-primary/20 pr-3">[{ledgerData.account_code}]</span> 
                  {ledgerData.account_name}
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-white text-primary border-2 border-primary/20 font-black uppercase text-[10px] tracking-widest py-1.5 px-4 shadow-sm rounded-full">
                  Naturaleza: {ledgerData.naturaleza}
                </Badge>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] italic text-muted-foreground/70">Trazabilidad Transaccional Consolidada IFRS</CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Selector de Modo de Vista */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-full border border-slate-200 shadow-inner">
                <Button
                  variant="ghost"
                  onClick={() => setViewMode("table")}
                  className={`h-9 px-4 rounded-full font-black uppercase text-[10px] tracking-wider transition-all duration-300 ${
                    viewMode === "table" 
                      ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 hover:bg-white" 
                      : "text-slate-500 hover:bg-slate-200/40"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Trazabilidad Lineal
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setViewMode("t-account")}
                  className={`h-9 px-4 rounded-full font-black uppercase text-[10px] tracking-wider transition-all duration-300 ${
                    viewMode === "t-account" 
                      ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 hover:bg-white" 
                      : "text-slate-500 hover:bg-slate-200/40"
                  }`}
                >
                  <Columns className="w-3.5 h-3.5 mr-1.5" /> Cuenta T (Mayor)
                </Button>
              </div>

              <Button 
                variant="outline" 
                className="gap-3 font-black uppercase text-[11px] tracking-widest h-12 px-6 rounded-3xl border-2 border-border hover:bg-muted shadow-lg active:scale-95 transition-all duration-300"
                onClick={handleExport}
                disabled={exporting || !ledgerData}
              >
                {exporting ? <RefreshCcw className="h-5 w-5 animate-spin text-primary" /> : <Download className="h-5 w-5 text-primary" />}
                {exporting ? 'Exportando...' : 'Exportar CSV'}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {viewMode === "t-account" ? (
              <div className="p-8 lg:p-12 bg-white">
                <div className="text-center pb-8 border-b-2 border-slate-800 max-w-lg mx-auto mb-10">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                    {ledgerData.account_code} — {ledgerData.account_name}
                  </h3>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <Badge className="bg-slate-100 text-slate-700 border border-slate-200 font-extrabold uppercase text-[9px] tracking-wider py-1 px-3.5 rounded-full">
                      Naturaleza: {ledgerData.naturaleza}
                    </Badge>
                  </div>
                </div>

                {/* Central T Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative">
                  <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-800 -translate-x-1/2" />

                  {/* Left Column: DEBE (Debits) */}
                  <div className="lg:pr-10 pb-10 lg:pb-0">
                    <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-6 bg-emerald-50/20 px-4 py-2.5 rounded-t-2xl">
                      <span className="text-sm font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> DEBE (CARGOS)
                      </span>
                      <span className="text-sm font-black text-emerald-700">{fCurrency(ledgerData.total_debe)}</span>
                    </div>

                    <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                      {isAperturaDebe && (
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Apertura</span>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Saldo Anterior Heredado</span>
                          </div>
                          <span className="text-xs font-black text-slate-700">{fCurrency(Math.abs(ledgerData.saldo_anterior))}</span>
                        </div>
                      )}

                      {ledgerData.movements.filter((m: any) => m.debe > 0).length === 0 && !isAperturaDebe ? (
                        <p className="text-xs text-muted-foreground italic text-center py-10">Sin cargos en el periodo.</p>
                      ) : (
                        ledgerData.movements.filter((m: any) => m.debe > 0).map((m: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-emerald-50/10 border border-emerald-100 rounded-2xl hover:bg-emerald-50/30 transition-colors">
                            <div className="space-y-1.5 pr-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] text-emerald-600/70 font-black uppercase tracking-tighter">
                                  {m.fecha && m.fecha.includes('-') ? m.fecha.split('T')[0].split('-').reverse().join('-') : m.fecha}
                                </span>
                                {getSourceBadge(m)}
                              </div>
                              <span className="text-xs font-black text-slate-700 uppercase tracking-tight block leading-relaxed">{m.glosa}</span>
                            </div>
                            <span className="text-xs font-black text-emerald-700 shrink-0">{fCurrency(m.debe)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: HABER (Credits) */}
                  <div className="lg:pl-10 pt-10 lg:pt-0 border-t-2 border-slate-800 lg:border-t-0">
                    <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-6 bg-rose-50/20 px-4 py-2.5 rounded-t-2xl">
                      <span className="text-sm font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4 text-rose-600" /> HABER (ABONOS)
                      </span>
                      <span className="text-sm font-black text-rose-600">{fCurrency(ledgerData.total_haber)}</span>
                    </div>

                    <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                      {isAperturaHaber && (
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Apertura</span>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Saldo Anterior Heredado</span>
                          </div>
                          <span className="text-xs font-black text-slate-700">{fCurrency(Math.abs(ledgerData.saldo_anterior))}</span>
                        </div>
                      )}

                      {ledgerData.movements.filter((m: any) => m.haber > 0).length === 0 && !isAperturaHaber ? (
                        <p className="text-xs text-muted-foreground italic text-center py-10">Sin abonos en el periodo.</p>
                      ) : (
                        ledgerData.movements.filter((m: any) => m.haber > 0).map((m: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-rose-50/10 border border-rose-100 rounded-2xl hover:bg-rose-50/30 transition-colors">
                            <div className="space-y-1.5 pr-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] text-rose-600/70 font-black uppercase tracking-tighter">
                                  {m.fecha && m.fecha.includes('-') ? m.fecha.split('T')[0].split('-').reverse().join('-') : m.fecha}
                                </span>
                                {getSourceBadge(m)}
                              </div>
                              <span className="text-xs font-black text-slate-700 uppercase tracking-tight block leading-relaxed">{m.glosa}</span>
                            </div>
                            <span className="text-xs font-black text-rose-600 shrink-0">{fCurrency(m.haber)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-slate-800 pt-8 mt-12 max-w-xl mx-auto">
                  <div className="flex flex-col items-center p-6 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Saldo Final Neto</span>
                    <span className={`text-3xl font-black tracking-tight ${ledgerData.saldo_final >= 0 ? 'text-indigo-700' : 'text-amber-600'}`}>
                      {fCurrency(ledgerData.saldo_final)}
                    </span>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className={`font-extrabold uppercase text-[9px] px-3.5 py-1.5 rounded-full ${
                        ledgerData.saldo_final >= 0 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ledgerData.saldo_final >= 0 ? 'Saldo Deudor' : 'Saldo Acreedor'}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">IFRS / NIIF</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/10 border-b border-border/50">
                      <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-foreground w-40">Fecha Asiento</TableHead>
                      <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-foreground">Glosa / Concepto Operacional</TableHead>
                      <TableHead className="text-right px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-foreground w-48">Cargo (Debe)</TableHead>
                      <TableHead className="text-right px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-foreground w-48">Abono (Haber)</TableHead>
                      <TableHead className="text-right px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-primary w-56 bg-primary/5">Saldo Acumulado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/30">
                    {(ledgerData.movements.length === 0 && ledgerData.saldo_anterior === 0) ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-40">
                            <Search className="w-12 h-12 text-muted-foreground stroke-[1]" />
                            <div className="space-y-1">
                              <p className="text-sm font-bold tracking-tight text-foreground">
                                No se detectaron asientos para esta cuenta en el periodo.
                              </p>
                              <p className="text-xs text-muted-foreground">Intenta ajustar el rango de fechas o verifica el plan de cuentas.</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {ledgerData.saldo_anterior !== 0 && (
                          <TableRow className="bg-muted/5 font-bold border-b-2 border-primary/10">
                            <TableCell className="px-10 py-5 text-muted-foreground/40 italic">Apertura</TableCell>
                            <TableCell className="px-10 py-5">
                              <div className="flex items-center gap-3">
                                <RefreshCcw className="w-3 h-3 text-primary/50 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Saldo Anterior Heredado (Historial)</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-10 py-5 text-muted-foreground/20">—</TableCell>
                            <TableCell className="text-right px-10 py-5 text-muted-foreground/20">—</TableCell>
                            <TableCell className={`text-right font-black px-10 py-5 bg-primary/5 ${ledgerData.saldo_anterior >= 0 ? 'text-primary' : 'text-amber-600'}`}>
                              {fCurrency(ledgerData.saldo_anterior)}
                            </TableCell>
                          </TableRow>
                        )}
                        {ledgerData.movements.map((m: any, idx: number) => {
                          const isDebe = m.debe > 0;
                          const rowBgClass = isDebe 
                            ? "hover:bg-emerald-50/[0.12] border-l-4 border-l-emerald-500/20" 
                            : "hover:bg-rose-50/[0.12] border-l-4 border-l-rose-500/20";
                          return (
                            <TableRow key={idx} className={`group border-border/30 transition-all ${rowBgClass}`}>
                              <TableCell className="px-10 py-6 whitespace-nowrap text-[11px] font-black uppercase tracking-tighter text-muted-foreground/60">
                                {m.fecha && m.fecha.includes('-') 
                                  ? m.fecha.split('T')[0].split('-').reverse().join('-') 
                                  : m.fecha}
                              </TableCell>
                              <TableCell className="px-10 py-6 max-w-sm">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {getSourceBadge(m)}
                                    <span className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-wider">
                                      Asiento: #{m.numero_asiento}
                                    </span>
                                  </div>
                                  <p className="font-black uppercase text-xs tracking-tight text-foreground leading-relaxed">{m.glosa}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-black text-sm text-emerald-700 px-10 py-6">
                                {m.debe > 0 ? (
                                  <div className="bg-emerald-50/50 rounded-lg py-2 px-4 inline-block shadow-sm ring-1 ring-emerald-100 group-hover:bg-emerald-50 transition-colors">
                                    {fCurrency(m.debe)}
                                  </div>
                                ) : <span className="text-muted-foreground/20">—</span>}
                              </TableCell>
                              <TableCell className="text-right font-black text-sm text-rose-600 px-10 py-6">
                                {m.haber > 0 ? (
                                  <div className="bg-rose-50/50 rounded-lg py-2 px-4 inline-block shadow-sm ring-1 ring-rose-100 group-hover:bg-rose-50 transition-colors">
                                    {fCurrency(m.haber)}
                                  </div>
                                ) : <span className="text-muted-foreground/20">—</span>}
                              </TableCell>
                              <TableCell className={`text-right font-black text-sm px-10 py-6 bg-primary/[0.02] group-hover:bg-primary/[0.05] transition-colors ${m.saldo >= 0 ? 'text-primary' : 'text-amber-600'}`}>
                                {fCurrency(m.saldo)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        
                        <TableRow className="bg-muted/30 font-black border-t-8 border-primary/10">
                          <TableCell colSpan={2} className="px-10 py-8 text-[11px] uppercase tracking-[0.2em] text-foreground">Resumen de Auditoría del Periodo</TableCell>
                          <TableCell className="text-right px-10 text-emerald-700 text-xl decoration-emerald-500/30 underline underline-offset-8 decoration-2 italic">
                            {fCurrency(ledgerData.total_debe)}
                          </TableCell>
                          <TableCell className="text-right px-10 text-rose-600 text-xl decoration-rose-500/30 underline underline-offset-8 decoration-2 italic">
                            {fCurrency(ledgerData.total_haber)}
                          </TableCell>
                          <TableCell className="text-right px-10 bg-primary/5 py-8 border-l border-primary/10">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-primary/60 font-black uppercase tracking-[0.2em] leading-none mb-2">Saldo Final Neto</span>
                              <span className="text-primary text-3xl font-black tracking-tighter">{fCurrency(ledgerData.saldo_final)}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!ledgerData && !loading && (
        <div className="flex flex-col items-center justify-center py-24 bg-card border border-border/80 rounded-[2.5rem] shadow-xl relative overflow-hidden bg-gradient-to-tr from-slate-50 via-white to-primary/[0.02] group">
           {/* Subtle decorative glow */}
           <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
           
           <div className="relative z-10 flex flex-col items-center max-w-md text-center px-6">
             <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 mb-6 group-hover:scale-105 transition-transform duration-300">
               <BookOpen className="h-12 w-12 text-primary" />
             </div>
             <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Visualizador del Mayor</h3>
             <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1 mb-4">Módulo de Mayorización Dinámica</p>
             <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8">
               Para comenzar el análisis transaccional IFRS, selecciona una cuenta contable estratégica y define el rango de fechas en la barra superior.
             </p>
             <div className="flex items-center gap-3 py-2.5 px-5 bg-primary/5 border border-primary/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
               <Info className="w-3.5 h-3.5" /> Selecciona una cuenta arriba para comenzar
             </div>
           </div>
        </div>
      )}

      {/* Footer Informativo Institutional */}
      <div className="flex items-center gap-5 p-8 bg-primary/5 border border-primary/10 rounded-2xl shadow-inner">
        <div className="h-12 w-12 rounded-2xl bg-white border border-primary/20 shadow-sm flex items-center justify-center shrink-0">
          <Info className="h-6 w-6 text-primary" />
        </div>
        <p className="text-[11px] text-muted-foreground font-bold leading-relaxed italic">
          <strong className="text-primary uppercase tracking-widest block mb-1">Criterio Institucional de Valoración:</strong> 
          El saldo acumulado es una variable dinámica que se reconstruye en tiempo real desde el origen de los tiempos contables internos para garantizar la integridad histórica absoluta bajo normativa <span className="text-foreground font-black not-italic border-b-2 border-primary/20 pb-0.5">IFRS (NIIF)</span>.
        </p>
      </div>
    </div>
  );
}
