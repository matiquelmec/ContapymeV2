'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  FileText, 
  Download, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Loader2, 
  X, 
  History, 
  ShieldAlert,
  Gavel,
  FileWarning
} from 'lucide-react'
import { deleteTerminationAction, getTerminationDocumentAction, finalizeTerminationAction } from '@/actions/terminations'
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
  organizationId
}: { 
  terminations: any[], 
  employees: any[],
  organizationId: string
}) {
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerLoading, setViewerLoading] = useState(false)
  const [documentContent, setDocumentContent] = useState<{title: string, content: string} | null>(null)

  const handleFinalize = async (id: string, employeeId: string, endDate: string, name: string) => {
    toast(`¿Confirmar finalización oficial para ${name}?`, {
        description: 'Esto marcará al empleado como INACTIVO y cerrará el periodo legal.',
        action: {
            label: 'FINALIZAR',
            onClick: async () => {
                const res = await finalizeTerminationAction(id, employeeId, endDate)
                if (res.success) {
                  toast.success(`Desvinculación de ${name} procesada correctamente.`, {
                    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  })
                } else {
                  toast.error(res.error || 'Error al finalizar')
                }
            }
        },
        cancel: {
            label: 'CANCELAR',
            onClick: () => {}
        }
    })
  }

  const handleDelete = async (id: string, name: string) => {
    toast(`¿Seguro de eliminar el borrador para ${name}?`, {
        action: {
            label: 'ELIMINAR',
            onClick: async () => {
                setLoadingDelete(id)
                const res = await deleteTerminationAction(id)
                if (res.success) {
                  toast.success('Registro de finiquito removido.')
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

  const borradosPendientes = terminations.filter(t => t.status === 'borrador').length;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 outline-none">
      
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
        <DialogContent className="max-w-4xl bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5 flex flex-col max-h-[90vh]">
          <div className="h-2 w-full bg-gradient-to-r from-rose-600 via-rose-300 to-transparent" />
          <DialogHeader className="p-10 pb-6 border-b border-border bg-muted/5">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                    <Printer className="h-6 w-6 text-rose-600" />
                </div>
                <div className="space-y-0.5 text-left">
                    <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">
                        {viewerLoading ? "PROCESANDO INSTRUMENTO..." : documentContent?.title}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                        PREVISUALIZACIÓN DE DOCUMENTO LEGAL NORMATIVO
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-12 bg-white text-slate-900 font-sans leading-relaxed text-sm antialiased scrollbar-thin scrollbar-thumb-slate-200">
            {viewerLoading ? (
              <div className="flex flex-col items-center justify-center h-96 gap-6 text-muted-foreground">
                <Loader2 className="h-16 w-16 animate-spin text-rose-600 opacity-20" />
                <p className="font-black uppercase text-xs tracking-widest text-center max-w-xs leading-relaxed italic opacity-40">
                    SINTETIZANDO CLÁUSULAS LEGALES DESDE EL MOTOR DE RRHH...
                </p>
              </div>
            ) : (
                <div className="whitespace-pre-wrap font-serif text-base text-justify selection:bg-rose-100">
                    {documentContent?.content}
                </div>
            )}
          </div>

          <DialogFooter className="p-10 pt-6 border-t border-border bg-muted/5 flex gap-4">
            <Button variant="ghost" onClick={() => setViewerOpen(false)} className="text-[10px] font-black uppercase tracking-widest flex-1 h-14 rounded-2xl">
              CERRAR VISOR
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest h-14 px-12 rounded-[1.5rem] shadow-2xl shadow-emerald-600/30 hover:scale-[1.03] active:scale-95 transition-all flex-1 gap-3" onClick={() => window.print()}>
              <Printer className="h-5 w-5" /> IMPRIMIR EXPEDIENTE
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
                          {t.status === 'borrador' && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                onClick={() => handleFinalize(t.id, t.employee_id, t.fecha_termino, `${t.employees?.nombres} ${t.employees?.apellido_paterno}`)}
                                title="Finalizar Desvinculación"
                            >
                                <CheckCircle2 className="h-5 w-5" />
                            </Button>
                          )}
                          <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              onClick={() => handleViewDocument(t.id, 'carta')}
                              title="Ver Carta Aviso"
                          >
                              <FileText className="h-5 w-5" />
                          </Button>
                          <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                              onClick={() => handleViewDocument(t.id, 'finiquito')}
                              title="Ver Borrador Finiquito"
                          >
                              <Printer className="h-5 w-5" />
                          </Button>
                          <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-rose-600 hover:bg-rose-50 rounded-xl transition-all" 
                              onClick={() => handleDelete(t.id, `${t.employees?.nombres} ${t.employees?.apellido_paterno}`)}
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
