"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileDown, 
  Plus, 
  RefreshCw, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  TrendingUp,
  DollarSign,
  Users,
  Info
} from "lucide-react";
import { generateLREAction, exportLREAction } from "@/actions/lre";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface LREBook {
  id: string;
  periodo: string;
  book_number: number;
  status: string;
  total_employees: number;
  total_liquido: number;
  generated_at: string;
}

export default function LREClient({ 
  organization, 
  initialBooks,
  error 
}: { 
  organization: any, 
  initialBooks: LREBook[],
  error?: string | null
}) {
  const [books, setBooks] = useState<LREBook[]>(initialBooks);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const totalLiquidoAcumulado = books.reduce((acc, curr) => acc + curr.total_liquido, 0);
  const totalLibrosGenerados = books.length;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateLREAction({
        organization_id: organization.id,
        periodo: selectedMonth,
        company_name: organization.nombre,
        company_rut: organization.rut_empresa
      });

      if (result.success) {
        toast.success("LRE consolidado exitosamente.", {
            description: "El archivo maestro ha sido inyectado en el historial.",
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        });
        window.location.reload();
      } else {
        toast.error(result.error || "Error al procesar el libro");
      }
    } catch (error) {
      toast.error("Fallo crítico en el motor de consolidación LRE.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (book: LREBook) => {
    try {
      const result = await exportLREAction(book.id);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `LRE_${organization.rut_empresa}_${book.periodo}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Descarga de CSV (DT) iniciada.");
      } else {
        // Mostrar el error real del backend
        const errorMsg = result.error || "Error desconocido al exportar";
        if (errorMsg.includes("no existe") || errorMsg.includes("reemplazado")) {
          toast.error("Este libro fue reemplazado. Refrescando lista...", {
            description: "Se generó una nueva versión. Recargando datos actualizados."
          });
          window.location.reload();
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      toast.error("Error en la conexión con el servidor de archivos.");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {error && (
        <div className="bg-rose-50 border-2 border-rose-100 text-rose-700 p-6 rounded-[2rem] flex items-center gap-4 shadow-xl shadow-rose-500/5 animate-pulse">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <p className="font-black uppercase text-xs tracking-widest leading-relaxed">
            <span className="opacity-60">Fallo de Integridad:</span> {error}
          </p>
        </div>
      )}

      {/* ===== KPI DASHBOARD ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPIItem 
            label="Libros Consolidados" 
            value={String(totalLibrosGenerados)} 
            icon={History} 
            color="text-primary" 
            borderColor="border-primary"
            sub="Historial completo en base de datos" 
          />
          <KPIItem 
            label="Volume Líquido" 
            value={`$${totalLiquidoAcumulado.toLocaleString('es-CL')}`} 
            icon={DollarSign} 
            color="text-emerald-600" 
            borderColor="border-emerald-600"
            sub="Masa salarial total sintetizada" 
          />
          <KPIItem 
            label="Estado Normativo" 
            value="DT-VALID" 
            icon={TrendingUp} 
            color="text-blue-600" 
            borderColor="border-blue-600"
            sub="Estructura de 147 columnas activa" 
          />
      </div>

      <div className="grid grid-cols-1 gap-10">
        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10">
            <CardHeader className="bg-muted/5 border-b border-border p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-4">
                    <Plus className="h-6 w-6 text-primary" />
                    Nuevo Consolidador LRE
                </CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    CONSOLIDACIÓN DE LIQUIDACIONES PROCESADAS POR PERIODO
                </CardDescription>
              </div>
              <div className="flex flex-col md:flex-row items-stretch md:items-end gap-6 w-full md:w-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PERIODO FISCAL</label>
                  <input 
                    type="month" 
                    className="flex h-12 w-full md:w-48 rounded-xl border border-border bg-white px-4 py-2 text-xs font-black uppercase tracking-tight shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={generating}
                  className="bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all gap-3"
                >
                  {generating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5" />}
                  {generating ? "PROCESANDO..." : "GENERAR LIBRO LRE"}
                </Button>
              </div>
            </CardHeader>
        </Card>

        <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-500/10 transition-all">
          <CardHeader className="bg-muted/5 border-b border-border p-10">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Historial de Generaciones</CardTitle>
              <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                  REGISTRO MAESTRO DE ARCHIVOS DT PARA {organization.nombre || 'LA ORGANIZACIÓN'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-border">
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Periodo Fiscal</TableHead>
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Estado / Validación</TableHead>
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Dotación / Masa Salarial</TableHead>
                    <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Fecha de Emisión</TableHead>
                    <TableHead className="text-right text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Descarga Normativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/50">
                  {books.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={6} className="p-10">
                         <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border border-dashed border-border rounded-[2rem] text-center bg-gradient-to-tr from-slate-50 to-emerald-500/[0.01]">
                           <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 mb-6">
                             <FileSpreadsheet className="h-10 w-10 text-primary" />
                           </div>
                           <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Historial LRE Vacío</h3>
                           <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 mb-3">CONSOLIDACIÓN ELECTRÓNICA DE REMUNERACIONES</p>
                           <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6 font-medium">
                             No se registran libros emitidos para esta organización en el historial. Selecciona un período fiscal en el panel superior para generar el archivo mensual de 147 columnas.
                           </p>
                           <div className="flex items-center gap-2 py-2 px-4 bg-emerald-50 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-700">
                             <Info className="w-3.5 h-3.5" /> Genera un nuevo libro arriba
                           </div>
                         </div>
                       </TableCell>
                     </TableRow>
                  ) : (
                    books.map((book) => (
                      <TableRow key={book.id} className="border-border hover:bg-emerald-600/[0.01] transition-colors group">
                        <TableCell className="px-10 py-8 font-black text-foreground uppercase text-xs tracking-tight group-hover:text-emerald-700">
                          {new Date(book.periodo + "T12:00:00").toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="px-10 py-8">
                          {book.status === 'approved' ? (
                            <Badge className="bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
                              <CheckCircle2 className="h-3 w-3" /> Aprobado
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
                              <Clock className="h-3 w-3" /> Borrador
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-10 py-8">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-black text-foreground/80 flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 opacity-40" /> {book.total_employees} Trabajadores
                                </span>
                                <span className="font-mono text-[10px] font-black text-emerald-600">
                                    ${book.total_liquido.toLocaleString('es-CL')} Liquidados
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="px-10 py-8 font-mono text-xs font-black text-foreground/50">
                            {new Date(book.generated_at).toLocaleDateString('es-CL')}
                        </TableCell>
                        <TableCell className="px-10 py-8 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white border-border hover:bg-emerald-50 hover:border-emerald-200 text-emerald-700 font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl transition-all shadow-sm group/btn"
                            onClick={() => handleDownload(book)}
                          >
                            <FileDown className="h-4 w-4 mr-2 group-hover/btn:translate-y-0.5 transition-transform" />
                            DESCARGAR CSV (.DT)
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 3. Info del portal DT */}
        <div className="rounded-[2.5rem] border-2 border-blue-100 bg-blue-50/50 p-10 text-sm text-blue-900 flex flex-col md:flex-row gap-8 shadow-xl shadow-blue-500/5 animate-in fade-in duration-1000">
          <div className="p-5 bg-blue-600 text-white rounded-[1.5rem] shadow-xl shadow-blue-600/20 shrink-0 self-start">
             <Info className="h-10 w-10" />
          </div>
          <div className="space-y-4">
            <h4 className="font-black uppercase text-xs tracking-[0.2em] text-blue-900 border-b border-blue-200 pb-2">Información Técnica Normativa</h4>
            <p className="font-medium italic leading-relaxed text-blue-800/80">
              El archivo generado cumple con la estructura de <strong className="text-blue-900">147 columnas</strong> definida por la Dirección del Trabajo (DT). 
              Recuerde que para una carga exitosa en el portal institucional:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <li className="flex items-center gap-3 text-[11px] font-black uppercase tracking-tight text-blue-700 bg-white/40 p-3 rounded-xl border border-blue-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Liquidaciones Cerradas
                </li>
                <li className="flex items-center gap-3 text-[11px] font-black uppercase tracking-tight text-blue-700 bg-white/40 p-3 rounded-xl border border-blue-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Rut Empresa Válido
                </li>
                <li className="flex items-center gap-3 text-[11px] font-black uppercase tracking-tight text-blue-700 bg-white/40 p-3 rounded-xl border border-blue-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Cotizaciones Declaradas
                </li>
                <li className="flex items-center gap-3 text-[11px] font-black uppercase tracking-tight text-blue-700 bg-white/40 p-3 rounded-xl border border-blue-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Estructura CSV UTF-8
                </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HELPERS & SUBCOMPONENTS
// ==========================================
function KPIItem({ label, value, sub, icon: Icon, color, borderColor }: any) {
    return (
        <Card className={`bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 ${borderColor} group hover:scale-[1.02] transition-all`}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2 leading-none">{label}</p>
              <p className={`text-3xl font-black tracking-tighter ${color}`}>{value}</p>
              {sub && <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">{sub}</p>}
            </div>
            <div className={`p-4 rounded-2xl bg-muted/30 border border-border group-hover:bg-white transition-colors`}>
              <Icon className={`w-8 h-8 ${color} opacity-40 group-hover:opacity-100 transition-opacity`} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
}
