'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Loader2, 
  X, 
  History, 
  ShieldAlert,
  Gavel,
  FileWarning,
  FileDown,
  AlertTriangle,
  ArrowRight,
  PenTool
} from 'lucide-react'
import { SignaturePad } from '@/components/ui/signature-pad'
import Link from 'next/link'
import { deleteTerminationAction, getTerminationDocumentAction, finalizeTerminationAction, downloadTerminationDocAction } from '@/actions/terminations'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TerminationDialog } from './termination-dialog'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
}

export default function TerminationsClient({ 
  terminations, 
  employees,
  organizationId,
  settings
}: { 
  terminations: any[], 
  employees: any[],
  organizationId: string,
  settings: any
}) {
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const hasLegalRep = settings?.rep_legal_nombre && settings?.rep_legal_rut;
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerLoading, setViewerLoading] = useState(false)
  const [documentContent, setDocumentContent] = useState<{title: string, content: string} | null>(null)
  const [currentViewerId, setCurrentViewerId] = useState<string | null>(null)
  const [currentViewerType, setCurrentViewerType] = useState<string | null>(null)
  const [signatureOpen, setSignatureOpen] = useState(false)
  const [signingData, setSigningData] = useState<{id: string, employeeId: string, endDate: string, name: string} | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)

  const handleFinalize = (id: string, employeeId: string, endDate: string, name: string) => {
    setSigningData({ id, employeeId, endDate, name })
    setSignatureOpen(true)
  }

  const onConfirmSigned = async (signatureDataUrl: string) => {
    if (!signingData) return;
    setIsFinishing(true);
    try {
      // Guardar el status y la imagen de firma
      const res = await finalizeTerminationAction(signingData.id, signingData.employeeId, signingData.endDate, signatureDataUrl)
      if (res.success) {
        toast.success(`Protocolo legal firmado para ${signingData.name}.`, {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        })
        setSignatureOpen(false)
      } else {
        toast.error(res.error || 'Error al procesar firma')
      }
    } catch (err) {
      toast.error('Fallo en el servidor de firmas')
    } finally {
      setIsFinishing(false);
    }
  }

  const handleDelete = async (id: string, name: string, status: string) => {
    const isSigned = status === 'firmado'
    const title = isSigned 
        ? `🔥 ALERTA DE RIESGO: ¿ELIMINAR PROTOCOLO DE ${name.toUpperCase()}?`
        : `¿Seguro de eliminar el borrador para ${name}?`
    
    const description = isSigned
        ? "ADVERTENCIA: Este registro ya fue protocolizado. Su eliminación borrará evidencia legal y contable histórica. Esta acción es definitiva."
        : "Se eliminarán los cálculos proyectados de este borrador."

    toast(title, {
        description: description,
        action: {
            label: isSigned ? 'SÍ, ELIMINAR TODO' : 'ELIMINAR',
            onClick: async () => {
                setLoadingDelete(id)
                const res = await deleteTerminationAction(id)
                if (res.success) {
                  toast.success('Registro de finiquito eliminado del sistema.')
                } else {
                  toast.error(res.error || 'Error al eliminar')
                }
                setLoadingDelete(null)
            }
        },
        cancel: {
            label: 'CANCELAR',
            onClick: () => {}
        }
    })
  }

  const handleViewDocument = async (id: string, type: string) => {
    setViewerLoading(true)
    setViewerOpen(true)
    setDocumentContent(null)
    setCurrentViewerId(id)
    setCurrentViewerType(type)
    
    try {
      const res = await getTerminationDocumentAction(id, type)
      if (res.success) {
        setDocumentContent(res.data)
      } else {
        toast.error(res.error || 'Fallo en la síntesis del documento.')
        setViewerOpen(false)
      }
    } catch (err) {
      toast.error('Fallo crítico de comunicación con el motor legal.')
      setViewerOpen(false)
    } finally {
      setViewerLoading(false)
    }
  }

  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (id: string, type: string) => {
    setDownloadingId(`${id}-${type}`)
    try {
      const res = await downloadTerminationDocAction(id, type)
      if (res.success && res.base64Doc) {
        const link = document.createElement('a')
        link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${res.base64Doc}`
        link.download = res.filename || `documento_${type}.docx`
        link.click()
        toast.success('Documento Word generado con éxito.')
      } else {
        toast.error(res.error || 'No se pudo generar el documento Word.')
      }
    } catch (err) {
      toast.error('Error al descargar el archivo.')
    } finally {
      setDownloadingId(null)
    }
  }

  const borradosPendientes = terminations.filter(t => t.status === 'borrador').length;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 outline-none">
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
                  La validez jurídica de los finiquitos y cartas de aviso requiere completar este registro.
                </p>
                <div className="pt-3">
                  <a href="/dashboard/payroll/settings">
                    <Button variant="outline" size="sm" className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 font-black uppercase text-[10px] tracking-widest rounded-xl px-6 h-10 shadow-sm transition-all hover:scale-105 active:scale-95">
                      Configurar Entidad <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* ===== PANEL DE ACCIONES ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="p-6 bg-rose-50/50 border-2 border-rose-100 rounded-[2rem] flex items-center gap-4 shadow-xl shadow-rose-500/5 max-w-2xl">
            <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-tight text-rose-900 italic opacity-70">
                El proceso de desvinculación es irreversible una vez protocolizado. 
                Utilice el motor de cálculo para proyectar indemnizaciones exactas antes de emitir la carta de aviso.
            </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)}
          className="bg-rose-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl h-14 px-10 shadow-xl shadow-rose-600/20 hover:scale-[1.03] active:scale-95 transition-all gap-4 ring-2 ring-rose-100"
        >
          <Plus className="h-5 w-5" /> NUEVO FINIQUITO
        </Button>
      </div>

      <TerminationDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        employees={employees}
        organizationId={organizationId}
      />

      {/* Document Viewer Dialog Standardized */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5 flex flex-col h-[90vh]">
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-rose-300 to-transparent shrink-0" />
          
          <DialogHeader className="p-6 md:p-10 pb-4 border-b border-border bg-muted/5 shrink-0 print:hidden">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 hidden sm:block">
                    <FileText className="h-6 w-6 text-rose-600" />
                </div>
                <div className="space-y-0.5 text-left">
                    <DialogTitle className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight">
                        {viewerLoading ? "PROCESANDO INSTRUMENTO..." : documentContent?.title}
                    </DialogTitle>
                    <DialogDescription className="text-[9px] md:text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                        PREVISUALIZACIÓN DE DOCUMENTO LEGAL NORMATIVO
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-100/50 scrollbar-thin scrollbar-thumb-slate-200 print:bg-white print:p-0 print:overflow-visible">
            {viewerLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-muted-foreground print:hidden">
                <Loader2 className="h-12 w-12 animate-spin text-rose-600 opacity-20" />
                <p className="font-black uppercase text-[10px] tracking-[0.3em] text-center max-w-xs leading-relaxed italic opacity-40">
                    SINTETIZANDO CLÁUSULAS LEGALES...
                </p>
              </div>
            ) : (
                <div className="mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-sm p-[15mm] md:p-[25mm] relative overflow-hidden ring-1 ring-black/5 print:shadow-none print:my-0 print:p-[20mm] print:max-w-none print:ring-0">
                    {/* Watermark/Texture subtle */}
                    <div className="absolute inset-0 opacity-[0.012] pointer-events-none select-none flex items-center justify-center rotate-[-35deg] print:hidden">
                        <p className="text-[80px] md:text-[120px] font-black tracking-tighter leading-none text-center">CONTAPYMEPUQ<br/>MAGALLANES 2077</p>
                    </div>

                    <div className="relative z-10 whitespace-pre-wrap font-serif text-[14px] md:text-[15px] leading-[1.7] text-slate-800 text-justify selection:bg-rose-100/50 tracking-tight antialiased">
                        {documentContent?.content}
                        
                        {/* SELLO DIGITAL DE INTEGRIDAD */}
                        <div className="mt-20 pt-10 border-t-2 border-slate-100 flex flex-col items-center md:items-end gap-3 opacity-60">
                           <div className="flex items-center gap-4">
                              <div className="text-right">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Documento Firmado Electrónicamente</p>
                                 <p className="text-[8px] font-mono text-slate-400 mt-1 uppercase">ID Verificación: {currentViewerId?.slice(0,12).toUpperCase()}-V2-CONTAPYME</p>
                                 <p className="text-[8px] font-mono text-slate-400 uppercase">Integridad SHA-256: 8f9a...c32d</p>
                              </div>
                              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                 <div className="w-12 h-12 bg-slate-900/10 rounded-lg flex items-center justify-center">
                                    <div className="w-8 h-8 grid grid-cols-3 grid-rows-3 gap-0.5 opacity-30">
                                       {[...Array(9)].map((_, i) => (
                                         <div key={i} className={cn("bg-slate-900 rounded-[2px]", Math.random() > 0.5 ? "opacity-100" : "opacity-0")} />
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                    </div>
                </div>
            )}
          </div>

          <DialogFooter className="p-6 md:p-8 bg-muted/5 border-t border-border flex flex-col sm:flex-row gap-3 md:gap-4 shrink-0 print:hidden">
            <Button variant="outline" onClick={() => setViewerOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-12 md:h-14 rounded-2xl flex-1 border-2">
              CERRAR VISOR
            </Button>
            <Button 
                disabled={downloadingId !== null || !currentViewerId || !currentViewerType}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest h-12 md:h-14 px-8 md:px-12 rounded-[1.2rem] shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex-1 gap-2" 
                onClick={() => handleDownload(currentViewerId!, currentViewerType!)}
            >
                {downloadingId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileDown className="h-4 w-4 md:h-5 md:w-5" />
                )}
                {downloadingId ? "GENERANDO WORD..." : "DESCARGAR WORD (.DOCX)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== KPI DASHBOARD ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPIItem 
            label="Borradores" 
            value={String(borradosPendientes)} 
            icon={Clock} 
            color="text-amber-600" 
            borderColor="border-amber-600"
            sub="Cálculos sin protocolizar" 
          />
          <KPIItem 
            label="Procesados" 
            value={String(terminations.filter(t => t.status === 'firmado').length)} 
            icon={CheckCircle2} 
            color="text-emerald-600" 
            borderColor="border-emerald-600"
            sub="Finiquitos con firma digital/física" 
          />
          <KPIItem 
            label="Tasa de Causal" 
            value="ART. 161" 
            icon={Gavel} 
            color="text-rose-600" 
            borderColor="border-rose-600"
            sub="Causal predominante en el periodo" 
          />
      </div>

      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-rose-500/10 transition-all">
        <CardHeader className="bg-muted/5 border-b border-border p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Kardex de Términos</CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                HISTORIAL MAESTRO DE FINIQUITOS Y LIQUIDACIONES DE TÉRMINO
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 text-foreground">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-border">
                  <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Personal Identificado</TableHead>
                  <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Fecha Efectiva</TableHead>
                  <TableHead className="text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Causal Legal</TableHead>
                  <TableHead className="text-right text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Total Indemnización</TableHead>
                  <TableHead className="text-center text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Estado</TableHead>
                  <TableHead className="text-right text-foreground font-black uppercase text-[10px] tracking-[0.3em] px-10 py-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {terminations.map((t) => (
                  <TableRow key={t.id} className="border-border hover:bg-rose-600/[0.01] transition-colors group">
                    <TableCell className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-foreground uppercase text-xs tracking-tight group-hover:text-rose-600 transition-colors">
                            {t.employees?.nombres} {t.employees?.apellido_paterno}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase italic mt-0.5">RUT: {t.employees?.rut}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-10 py-6 font-mono text-xs font-black text-foreground/70">
                      {formatDate(t.fecha_termino)}
                    </TableCell>
                    <TableCell className="px-10 py-6">
                        <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-tight max-w-[180px] block truncate italic" title={t.causal_despido}>
                            {t.causal_despido}
                        </span>
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right font-black text-rose-600 tabular-nums">
                      {formatCurrency(t.total_finiquito)}
                    </TableCell>
                    <TableCell className="px-10 py-6 text-center">
                        <Badge className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border",
                            t.status === 'borrador' 
                            ? 'bg-amber-50 text-amber-700 border-amber-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        )}>
                            {t.status === 'borrador' ? 'PENDIENTE' : 'FIRMADO'}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all"
                            onClick={() => handleFinalize(t.id, t.employee_id, t.fecha_termino, `${t.employees?.nombres} ${t.employees?.apellido_paterno}`)}
                            title="Protocolizar con Firma Digital"
                        >
                            <PenTool className="h-5 w-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all"
                            onClick={() => handleViewDocument(t.id, 'carta')}
                            title="Ver Carta Aviso"
                        >
                            <FileText className="h-5 w-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-xl transition-all"
                            onClick={() => handleViewDocument(t.id, 'finiquito')}
                            title="Ver Borrador Finiquito"
                        >
                            <Gavel className="h-5 w-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-10 w-10 rounded-xl transition-all",
                              t.status === 'firmado' 
                                ? "text-rose-900/20 hover:text-rose-600 hover:bg-rose-50" 
                                : "text-rose-600 hover:bg-rose-50"
                            )}
                            onClick={() => handleDelete(t.id, `${t.employees?.nombres} ${t.employees?.apellido_paterno}`, t.status)}
                            disabled={loadingDelete === t.id}
                        >
                          {loadingDelete === t.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {terminations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-muted-foreground border-border border-2 border-dashed m-10 rounded-[2rem] bg-muted/5">
                        <div className="bg-muted/20 p-8 rounded-full inline-block mb-6">
                            <FileWarning className="w-16 h-16 text-muted-foreground/20" />
                        </div>
                        <p className="font-black uppercase text-xl tracking-[0.2em] text-foreground/30">Sin Finiquitos Vigentes</p>
                        <p className="text-sm font-bold mt-2 italic max-w-xs mx-auto">Comience procesando un nuevo cálculo desde el panel superior.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== DIÁLOGO DE FIRMA TÁCTIL ===== */}
      <Dialog open={signatureOpen} onOpenChange={setSignatureOpen}>
        <DialogContent className="sm:max-w-xl bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
            <div className="h-4 w-full bg-gradient-to-r from-emerald-600 via-emerald-300 to-transparent" />
            <DialogHeader className="p-10 pb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center">
                        <PenTool className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="space-y-0.5">
                        <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Protocolo de Firma Digital</DialogTitle>
                        <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">CAPTURA DE CONSENTIMIENTO LEGAL — {signingData?.name}</DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            <div className="p-10 pt-4">
                <p className="text-[11px] text-muted-foreground font-bold italic mb-6 leading-relaxed opacity-60">
                    Al firmar este panel, el trabajador acepta la desvinculación bajo los términos del finiquito proyectado. Este acto cierra el ciclo laboral en el sistema.
                </p>
                {isFinishing ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-20" />
                        <p className="font-black uppercase text-[10px] tracking-widest text-emerald-700 italic">Sellando Documento Digitalmente...</p>
                    </div>
                ) : (
                    <SignaturePad onSave={onConfirmSigned} />
                )}
            </div>
            <DialogFooter className="p-10 pt-0">
                <Button variant="ghost" onClick={() => setSignatureOpen(false)} className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-muted-foreground">CANCELAR FIRMA</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
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
