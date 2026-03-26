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
    CheckCircle2
} from 'lucide-react';
import { toast } from "sonner";
import Link from "next/link";
import { generateContractAction } from "@/actions/documents";
import { ModificationsDialog } from "@/components/modifications-dialog"
import { SignaturePad } from "@/components/ui/signature-pad"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"

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
  // Modificaciones state
  const [modTarget, setModTarget] = useState<{id: string, name: string, data: any} | null>(null);
  const [modOpen, setModOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signingDoc, setSigningDoc] = useState<{id: string, employeeId: string, name: string, type?: string} | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

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
    // Filtrar por empleados UNICOS, de tipo CONTRATO, y que estén ACTIVOS
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

      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10 transition-all">
        <CardHeader className="bg-muted/5 border-b border-border p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Kardex de Documentos</CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                HISTORIAL DE CONTRATOS Y ANEXOS LEGALES GENERADOS POR EL SISTEMA
            </CardDescription>
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
                                  ? "bg-blue-50 text-blue-700 border-blue-100" 
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

      {/* MODAL DE HISTORIAL Y MODIFICACIONES */}
      {modTarget && (
        <ModificationsDialog 
          employeeId={modTarget.id}
          employeeName={modTarget.name}
          organizationId={organizationId}
          currentData={modTarget.data}
          isOpen={modOpen}
          onClose={() => setModOpen(false)}
        />
      )}

      {/* ===== DIÁLOGO DE FIRMA TÁCTIL (REUTILIZABLE) ===== */}
      <Dialog open={signatureOpen} onOpenChange={setSignatureOpen}>
        <DialogContent className="sm:max-w-xl bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
            <div className="h-4 w-full bg-gradient-to-r from-emerald-600 via-emerald-300 to-transparent" />
            <DialogHeader className="p-10 pb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center">
                        <PenTool className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="space-y-0.5">
                        <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Sello Digital Corporativo</DialogTitle>
                        <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">CERTIFICACIÓN DE DOCUMENTO — {signingDoc?.name}</DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            <div className="p-10 pt-4">
                <p className="text-[11px] text-muted-foreground font-bold italic mb-6 leading-relaxed opacity-60">
                    Proceda a capturar la firma del colaborador. El sistema anexará un registro de integridad SHA-256 y un código QR de validación al documento final.
                </p>
                {isFinishing ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-20" />
                        <p className="font-black uppercase text-[10px] tracking-widest text-emerald-700 italic">Protocolizando Instrumento...</p>
                    </div>
                ) : (
                    <SignaturePad onSave={onConfirmSigned} />
                )}
            </div>
            <DialogFooter className="p-10 pt-0">
                <Button variant="ghost" onClick={() => setSignatureOpen(false)} className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-muted-foreground">CANCELAR SIGILO</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// HELPERS & SUBCOMPONENTS
// ==========================================
function KPIItem({ label, value, sub, icon, color, borderColor, suppressHydrationWarning }: any) {
    return (
        <Card className={`bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 ${borderColor} group hover:scale-[1.02] transition-all`}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2 leading-none">{label}</p>
              <p className={`text-3xl font-black tracking-tighter ${color}`} suppressHydrationWarning={suppressHydrationWarning}>
                {value}
              </p>
              {sub && <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">{sub}</p>}
            </div>
            <div className={`p-4 rounded-2xl bg-muted/30 border border-border group-hover:bg-primary/10 transition-colors ${color}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    )
}
