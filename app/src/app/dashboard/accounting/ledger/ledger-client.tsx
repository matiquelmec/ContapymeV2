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
  Info
} from "lucide-react";
import { getLedger } from "@/actions/accounting";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function LedgerClient({ organizationId, accounts }: { organizationId: string, accounts: any[] }) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
            <select 
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
              type="date"
              className="bg-transparent border-0 text-[11px] font-black uppercase focus:ring-0 outline-none w-28 text-foreground"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-muted-foreground/30 font-black">—</span>
            <input 
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
        </div>
      </div>

      {/* 2. Resultados del Libro Mayor */}
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
            <Button variant="outline" className="gap-3 font-black uppercase text-[11px] tracking-widest h-14 px-8 rounded-3xl border-2 border-border hover:bg-muted shadow-lg active:scale-95 transition-all duration-300">
              <Download className="h-5 w-5 text-primary" /> Exportar Mayor
            </Button>
          </CardHeader>
          <CardContent className="p-0">
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
                  {ledgerData.movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-32">
                        <div className="flex flex-col items-center gap-4 text-muted-foreground">
                          <div className="p-6 bg-muted rounded-full">
                            <ArrowRightLeft className="h-10 w-10 opacity-30" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest italic">No se detectaron asientos para esta cuenta en el periodo.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {ledgerData.movements.map((m: any, idx: number) => (
                        <TableRow key={idx} className="group border-border/30 hover:bg-primary/[0.02] transition-colors">
                          <TableCell className="px-10 py-6 whitespace-nowrap text-[11px] font-black uppercase tracking-tighter text-muted-foreground/60">
                            {new Date(m.fecha).toLocaleDateString('es-CL')}
                          </TableCell>
                          <TableCell className="px-10 py-6 max-w-sm">
                            <p className="font-black uppercase text-xs tracking-tight text-foreground leading-relaxed">{m.glosa}</p>
                          </TableCell>
                          <TableCell className="text-right font-black text-sm text-emerald-700 px-10 py-6">
                            {m.debe > 0 ? (
                              <div className="bg-emerald-50/50 rounded-lg py-2 px-4 inline-block shadow-sm ring-1 ring-emerald-100 group-hover:bg-emerald-50 transition-colors">
                                ${m.debe.toLocaleString('es-CL')}
                              </div>
                            ) : <span className="text-muted-foreground/20">—</span>}
                          </TableCell>
                          <TableCell className="text-right font-black text-sm text-rose-600 px-10 py-6">
                            {m.haber > 0 ? (
                              <div className="bg-rose-50/50 rounded-lg py-2 px-4 inline-block shadow-sm ring-1 ring-rose-100 group-hover:bg-rose-50 transition-colors">
                                ${m.haber.toLocaleString('es-CL')}
                              </div>
                            ) : <span className="text-muted-foreground/20">—</span>}
                          </TableCell>
                          <TableCell className={`text-right font-black text-sm px-10 py-6 bg-primary/[0.02] group-hover:bg-primary/[0.05] transition-colors ${m.saldo >= 0 ? 'text-primary' : 'text-amber-600'}`}>
                            ${m.saldo.toLocaleString('es-CL')}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Fila de Totales de Alto Impacto */}
                      <TableRow className="bg-muted/30 font-black border-t-8 border-primary/10">
                        <TableCell colSpan={2} className="px-10 py-8 text-[11px] uppercase tracking-[0.2em] text-foreground">Resumen de Auditoría del Periodo</TableCell>
                        <TableCell className="text-right px-10 text-emerald-700 text-xl decoration-emerald-500/30 underline underline-offset-8 decoration-2 italic">
                          ${ledgerData.total_debe.toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell className="text-right px-10 text-rose-600 text-xl decoration-rose-500/30 underline underline-offset-8 decoration-2 italic">
                          ${ledgerData.total_haber.toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell className="text-right px-10 bg-primary/5 py-8 border-l border-primary/10">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-primary/60 font-black uppercase tracking-[0.2em] leading-none mb-2">Saldo Final Neto</span>
                            <span className="text-primary text-3xl font-black tracking-tighter">${ledgerData.saldo_final.toLocaleString('es-CL')}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!ledgerData && !loading && (
        <div className="flex flex-col items-center justify-center py-32 bg-card border-4 border-dashed rounded-[2.5rem] opacity-60 border-border shadow-inner animate-pulse">
           <div className="bg-white p-8 rounded-3xl shadow-2xl mb-8 border border-border">
            <BookOpen className="h-16 w-16 text-primary/20" />
           </div>
           <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Requerimiento de Consulta</h3>
           <p className="text-muted-foreground text-sm font-bold italic max-w-sm text-center mt-3 leading-relaxed">
             Seleccione la cuenta analítica y determine el rango temporal para generar el reporte de mayorización dinámica.
           </p>
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
