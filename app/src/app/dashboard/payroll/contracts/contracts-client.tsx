"use client";

import { useState, useMemo } from "react";
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
  FileText,
  Download,
  AlertTriangle,
  ArrowRight,
  Zap,
  ShieldCheck,
  History,
  Settings2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ModificationsDialog } from "@/components/modifications-dialog";

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
  
  // 🧠 Algoritmo de Consolidación Inteligente (Deduplicación de Clase Mundial)
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
            value={String(activeContractsCount)} 
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
                        <Badge className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border",
                            contract.tipo_documento === 'contrato' 
                                ? "bg-blue-50 text-blue-700 border-blue-100" 
                                : "bg-purple-50 text-purple-700 border-purple-100"
                        )}>
                            {contract.tipo_documento === 'contrato' ? '📜 CONTRATO BASE' : '📝 ANEXO LEGAL'}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-10 py-6">
                        <span className="font-mono text-xs font-black text-foreground/70 uppercase">
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
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 w-11 h-11 rounded-xl transition-all"
                            onClick={async () => {
                            const toastId = toast.loading("Sintetizando documento legal...");
                            try {
                                const response = await fetch(`/api/documents/generate?employee_id=${contract.employee_id}&type=${contract.tipo_documento}`);
                                if (!response.ok) throw new Error("Recurso no disponible");
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${contract.tipo_documento}_${contract.employees?.apellido_paterno}_REGEN.docx`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                toast.success("Documento recuperado con éxito.", { id: toastId });
                            } catch (error) {
                                toast.error("Error al recuperar el registro.", { id: toastId });
                            }
                            }}
                        >
                            <Download className="h-5 w-5" />
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
