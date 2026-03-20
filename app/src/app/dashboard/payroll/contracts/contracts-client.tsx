"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Download, 
  UserPlus,
  Sparkles,
  Bot,
  RefreshCcw as RefreshIcon,
  AlertTriangle,
  ArrowRight,
  Zap,
  ShieldCheck,
  History,
  FileBadge
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { generateJobDescription } from "@/actions/ai-assistant";

interface Employee {
  id: string;
  nombres: string;
  apellido_paterno: string;
  rut: string;
  cargo: string;
}

export default function ContractsClient({ 
  organizationId, 
  initialContracts,
  employees,
  settings 
}: { 
  organizationId: string, 
  initialContracts: any[],
  employees: Employee[],
  settings: any
}) {
  const router = useRouter();
  const hasLegalRep = settings?.rep_legal_nombre && settings?.rep_legal_rut;
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<string>("");
  const [docType, setDocType] = useState<string>("contrato");
  const [open, setOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleGenerateAiDescription = async () => {
    if (!jobTitle) return toast.error("Ingrese un nombre de cargo");
    setIsAiLoading(true);
    try {
      const desc = await generateJobDescription(jobTitle);
      setAiDescription(desc);
      toast.success("Descripción generada por el motor de IA.");
    } catch (error) {
      toast.error("Error al generar descripción por IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedEmp) {
      toast.error("Seleccione un empleado");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/documents/generate?employee_id=${selectedEmp}&type=${docType}`);
      
      if (!response.ok) throw new Error("Error al generar el documento");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docType}_${selectedEmp}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setOpen(false);
      toast.success("Documento laboral sintetizado y descargado.");
      router.refresh();
    } catch (error) {
      toast.error("Fallo crítico en la generación documental.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {!hasLegalRep && (
        <Card className="border-amber-200 bg-amber-50/50 rounded-3xl shadow-xl shadow-amber-500/5 animate-pulse">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-amber-100 rounded-2xl border border-amber-200 shadow-sm">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-black text-amber-900 uppercase text-xs tracking-widest">Configuración Institucional Requerida</h3>
                <p className="text-sm text-amber-700 font-medium italic">
                  No se ha detectado un <strong>Representante Legal</strong> activo. 
                  La validez jurídica de los documentos generados requiere completar este registro.
                </p>
                <div className="pt-3">
                  <Link href="/dashboard/payroll/settings">
                    <Button variant="outline" size="sm" className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 font-black uppercase text-[10px] tracking-widest rounded-xl px-6 h-10 shadow-sm transition-all hover:scale-105 active:scale-95">
                      Configurar Entidad <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== CUADRO DE MANDO RÁPIDO ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPIItem 
            label="Contratos Activos" 
            value={String(employees.length)} 
            icon={ShieldCheck} 
            color="text-blue-600" 
            borderColor="border-blue-600"
            sub="Documentación vigente controlada" 
          />
          <KPIItem 
            label="Última Generación" 
            value={initialContracts.length > 0 ? new Date(initialContracts[0].created_at).toLocaleDateString() : 'N/A'} 
            icon={History} 
            color="text-purple-600" 
            borderColor="border-purple-600"
            sub="Actividad documental reciente" 
          />
          <KPIItem 
            label="Tasa de Digitalización" 
            value="100%" 
            icon={Zap} 
            color="text-emerald-600" 
            borderColor="border-emerald-600"
            sub="Certificación de flujo sin papel" 
          />
      </div>

      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10 transition-all">
        <CardHeader className="bg-muted/5 border-b border-border p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Kardex de Documentos</CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                HISTORIAL DE CONTRATOS Y ANEXOS LEGALES GENERADOS POR EL SISTEMA
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
              render={
                <Button className="bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all">
                  <Plus className="h-5 w-5 mr-2" /> NUEVO DOCUMENTO
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[550px] bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
              <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-500 to-transparent" />
              <DialogHeader className="p-10 pb-6 border-b border-border bg-muted/5">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                        <FileBadge className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-0.5 text-left">
                        <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Síntesis Documental</DialogTitle>
                        <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                            GENERACIÓN DE INSTRUMENTOS LABORALES SEGÚN NORMATIVA
                        </DialogDescription>
                    </div>
                </div>
              </DialogHeader>
              <div className="p-10 space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TRABAJADOR SELECCIONADO</label>
                    <select 
                      className="flex h-12 w-full rounded-xl border border-border bg-white px-4 py-2 text-xs font-black uppercase tracking-tight shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                      value={selectedEmp}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEmp(e.target.value)}
                    >
                      <option value="" disabled>--- Seleccione Colaborador ---</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id} className="font-sans">
                          {emp.nombres} {emp.apellido_paterno} — {emp.rut}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-4 pt-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TIPO DE INSTRUMENTO</label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant={docType === 'contrato' ? 'default' : 'outline'}
                        onClick={() => setDocType('contrato')}
                        className={`h-14 font-black uppercase text-[10px] tracking-[0.15em] rounded-2xl shadow-lg transition-all ${docType === 'contrato' ? 'shadow-primary/20 scale-[1.02]' : 'border-border/60 hover:border-primary/40 opacity-70 hover:opacity-100'}`}
                      >
                        <FileText className="h-5 w-5 mr-3" /> Contrato de Trabajo
                      </Button>
                      <Button 
                        variant={docType === 'anexo' ? 'default' : 'outline'}
                        onClick={() => setDocType('anexo')}
                        className={`h-14 font-black uppercase text-[10px] tracking-[0.15em] rounded-2xl shadow-lg transition-all ${docType === 'anexo' ? 'shadow-primary/20 scale-[1.02]' : 'border-border/60 hover:border-primary/40 opacity-70 hover:opacity-100'}`}
                      >
                        <UserPlus className="h-5 w-5 mr-3" /> Anexo de Contrato
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-10 pt-0">
                <Button 
                  onClick={handleDownload} 
                  disabled={isGenerating || !selectedEmp} 
                  className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all gap-4"
                >
                  {isGenerating ? <RefreshIcon className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  {isGenerating ? "PROCESANDO..." : "EMITIR DOCUMENTO (.DOCX)"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-border">
                  <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Personal Identificado</TableHead>
                  <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Tipo / Naturaleza</TableHead>
                  <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Fecha de Síntesis</TableHead>
                  <TableHead className="text-right text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Certificado / Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {initialContracts.map((contract) => (
                  <TableRow key={contract.id} className="border-border hover:bg-primary/[0.01] transition-colors group">
                    <TableCell className="px-10 py-6">
                        <div className="flex flex-col">
                            <span className="font-black text-foreground uppercase text-xs tracking-tight group-hover:text-primary transition-colors">
                                {contract.employees?.nombres} {contract.employees?.apellido_paterno}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 font-bold uppercase italic mt-0.5">RUT: {contract.employees?.rut}</span>
                        </div>
                    </TableCell>
                    <TableCell className="px-10 py-6">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${contract.tipo_documento === 'contrato' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                            {contract.tipo_documento}
                        </span>
                    </TableCell>
                    <TableCell className="px-10 py-6">
                        <span className="font-mono text-xs font-black text-foreground/70">
                            {new Date(contract.created_at).toLocaleDateString()}
                        </span>
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 w-12 h-12 rounded-2xl transition-all"
                        onClick={async () => {
                           toast.info("Regenerando documento histórico...");
                           try {
                             const response = await fetch(`/api/documents/generate?employee_id=${contract.employee_id}&type=${contract.tipo_documento}`);
                             if (!response.ok) throw new Error("Error interno");
                             const blob = await response.blob();
                             const url = window.URL.createObjectURL(blob);
                             const a = document.createElement("a");
                             a.href = url;
                             a.download = `${contract.tipo_documento}_REGEN.docx`;
                             document.body.appendChild(a);
                             a.click();
                             window.URL.revokeObjectURL(url);
                             toast.success("Descarga completada correctamente.");
                           } catch (error) {
                             toast.error("Error al recuperar el registro.");
                           }
                        }}
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {initialContracts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground border-border border-2 border-dashed m-10 rounded-[2rem] bg-muted/5">
                        <div className="bg-muted/20 p-6 rounded-full inline-block mb-4">
                            <History className="w-12 h-12 text-muted-foreground/20" />
                        </div>
                        <p className="font-black uppercase text-sm tracking-[0.2em] opacity-40 italic italic">No hay registros documentales en esta empresa.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* ===== ASISTENTE IA PREMIUM ===== */}
      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-500/10">
        <CardHeader className="bg-muted/5 border-b border-border p-10">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-600/20">
                <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Asistente IA: Generador de Perfiles</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                    OPTIMIZACIÓN INTELIGENTE DE DESCRIPTORES Y RESPONSABILIDADES LABORALES
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOMBRE DEL CARGO A REDACTAR</Label>
                <Input 
                    placeholder="Ej: Analista de Finanzas Senior" 
                    className="h-14 bg-white border-border rounded-2xl font-black uppercase text-xs focus:ring-blue-500 shadow-sm px-6" 
                    value={jobTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobTitle(e.target.value)}
                />
            </div>
            <div className="flex items-end">
                <Button 
                    onClick={handleGenerateAiDescription} 
                    disabled={isAiLoading} 
                    variant="secondary" 
                    className="h-14 bg-blue-600 text-white font-black uppercase text-xs tracking-[0.15em] rounded-2xl px-10 shadow-xl shadow-blue-600/20 hover:scale-[1.03] transition-all group"
                >
                {isAiLoading ? <RefreshIcon className="h-5 w-5 animate-spin mr-3" /> : <Bot className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform" />}
                SUGERIR DESCRIPCIÓN
                </Button>
            </div>
          </div>
          {aiDescription && (
            <div className="p-8 bg-blue-50/50 border-2 border-blue-100 rounded-[2rem] text-sm text-slate-700 animate-in fade-in zoom-in duration-500 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-20 h-20 text-blue-600 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-8 bg-blue-600 rounded-full" />
                        <p className="font-black uppercase text-xs tracking-widest text-blue-900 leading-none">Análisis Predictivo para {jobTitle}</p>
                    </div>
                    <div className="text-slate-700 leading-relaxed font-medium italic bg-white/60 p-6 rounded-2xl border border-blue-50 shadow-sm whitespace-pre-wrap">
                        {aiDescription}
                    </div>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
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
