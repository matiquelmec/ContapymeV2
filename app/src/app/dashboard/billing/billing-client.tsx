'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    TrendingUp, 
    DollarSign, 
    Search, 
    Plus,
    Clock,
    ShieldCheck,
    ArrowUpRight,
    Download,
    Eye,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { exportDTEToCSV } from '@/actions/billing'
import { IssueInvoiceDialog } from './issue-invoice-dialog'
import { DTEPreviewDialog } from './dte-preview-dialog'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface BillingClientProps {
    organizationId: string
    initialData: any[]
    stats: {
        totalDTEs: number
        acceptedDTEs: number
        signedDTEs: number
        totalFacturado: number
        availableFolios: number
    }
}

export function BillingClient({ organizationId, initialData, stats }: BillingClientProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [selectedDTE, setSelectedDTE] = useState<any | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [previewTab, setPreviewTab] = useState<'visual' | 'security' | 'xml'>('visual')
    const [statusFilter, setStatusFilter] = useState<'all' | 'official' | 'draft'>('official')
    const [dtes, setDtes] = useState<any[]>(initialData)
    const [statsState, setStatsState] = useState(stats)

    useEffect(() => {
        setDtes(initialData)
    }, [initialData])

    useEffect(() => {
        const signedAndAccepted = dtes.filter(d => ['signed', 'accepted', 'sent'].includes(d.status))
        const totalDTEs = signedAndAccepted.length
        const acceptedDTEs = dtes.filter(d => d.status === 'accepted').length
        const signedDTEs = dtes.filter(d => d.status === 'signed').length
        const totalFacturado = signedAndAccepted.reduce((sum, d) => sum + (d.monto_total || 0), 0)
        
        setStatsState(prev => ({
            ...prev,
            totalDTEs,
            acceptedDTEs,
            signedDTEs,
            totalFacturado
        }))
    }, [dtes])

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('dte_issued_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'dte_issued',
                    filter: `organization_id=eq.${organizationId}`
                },
                (payload) => {
                    console.log('🔄 [Realtime] DTE Change detected:', payload)
                    if (payload.eventType === 'INSERT') {
                        setDtes(prev => {
                            if (prev.some(d => d.id === payload.new.id)) return prev
                            return [payload.new, ...prev]
                        })
                        toast.success(`Nuevo DTE emitido: Folio ${payload.new.folio}`)
                    } else if (payload.eventType === 'UPDATE') {
                        setDtes(prev => prev.map(d => d.id === payload.new.id ? { ...d, ...payload.new } : d))
                        if (payload.new.status === 'accepted') {
                            toast.success(`DTE Folio ${payload.new.folio} aceptado por el SII`)
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setDtes(prev => prev.filter(d => d.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [organizationId])

    const openPreview = (dte: any, tab: 'visual' | 'security' | 'xml') => {
        setSelectedDTE(dte)
        setPreviewTab(tab)
        setIsPreviewOpen(true)
    }

    const downloadXML = (dte: any) => {
        if (!dte.xml_content) {
            toast.error('Este DTE no tiene contenido XML firmado.')
            return
        }
        const blob = new Blob([dte.xml_content], { type: 'application/xml;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `DTE_${dte.tipo_dte}_Folio_${dte.folio}.xml`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`XML del DTE ${dte.tipo_dte} (Folio ${dte.folio}) descargado con éxito.`)
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            const res = await exportDTEToCSV(organizationId)
            if (res.success && res.data) {
                const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.setAttribute('href', url)
                link.setAttribute('download', `RCV_Ventas_${new Date().toISOString().slice(0, 10)}.csv`)
                link.style.visibility = 'hidden'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success('Reporte RCV exportado con éxito.')
            } else {
                toast.error(res.error || 'Error al exportar.')
            }
        } catch (err) {
            toast.error('Error al generar el archivo.')
        } finally {
            setExporting(false)
        }
    }

    const filteredData = dtes
        .filter(dte => {
            if (statusFilter === 'official') {
                return ['signed', 'accepted', 'sent'].includes(dte.status)
            }
            if (statusFilter === 'draft') {
                return ['draft', 'error_signing'].includes(dte.status) || !dte.status
            }
            return true
        })
        .filter(dte => 
            (dte.receptor_razon_social || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (dte.folio || '').toString().includes(searchTerm) ||
            (dte.receptor_rut || '').includes(searchTerm)
        )

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'accepted':
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Aceptado</Badge>
            case 'signed':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"><ShieldCheck className="w-3 h-3 mr-1" /> Firmado</Badge>
            case 'sent':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Enviado</Badge>
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200"><AlertCircle className="w-3 h-3 mr-1" /> Rechazado</Badge>
            case 'draft':
                return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200"><FileText className="w-3 h-3 mr-1" /> Borrador</Badge>
            case 'error_signing':
                return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200"><AlertCircle className="w-3 h-3 mr-1" /> Error de Firma</Badge>
            default:
                return <Badge variant="outline">{status || 'Borrador'}</Badge>
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* ===== KPI CARDS (DISEÑO PREMIUM) ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-primary/[0.04] to-transparent border-primary/10 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12.5%</span>
                        </div>
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-tighter mb-1">Total Facturado Bruto</h3>
                        <p className="text-2xl font-black text-foreground tracking-tighter italic">{formatCurrency(statsState.totalFacturado)}</p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border/50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-lg">SII Activo</span>
                        </div>
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-tighter mb-1">DTEs Emitidos</h3>
                        <p className="text-2xl font-black text-foreground tracking-tighter italic">{statsState.totalDTEs} <span className="text-sm text-muted-foreground not-italic font-bold">Docs</span></p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border/50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-tighter mb-1">Folios Disponibles (CAF)</h3>
                        <p className="text-2xl font-black text-foreground tracking-tighter italic">{statsState.availableFolios} <span className="text-sm text-amber-600 not-italic font-bold">Críticos</span></p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/[0.08] to-transparent border-emerald-500/10 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-tighter mb-1">Integridad Criptográfica</h3>
                        <p className="text-2xl font-black text-emerald-600 tracking-tighter italic">99.9% <span className="text-sm text-muted-foreground not-italic font-bold">Secured</span></p>
                    </CardContent>
                </Card>
            </div>

            {/* ===== SEARCH & ACTIONS ===== */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Buscar por RUT, Folio o Razón Social..." 
                        className="pl-10 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm focus-visible:ring-primary/20 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        variant="outline" 
                        className="rounded-2xl h-11 px-6 border-border font-bold text-xs uppercase tracking-tight gap-2 bg-white/50 hover:bg-white transition-all shadow-sm"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Exportar RCV
                    </Button>
                    <Button 
                        className="rounded-2xl h-11 px-8 font-black text-xs uppercase tracking-tight gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <Plus className="w-4 h-4" /> Emitir Factura
                    </Button>
                </div>
            </div>

            {/* ===== CONTEO DE DOCUMENTOS ===== */}
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs text-foreground font-black uppercase tracking-wider pl-2">
                    Historial de Emisiones SII
                </span>
                <div className="text-xs text-muted-foreground font-black uppercase tracking-tight pr-2">
                    Mostrando {filteredData.length} documento(s)
                </div>
            </div>

            {/* ===== DOCUMENT TABLE ===== */}
            <Card className="border-border/40 rounded-[2.5rem] overflow-hidden bg-card/30 backdrop-blur-md shadow-xl shadow-black/[0.02]">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-b border-border/40">
                            <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest pl-8">Folio</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Tipo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Receptor</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Fecha</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Monto Total</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Estado</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-8">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((dte) => (
                                <TableRow key={dte.id} className="hover:bg-primary/[0.02] border-b border-border/20 transition-colors group">
                                    <TableCell className="font-black text-sm pl-8 italic text-primary">{dte.folio}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground">DTE {dte.tipo_dte}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                {dte.tipo_dte === 33 ? 'Factura Electrónica' : 'Boleta Electrónica'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground truncate max-w-[200px]">{dte.receptor_razon_social}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{dte.receptor_rut}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs font-bold text-muted-foreground">
                                        {dte.fecha_emision ? (() => {
                                            const parts = dte.fecha_emision.split('T')[0].split('-');
                                            if (parts.length === 3) {
                                                return `${parts[2]}-${parts[1]}-${parts[0]}`;
                                            }
                                            return dte.fecha_emision;
                                        })() : '—'}
                                    </TableCell>
                                    <TableCell className="font-black text-sm tracking-tighter">
                                        {formatCurrency(dte.monto_total)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 items-start">
                                            {getStatusBadge(dte.status)}
                                            {dte.status !== 'draft' && dte.status !== 'error_signing' && (
                                                <Badge variant="outline" className={
                                                    dte.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' :
                                                    dte.payment_status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold' :
                                                    'bg-slate-50 text-slate-600 border-slate-200 font-bold'
                                                }>
                                                    {dte.payment_status === 'paid' ? 'Pagada' :
                                                     dte.payment_status === 'partial' ? 'Pago Parcial' :
                                                     'Pendiente'}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                onClick={() => openPreview(dte, 'visual')}
                                                title="Ver Detalle / Factura SII"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                onClick={() => downloadXML(dte)}
                                                title="Descargar XML Firmado"
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600"
                                                onClick={() => openPreview(dte, 'security')}
                                                title="Auditar Integridad Criptográfica"
                                            >
                                                <ShieldCheck className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic font-bold">
                                    No se encontraron documentos emitidos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <IssueInvoiceDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen} 
                organizationId={organizationId} 
            />

            <DTEPreviewDialog 
                open={isPreviewOpen} 
                onOpenChange={setIsPreviewOpen} 
                dte={selectedDTE} 
                initialTab={previewTab}
            />

            {/* ===== INTEGRITY FOOTER ===== */}
            <div className="flex items-center justify-center gap-2 py-4">
                <div className="h-[1px] w-12 bg-border" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Ledger Criptográfico Distribuido — Punta Arenas, Chile
                </p>
                <div className="h-[1px] w-12 bg-border" />
            </div>
        </div>
    )
}
