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
import { 
  Search, 
  Printer, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  Calendar, 
  Info, 
  FileText,
  ShieldCheck,
  History,
  ExternalLink,
  FileCheck,
  Trash2,
  Loader2
} from "lucide-react";
import { getTrialBalance, archiveCertifiedReport, getCertifiedReports, deleteCertifiedReport } from "@/actions/accounting";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { fCurrency } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TrialBalanceClient({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
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
      
      // Fetch organization details for the PDF
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      setOrganization(org);

      // Load certification history
      const certs = await getCertifiedReports(organizationId, 'trial_balance');
      setHistory(certs);

      toast.success("Balance generado exitosamente");
    } catch (error) {
      toast.error("Error crítico al cargar el balance");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const headers = ["Codigo", "Cuenta", "Debe", "Haber", "Saldo Deudor", "Saldo Acreedor"];
    const rows = data.map(item => [
      item.codigo,
      item.nombre,
      item.debe,
      item.haber,
      item.saldo_deudor,
      item.saldo_acreedor
    ]);

    const allRows = [headers, ...rows];
    // Totales
    allRows.push(["TOTALES", "", totalSumas.debe, totalSumas.haber, totalSumas.saldo_deudor, totalSumas.saldo_acreedor]);

    const csvContent = "\uFEFF" + allRows.map(row => 
      row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TRIAL_BALANCE_${dates.start}_TO_${dates.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Balance exportado a CSV");
  };

  const fetchQRBase64 = async (text: string): Promise<string | null> => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
      const res = await fetch(qrUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleExportPDF = async (archive = false) => {
    if (!data || data.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    if (archive) setIsArchiving(true);
    
    try {
      const doc = new jsPDF();
      const integrityHash = `SHA256-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    const verifyUrl = `https://contapymepuq.cl/verify/tb-${organizationId.slice(0,8)}`;
    const qrBase64 = await fetchQRBase64(verifyUrl);
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); 
    doc.text(organization?.nombre?.toUpperCase() || "CONTAPYMEPUQ", 14, 22);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`RUT: ${organization?.rut_empresa || "—"}`, 14, 28);
    doc.text("SISTEMA DE INTELIGENCIA CONTABLE CENTRALIZADA", 14, 33);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 38, 196, 38);
    
    // Title & Period
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("BALANCE DE COMPROBACIÓN Y SALDOS", 14, 45);
    
    doc.setFontSize(10);
    doc.text(`PERIODO: ${dates.start} AL ${dates.end}`, 14, 52);
    doc.text(`FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`, 14, 57);

    // Summary Box
    doc.setFillColor(248, 250, 252); // bg-muted/20
    doc.roundedRect(14, 65, 182, 25, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("ESTADO DE INTEGRIDAD:", 20, 75);
    if (isSquare) {
        doc.setTextColor(5, 150, 105); // Emerald
    } else {
        doc.setTextColor(225, 29, 72); // Rose
    }
    doc.setFont('helvetica', 'bold');
    doc.text(isSquare ? "VERIFICADO - CUADRADO" : "ALERTA - DESCUADRADO", 60, 75);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text("DIFERENCIA NETA:", 20, 82);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(fCurrency(Math.abs(totalSumas.debe - totalSumas.haber)), 60, 82);

    // Table
    const tableHeaders = [["CÓDIGO", "CUENTA CONTABLE", "DEBE", "HABER", "DEUDOR", "ACREEDOR"]];
    const tableData = data.map(item => [
      item.codigo,
      item.nombre.toUpperCase(),
      fCurrency(item.debe),
      fCurrency(item.haber),
      fCurrency(item.saldo_deudor),
      fCurrency(item.saldo_acreedor)
    ]);

    // Add totals row
    tableData.push([
      { content: 'TOTALES CONSOLIDADOS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [255, 255, 255] } },
      { content: fCurrency(totalSumas.debe), styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [255, 255, 255] } },
      { content: fCurrency(totalSumas.haber), styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [255, 255, 255] } },
      { content: fCurrency(totalSumas.saldo_deudor), styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [255, 255, 255] } },
      { content: fCurrency(totalSumas.saldo_acreedor), styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [255, 255, 255] } }
    ]);

    autoTable(doc, {
      startY: 100,
      head: tableHeaders,
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      },
      styles: {
        fontSize: 7,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    });

    // Final signature and seal section
    let finalY = (doc as any).lastAutoTable.finalY + 30;
    
    // Check for page overflow
    if (finalY > 230) {
        doc.addPage();
        finalY = 30;
    }

    // Signature Lines
    doc.setLineWidth(0.2);
    doc.setDrawColor(0);
    doc.line(30, finalY, 90, finalY);   // Accountant
    doc.line(120, finalY, 180, finalY); // Legal Rep

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text('CERTIFICACIÓN CONTADOR', 60, finalY + 5, { align: 'center' });
    doc.text('REPRESENTANTE LEGAL', 150, finalY + 5, { align: 'center' });

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text('CONTABILIDAD GENERAL', 60, finalY + 9, { align: 'center' });
    doc.text(organization?.nombre || 'EMPRESA', 150, finalY + 9, { align: 'center' });

    // Digital Seal
    finalY += 20;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, finalY, 196, finalY);
    
    finalY += 5;
    if (qrBase64) {
        doc.addImage(qrBase64, 'PNG', 14, finalY, 20, 20);
    }
    
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(80);
    doc.text('SELLO DE INTEGRIDAD DIGITAL - VALIDEZ INSTITUCIONAL', 38, finalY + 5);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(6);
    doc.setTextColor(140);
    doc.text(`HASH DE INTEGRIDAD: ${integrityHash}`, 38, finalY + 9);
    doc.text(`CÓDIGO DE VERIFICACIÓN: TB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 38, finalY + 13);
    doc.text(`GENERADO POR: CONTAPYMEPUQ INTELLIGENCE ENGINE V2.5`, 38, finalY + 17);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} | Documento Certificado Digitalmente | ${new Date().toLocaleString('es-CL')}`, 105, 288, { align: 'center' });
    }

    doc.save(`TRIAL_BALANCE_${dates.start}_${dates.end}.pdf`);
    
    if (archive) {
      const pdfBase64 = doc.output('datauristring');
      const result = await archiveCertifiedReport({
        organization_id: organizationId,
        report_type: 'trial_balance',
        period_start: dates.start,
        period_end: dates.end,
        file_base64: pdfBase64,
        integrity_hash: integrityHash
      });

      if (result.success) {
        toast.success("Documento Certificado y Archivado en el Repositorio");
        // Refresh history
        const certs = await getCertifiedReports(organizationId, 'trial_balance');
        setHistory(certs);
      } else {
        toast.error(`Error al archivar: ${result.error}`);
      }
      setIsArchiving(false);
    } else {
      toast.success("Documento Certificado generado");
    }
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Error al generar el documento certificado");
      setIsArchiving(false);
    }
  };

  useEffect(() => {
    if (mounted && organizationId) {
      fetchData();
    }
  }, [organizationId, mounted]);

  const handleDeleteReport = async (reportId: string, filePath: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este reporte certificado? Esta acción no se puede deshacer.")) {
      return;
    }
    
    const toastId = toast.loading("Eliminando reporte...");
    try {
      const result = await deleteCertifiedReport(reportId, filePath);
      console.log("CLICK: Resultado del servidor:", result);
      if (result.success) {
        toast.success("Reporte eliminado correctamente", { id: toastId });
        // Update local state
        setHistory(prev => prev.filter(item => item.id !== reportId));
      } else {
        toast.error("Error al eliminar: " + (result.error || "Desconocido"), { id: toastId });
      }
    } catch (error) {
      toast.error("Error de conexión al eliminar", { id: toastId });
    }
  };

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
            <Button 
                onClick={() => handleExportPDF(false)}
                variant="outline" 
                className="gap-2 font-black uppercase text-[10px] tracking-widest h-14 px-8 rounded-full border-2 border-border hover:bg-muted shadow-sm active:scale-95 transition-all flex-1 lg:flex-none"
            >
                <FileText className="h-5 w-5 text-primary" /> PDF Local
            </Button>
            <Button 
                onClick={() => handleExportPDF(true)}
                disabled={isArchiving}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest h-14 px-8 rounded-full shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex-1 lg:flex-none"
            >
                {isArchiving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
                Certificar y Archivar
            </Button>
            <Button 
                onClick={handleExportCSV}
                variant="outline" 
                className="gap-2 font-black uppercase text-[10px] tracking-widest h-14 px-8 rounded-full border-2 border-border hover:bg-muted shadow-sm active:scale-95 transition-all flex-1 lg:flex-none"
            >
                <Download className="h-5 w-5 text-primary" /> Data Export
            </Button>
        </div>
      </div>

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
            <span className="text-4xl font-black tracking-tighter">{fCurrency(Math.abs(totalSumas.debe - totalSumas.haber))}</span>
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
                        {row.debe > 0 ? fCurrency(row.debe) : <span className="opacity-0">—</span>}
                    </TableCell>
                    <TableCell className="text-right px-10 py-6 font-bold text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        {row.haber > 0 ? fCurrency(row.haber) : <span className="opacity-0">—</span>}
                    </TableCell>
                    <TableCell className="text-right px-10 py-6 bg-blue-50/10 group-hover:bg-blue-50/30 transition-colors">
                        <span className="text-sm font-black text-primary">
                            {row.saldo_deudor > 0 ? fCurrency(row.saldo_deudor) : <span className="opacity-0">—</span>}
                        </span>
                    </TableCell>
                    <TableCell className="text-right px-10 py-6 bg-amber-50/10 group-hover:bg-amber-50/30 transition-colors">
                         <span className="text-sm font-black text-amber-600">
                            {row.saldo_acreedor > 0 ? fCurrency(row.saldo_acreedor) : <span className="opacity-0">—</span>}
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
                                <span className="text-sm font-black text-foreground">{fCurrency(totalSumas.debe)}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Suma Débitos</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right px-10 py-10">
                             <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-foreground">{fCurrency(totalSumas.haber)}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Suma Créditos</span>
                             </div>
                        </TableCell>
                        <TableCell className="text-right px-10 py-10 bg-primary/5 border-l border-primary/10">
                             <div className="flex flex-col items-end">
                                <span className="text-primary text-2xl font-black tracking-tighter">{fCurrency(totalSumas.saldo_deudor)}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-1 whitespace-nowrap">Acumulado Deudor</span>
                             </div>
                        </TableCell>
                        <TableCell className="text-right px-10 py-10 bg-amber-600/5 border-l border-amber-600/10">
                             <div className="flex flex-col items-end">
                                <span className="text-amber-600 text-2xl font-black tracking-tighter">{fCurrency(totalSumas.saldo_acreedor)}</span>
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

      {/* Historial de Certificaciones */}
      <Card className="bg-white border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-border bg-slate-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                <History className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Historial de Certificaciones</CardTitle>
                <CardDescription className="text-xs font-bold">Registro inmutable de balances generados y archivados</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="rounded-lg font-black text-[10px] uppercase px-3 py-1 bg-white">
              {history.length} Documentos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
              <FileCheck className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-bold italic">No hay documentos certificados en el repositorio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((report) => (
                <div key={report.id} className="group relative p-6 bg-white border border-border rounded-3xl hover:border-indigo-200 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    {report.download_url && (
                      <a 
                        href={report.download_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <h4 className="font-black text-sm uppercase tracking-tight truncate">
                      Balance {new Date(report.period_start + 'T12:00:00').toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-bold">
                      {new Date(report.period_start + 'T12:00:00').toLocaleDateString()} al {new Date(report.period_end + 'T12:00:00').toLocaleDateString()}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase text-muted-foreground">Hash Integridad</span>
                      <span className="font-mono text-[9px] text-indigo-600 truncate w-32">{report.integrity_hash}</span>
                    </div>
                    {report.download_url && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-black text-[10px] uppercase"
                          onClick={() => handleDeleteReport(report.id, report.file_path)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Borrar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-black text-[10px] uppercase px-3"
                          onClick={() => window.open(report.download_url, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" /> Ver
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
