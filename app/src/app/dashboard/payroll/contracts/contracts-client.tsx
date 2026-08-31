"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { 
    History, 
    Zap, 
    Download, 
    AlertTriangle, 
    FileText, 
    Settings2, 
    ShieldCheck, 
    FileCheck2, 
    Waves,
    ArrowRight,
    ExternalLink,
    Loader2,
    PenTool,
    CheckCircle2,
    Plus,
    UserPlus,
    FileSignature,
    Users
} from 'lucide-react';
import { toast } from "sonner";
import Link from "next/link";
import { generateContractAction } from "@/actions/documents";
import { ModificationsDialog } from "@/components/modifications-dialog";
import { SignaturePad } from "@/components/ui/signature-pad";
import { CreateEmployeeButton } from "../create-employee-button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Employee {
  id: string;
  nombres: string;
  apellido_paterno: string;
  rut: string;
  cargo: string;
  sueldo_base?: number;
  activo?: boolean;
}

export default function ContractsClient({ 
  organizationId, 
  initialContracts,
  employees = [],
  settings 
}: { 
  organizationId: string, 
  initialContracts: any[],
  employees: Employee[],
  settings: any
}) {
  const router = useRouter();
  const hasLegalRep = settings?.rep_legal_nombre && settings?.rep_legal_rut;
  
  // Modificaciones state
  const [modTarget, setModTarget] = useState<{id: string, name: string, data: any} | null>(null);
  const [modOpen, setModOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signingDoc, setSigningDoc] = useState<{id: string, employeeId: string, name: string, type?: string} | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Estado para emisión rápida de contrato de empleado existente
  const [emitDialogOpen, setEmitDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const processedContracts = useMemo(() => {
    // 1. Ordenar por creación (más reciente primero)
    const sorted = [...initialContracts].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const result: any[] = [];
    const contractFoundFor = new Set();
    
    for (const doc of sorted) {
      if (doc.tipo_documento === 'contrato') {
        // Solo un registro MAESTRO de contrato por empleado
        if (!contractFoundFor.has(doc.employee_id)) {
          result.push(doc);
          contractFoundFor.add(doc.employee_id);
        }
      } else {
        // Los Anexos son eventos legales independientes, se muestran todos
        result.push(doc);
      }
    }
    return result;
  }, [initialContracts]);

  const activeContractsCount = useMemo(() => {
    const uniqueActiveEmployees = new Set(
      processedContracts
        .filter(c => c.tipo_documento === 'contrato' && c.employees?.activo === true)
        .map(c => c.employee_id)
    );
    return uniqueActiveEmployees.size;
  }, [processedContracts]);

  const lastGenerationDate = useMemo(() => {
    if (!isClient || initialContracts.length === 0) return 'N/A';
    const sorted = [...initialContracts].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return new Date(sorted[0].created_at).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
  }, [initialContracts, isClient]);

  const handleSignDocument = (contractId: string, employeeId: string, name: string, type: string) => {
    setSigningDoc({ id: contractId, employeeId, name, type });
    setSignatureOpen(true);
  };

  const handleDownload = async (employeeId: string, contractId: string, name: string, type: string, signature?: string) => {
    const toastId = toast.loading(signature ? "Protocolizando y sellando documento..." : "Sintetizando documento legal...");
    if (!signature) setLoadingId(contractId);
    
    try {
      const result = await generateContractAction(employeeId, signature, type);
      if (!result.success || !result.base64Doc) {
        throw new Error(result.error || "Falla en la generación del documento");
      }

      const blob = await (await fetch(`data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${result.base64Doc}`)).blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || `${name}_${type}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(signature ? "Documento firmado y descargado." : "Documento recuperado con éxito.", { id: toastId });
      return true;
    } catch (error: any) {
      console.error("Error en documento:", error);
      toast.error(`Error: ${error.message}`, { id: toastId });
      return false;
    } finally {
      setLoadingId(null);
    }
  };

  const handleQuickEmit = async () => {
    if (!selectedEmployeeId) {
      toast.error("Por favor selecciona un colaborador para emitir su contrato.");
      return;
    }
    const emp = employees.find(e => e.id === selectedEmployeeId);
    const empName = emp ? `${emp.nombres} ${emp.apellido_paterno}` : "Colaborador";
    
    setEmitDialogOpen(false);
    await handleDownload(selectedEmployeeId, `quick_${selectedEmployeeId}`, empName, 'contrato');
    router.refresh();
  };

  const onConfirmSigned = async (signatureDataUrl: string) => {
    if (!signingDoc) return;
    setIsFinishing(true);
    
    const success = await handleDownload(signingDoc.employeeId, signingDoc.id, signingDoc.name, signingDoc.type || 'contrato', signatureDataUrl);
    
    if (success) {
      setIsFinishing(false);
      setSignatureOpen(false);
      router.refresh();
    } else {
      setIsFinishing(false);
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

      {/* ===== BARRA DE ACCIÓN Y GENERACIÓN DE CONTRATOS ===== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-zinc-900 border border-emerald-500/20 shadow-xl text-white">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 shrink-0">
            <FileSignature className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Emisión Normativa DT</span>
            <h3 className="text-base font-black uppercase tracking-tight text-white">Centro de Generación Documental</h3>
            <p className="text-xs text-zinc-300 font-medium">Registra una nueva contratación o emite el contrato en Word/PDF de cualquier colaborador.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Botón para emitir contrato de trabajador existente */}
          <Button 
            variant="outline"
            onClick={() => setEmitDialogOpen(true)}
            className="border-emerald-400/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl h-11 px-5 transition-all"
          >
            <FileText className="h-4 w-4 mr-2" />
            Emitir Contrato
          </Button>

          {/* Botón para ingresar nuevo trabajador y generar contrato */}
          <CreateEmployeeButton />
        </div>
      </div>

      {/* MODAL PARA EMISIÓN RÁPIDA DE CONTRATO */}
      <Dialog open={emitDialogOpen} onOpenChange={setEmitDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-emerald-600" />
              Emitir Contrato de Trabajo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecciona a un colaborador registrado para generar y descargar su contrato oficial (.docx) conforme al Código del Trabajo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider">Seleccionar Colaborador</Label>
              <Select value={selectedEmployeeId} onValueChange={(val) => setSelectedEmployeeId(val || "")}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Elige un colaborador..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombres} {emp.apellido_paterno} — {emp.cargo || "Sin cargo"} ({emp.rut})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setEmitDialogOpen(false)} className="rounded-xl text-xs font-bold uppercase">
              Cancelar
            </Button>
            <Button 
              onClick={handleQuickEmit} 
              disabled={!selectedEmployeeId}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider gap-2"
            >
              <Download className="h-4 w-4" />
              Generar y Descargar (.docx)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== CUADRO DE MANDO RÁPIDO ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIItem 
          label="Contratos Activos" 
          value={activeContractsCount.toString()} 
          icon={<FileCheck2 className="h-4 w-4" />} 
          color="text-emerald-600"
          borderColor="border-emerald-600"
          sub="Documentación vigente controlada"
        />
        <KPIItem 
          label="Última Generación" 
          value={lastGenerationDate} 
          icon={<Zap className="h-4 w-4" />} 
          color="text-purple-600"
          borderColor="border-purple-600"
          sub="Actividad documental reciente"
          suppressHydrationWarning={true}
        />
        <KPIItem 
          label="Tasa de Digitalización" 
          value="100%" 
          icon={<Waves className="h-4 w-4" />} 
          color="text-blue-600"
          borderColor="border-blue-600"
          sub="Certificación de flujo sin papel"
        />
      </div>

      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-600/30 transition-all">
        <CardHeader className="bg-muted/5 border-b border-border p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Kardex de Documentos</CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                HISTORIAL DE CONTRATOS Y ANEXOS LEGALES GENERADOS POR EL SISTEMA
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setEmitDialogOpen(true)}
              className="rounded-xl text-xs font-black uppercase tracking-wider border-border hover:bg-muted gap-2 h-10"
            >
              <Plus className="h-3.5 w-3.5" />
              Emitir Contrato
            </Button>
          </div>
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
                {processedContracts.map((contract) => (
                  <TableRow key={contract.id} className="border-border hover:bg-primary/[0.01] transition-colors group">
                    <TableCell className="px-10 py-6">
                        <div className="flex flex-col">
                            <span className={`font-black uppercase text-xs tracking-tight transition-colors ${contract.employees?.activo === false ? 'text-muted-foreground/40 line-through' : 'text-foreground group-hover:text-primary'}`}>
                                {contract.employees?.nombres} {contract.employees?.apellido_paterno}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground/60 font-bold uppercase italic">RUT: {contract.employees?.rut}</span>
                                {contract.employees?.activo === false && (
                                    <Badge variant="outline" className="text-[8px] h-4 bg-muted text-muted-foreground border-border font-black uppercase tracking-tighter">DESVINCULADO</Badge>
                                )}
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="px-10 py-6">
                        <div className="flex flex-col gap-1.5">
                          <Badge className={cn(
                              "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border w-fit",
                              contract.tipo_documento === 'contrato' 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-purple-50 text-purple-700 border-purple-100"
                          )}>
                              {contract.tipo_documento === 'contrato' ? '📜 CONTRATO BASE' : '📝 ANEXO LEGAL'}
                          </Badge>
                          {contract.status === 'pendiente' && (
                            <Badge variant="outline" className="w-fit text-[8px] h-4 bg-amber-50 text-amber-700 border-amber-200 font-black uppercase tracking-widest animate-pulse">
                              ACCIÓN REQUERIDA: GENERAR DOCX
                            </Badge>
                          )}
                        </div>
                    </TableCell>
                    <TableCell className="px-10 py-6">
                        <span className="font-mono text-xs font-black text-foreground/70 uppercase" suppressHydrationWarning={true}>
                            {new Date(contract.created_at).toLocaleDateString()}
                        </span>
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 w-11 h-11 rounded-xl transition-all"
                            onClick={() => {
                            setModTarget({
                                id: contract.employee_id,
                                name: `${contract.employees?.nombres} ${contract.employees?.apellido_paterno}`,
                                data: contract.employees
                            });
                            setModOpen(true);
                            }}
                            title="Gestionar Modificaciones"
                        >
                            <Settings2 className="h-5 w-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 w-11 h-11 rounded-xl transition-all"
                            onClick={() => handleSignDocument(contract.id, contract.employee_id, `${contract.employees?.nombres} ${contract.employees?.apellido_paterno}`, contract.tipo_documento)}
                            title="Protocolizar con Firma Digital"
                        >
                            <PenTool className="h-5 w-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 w-11 h-11 rounded-xl transition-all"
                            disabled={loadingId === contract.id}
                            onClick={() => handleDownload(contract.employee_id, contract.id, contract.employees?.apellido_paterno, contract.tipo_documento)}
                            title="Descargar Contrato (.docx)"
                        >
                            {loadingId === contract.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Download className="h-5 w-5" />
                            )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {initialContracts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-16 text-muted-foreground border-border border-2 border-dashed m-6 rounded-[2rem] bg-muted/5">
                        <div className="bg-emerald-500/10 p-5 rounded-full inline-block mb-3 text-emerald-600">
                            <FileSignature className="w-10 h-10" />
                        </div>
                        <h4 className="font-black uppercase text-sm tracking-wide text-foreground mb-1">No hay contratos generados aún</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">Ingresa a tu primer colaborador o emite el contrato para el personal existente.</p>
                        <div className="flex justify-center gap-3">
                          <CreateEmployeeButton />
                        </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE HISTORIAL Y MODIFICACIONES */}
      {modTarget && (
        <ModificationsDialog 
            isOpen={modOpen} 
            onClose={() => setModOpen(false)} 
            employeeId={modTarget.id} 
            employeeName={modTarget.name}
            organizationId={organizationId}
        />
      )}

      {/* MODAL DE PROTOCOLIZACIÓN DIGITAL */}
      <Dialog open={signatureOpen} onOpenChange={setSignatureOpen}>
        <DialogContent className="max-w-xl p-8 rounded-[2.5rem] bg-card border-border shadow-2xl">
            <DialogHeader className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <PenTool className="w-6 h-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black tracking-tight uppercase">
                            Protocolización y Firma Digital
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                            {signingDoc?.name} &bull; {signingDoc?.type?.toUpperCase()}
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="py-6 space-y-4">
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Dibuje la rúbrica del representante o trabajador en el recuadro inferior. 
                    El sistema integrará este sello criptográfico en el documento final.
                </p>
                <div className="border border-border/80 rounded-2xl overflow-hidden shadow-inner bg-white">
                    <SignaturePad onSave={onConfirmSigned} />
                </div>
            </div>

            <DialogFooter className="sm:justify-between items-center border-t border-border/50 pt-4">
                <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Válido según Ley 19.799
                </span>
                <Button 
                    variant="ghost" 
                    onClick={() => setSignatureOpen(false)}
                    disabled={isFinishing}
                    className="rounded-xl font-black uppercase text-xs tracking-wider"
                >
                    Cancelar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPIItem({ label, value, sub, icon, color, borderColor, suppressHydrationWarning }: any) {
    return (
        <Card className={cn("bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 group hover:scale-[1.02] transition-all", borderColor)}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2 leading-none">{label}</p>
              <p className={cn("text-3xl font-black tracking-tighter", color)} suppressHydrationWarning={suppressHydrationWarning}>{value}</p>
              {sub && <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">{sub}</p>}
            </div>
            <div className={`p-4 rounded-2xl bg-muted/30 border border-border group-hover:bg-white transition-colors`}>
              <div className={cn("w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity flex items-center justify-center", color)}>
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
}
