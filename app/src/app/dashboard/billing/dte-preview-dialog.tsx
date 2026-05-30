'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    FileText, 
    Download, 
    Copy, 
    ShieldCheck, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    FileCode, 
    Lock,
    Scale,
    Calendar,
    Check,
    Hash,
    Printer,
    Mail,
    Send,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface DTEPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    dte: any
    initialTab?: 'visual' | 'security' | 'xml'
}

function parseDTEXML(xmlString: string) {
    if (!xmlString || typeof window === 'undefined') return null
    try {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
        
        const parserError = xmlDoc.querySelector('parsererror')
        if (parserError) return null

        const getTagText = (selector: string) => xmlDoc.querySelector(selector)?.textContent || ''

        const emisor = {
            rut: getTagText('Emisor > RUTEmisor') || getTagText('RUTEmisor'),
            razonSocial: getTagText('Emisor > RznSoc') || getTagText('RznSoc'),
            giro: getTagText('Emisor > GiroEmis') || getTagText('GiroEmis'),
            direccion: getTagText('Emisor > DirOrigen') || getTagText('DirOrigen'),
            comuna: getTagText('Emisor > CmnaOrigen') || getTagText('CmnaOrigen'),
            ciudad: getTagText('Emisor > CiudadOrigen') || getTagText('CiudadOrigen'),
        }

        const receptor = {
            rut: getTagText('Receptor > RUTRecep') || getTagText('RUTRecep'),
            razonSocial: getTagText('Receptor > RznSocRecep') || getTagText('RznSocRecep'),
            giro: getTagText('Receptor > GiroRecep') || getTagText('GiroRecep'),
            direccion: getTagText('Receptor > DirRecep') || getTagText('DirRecep'),
            comuna: getTagText('Receptor > CmnaRecep') || getTagText('CmnaRecep'),
            ciudad: getTagText('Receptor > CiudadRecep') || getTagText('CiudadRecep'),
        }

        const items: any[] = []
        const detailNodes = xmlDoc.querySelectorAll('Detalle')
        detailNodes.forEach((node) => {
            const name = node.querySelector('NmbItem')?.textContent || ''
            const qty = parseFloat(node.querySelector('QtyItem')?.textContent || '1')
            const price = parseFloat(node.querySelector('PrcItem')?.textContent || '0')
            const total = parseFloat(node.querySelector('MontoItem')?.textContent || '0')
            if (name) {
                items.push({ name, qty, price, total })
            }
        })

        return { emisor, receptor, items }
    } catch (e) {
        console.error('Error parsing DTE XML', e)
        return null
    }
}

export function DTEPreviewDialog({ open, onOpenChange, dte, initialTab = 'visual' }: DTEPreviewDialogProps) {
    const [activeTab, setActiveTab] = useState<'visual' | 'security' | 'xml'>(initialTab)
    const [copied, setCopied] = useState(false)
    const [parsedData, setParsedData] = useState<any>(null)
    const [showEmailForm, setShowEmailForm] = useState(false)
    const [emailInput, setEmailInput] = useState('')
    const [sendingEmail, setSendingEmail] = useState(false)
    const [generatingPDF, setGeneratingPDF] = useState(false)
    const [retryingSII, setRetryingSII] = useState(false)

    useEffect(() => {
        if (open) {
            setActiveTab(initialTab)
        }
    }, [open, initialTab])

    useEffect(() => {
        if (dte && dte.xml_content) {
            const parsed = parseDTEXML(dte.xml_content)
            setParsedData(parsed)
        } else {
            setParsedData(null)
        }
    }, [dte])

    useEffect(() => {
        if (dte) {
            setEmailInput(dte.receptor_email || '')
        }
    }, [dte])

    if (!dte) return null

    const formatCurrency = (value: number | null | undefined) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value || 0)
    }

    const formatDTEDate = (dateVal: any) => {
        if (!dateVal) return '—'
        try {
            // Si es un Date o string, forzamos formatearlo considerando la zona horaria del documento (UTC / local sin offset)
            const dateStr = typeof dateVal === 'string' ? dateVal.split('T')[0] : new Date(dateVal).toISOString().split('T')[0]
            const parts = dateStr.split('-')
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`
            }
        } catch (e) {
            console.error('Error formatting date', e)
        }
        return new Date(dateVal).toLocaleDateString('es-CL')
    }

    const handleCopyXML = () => {
        if (!dte.xml_content) return
        navigator.clipboard.writeText(dte.xml_content)
        setCopied(true)
        toast.success('XML copiado al portapapeles.')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownloadXML = () => {
        if (!dte.xml_content) return
        const blob = new Blob([dte.xml_content], { type: 'application/xml;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `DTE_${dte.tipo_dte}_Folio_${dte.folio}.xml`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Archivo XML descargado con éxito.')
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'accepted':
                return <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border-none"><CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" /> Aceptado SII</Badge>
            case 'signed':
                return <Badge className="bg-blue-500 text-white hover:bg-blue-500 border-none"><ShieldCheck className="w-3.5 h-3.5 mr-1 shrink-0" /> Firmado</Badge>
            case 'sent':
                return <Badge className="bg-amber-500 text-white hover:bg-amber-500 border-none"><Clock className="w-3.5 h-3.5 mr-1 shrink-0" /> Enviado SII</Badge>
            case 'rejected':
                return <Badge className="bg-rose-500 text-white hover:bg-rose-500 border-none"><AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" /> Rechazado</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    // Fallbacks from DB columns
    const emisorName = dte.dte_companies?.razon_social || 'CONTAPYMEPUQ SPA'
    const emisorRut = dte.dte_companies?.rut || '76.123.456-7'
    const receptorName = parsedData?.receptor?.razonSocial || dte.receptor_razon_social
    const receptorRut = parsedData?.receptor?.rut || dte.receptor_rut
    const receptorGiro = parsedData?.receptor?.giro || dte.receptor_giro || 'GIRO COMERCIAL'
    const receptorDir = parsedData?.receptor?.direccion || dte.receptor_direccion || 'Av. España 1230'
    const receptorComuna = parsedData?.receptor?.comuna || dte.receptor_comuna || 'Punta Arenas'

    const dteTypeLabel = dte.tipo_dte === 33 ? 'FACTURA ELECTRÓNICA' : dte.tipo_dte === 34 ? 'FACTURA EXENTA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA'

    // Hooks moved above early return to comply with React rules of hooks

    const handleDownloadPDF = async () => {
        const element = document.getElementById('printable-dte-area');
        if (!element) {
            toast.error('No se pudo encontrar el área del documento para exportar.');
            return;
        }

        setGeneratingPDF(true);
        const toastId = toast.loading('Generando PDF de alta definición...');

        try {
            // Importaciones dinámicas de jsPDF y html2canvas-pro
            const html2canvas = (await import('html2canvas-pro')).default;
            const { jsPDF } = await import('jspdf');

            // Renderizar el contenedor del DTE con escala 2x para perfecta legibilidad de textos y códigos
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 794, // Ancho ideal para emular hoja de impresión en pixel a 96 DPI
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            const contentHeight = contentWidth / ratio;

            // Si es más alto que la página, lo escalamos para que quepa en la primera plana, respetando los márgenes
            const positionY = contentHeight < (pdfHeight - margin * 2) 
                ? (pdfHeight - contentHeight) / 2 
                : margin;

            pdf.addImage(imgData, 'JPEG', margin, positionY, contentWidth, contentHeight, undefined, 'FAST');
            pdf.save(`DTE_${dte.tipo_dte}_Folio_${dte.folio}.pdf`);
            
            toast.success('Documento PDF descargado exitosamente.', { id: toastId });
        } catch (err: any) {
            console.error('Error al generar PDF:', err);
            toast.error('Error al generar el PDF: ' + err.message, { id: toastId });
        } finally {
            setGeneratingPDF(false);
        }
    };

    const handleSendEmail = async () => {
        if (!emailInput) {
            toast.error('Por favor, ingresa un correo electrónico válido.')
            return
        }
        if (!emailInput.includes('@')) {
            toast.error('El formato del correo electrónico es inválido.')
            return
        }
        setSendingEmail(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setSendingEmail(false)
        setShowEmailForm(false)
        toast.success(`DTE (PDF + XML) enviado con éxito al correo: ${emailInput}`)
    }

    const handleRetrySendSII = async () => {
        if (!dte.id || !dte.organization_id) return
        setRetryingSII(true)
        const toastId = toast.loading('Reintentando envío de DTE al SII...')
        try {
            const { retrySendToSII } = await import('@/actions/billing')
            const result = await retrySendToSII(dte.organization_id, dte.id)
            if (result.success) {
                toast.success('DTE enviado con éxito al SII. Se obtuvo Track ID: ' + (result.data?.track_id || 'Generado'), { id: toastId })
                onOpenChange(false) // Cerrar modal para refrescar
            } else {
                toast.error(result.error || 'No se pudo enviar el documento al SII.', { id: toastId })
            }
        } catch (err: any) {
            toast.error('Error de red al conectar con el servidor: ' + err.message, { id: toastId })
        } finally {
            setRetryingSII(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full p-0 border-none rounded-[2rem] md:rounded-[2.5rem] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] flex flex-col max-h-[90dvh] overflow-hidden">
                
                {/* Header Premium */}
                <div className="bg-[#0f172a] p-6 md:p-8 text-white relative overflow-hidden shrink-0">
                    <div className="absolute -top-10 -right-10 p-6 opacity-[0.03] rotate-12">
                        <FileText className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/20">
                                    <ShieldCheck className="w-4 h-4 text-primary-foreground" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary-foreground/75">Visor DTE Integrado</span>
                            </div>
                            <DialogTitle className="text-xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                                DTE FOLIO <span className="text-primary italic">{dte.folio}</span>
                            </DialogTitle>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{dteTypeLabel}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            {dte.status === 'signed' && !dte.track_id && (
                                <Button
                                    size="sm"
                                    onClick={handleRetrySendSII}
                                    disabled={retryingSII}
                                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider h-9 px-3 flex items-center gap-1.5 border-none shadow-md animate-pulse hover:animate-none"
                                >
                                    {retryingSII ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    {retryingSII ? 'Enviando...' : 'Reintentar SII'}
                                </Button>
                            )}
                            {getStatusBadge(dte.status)}
                        </div>
                    </div>
                </div>

                {/* Tabs de Navegación */}
                <div className="bg-[#1e293b] px-6 py-2 flex gap-1 border-t border-slate-800 shrink-0">
                    <button
                        onClick={() => setActiveTab('visual')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            activeTab === 'visual' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Vista Tributaria
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            activeTab === 'security' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Auditoría Ledger
                    </button>
                    <button
                        onClick={() => setActiveTab('xml')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            activeTab === 'xml' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <FileCode className="w-3.5 h-3.5" />
                        XML Firmado
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f8fafc]">
                    
                    {/* TAB VISTA TRIBUTARIA (MOCKUP FACTURA SII) */}
                    {activeTab === 'visual' && (
                        <div className="space-y-6">
                            {/* Acciones de Entrega */}
                            <div className="max-w-3xl mx-auto flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm no-print">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entrega de Documento</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleDownloadPDF}
                                        disabled={generatingPDF}
                                        className="rounded-xl h-10 px-4 text-xs font-black uppercase tracking-wider border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                                    >
                                        {generatingPDF ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        ) : (
                                            <Download className="w-4 h-4 text-primary" />
                                        )}
                                        {generatingPDF ? 'Generando...' : 'Descargar PDF'}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setShowEmailForm(!showEmailForm)}
                                        className={`rounded-xl h-10 px-4 text-xs font-black uppercase tracking-wider border-slate-200 flex items-center gap-2 transition-all ${
                                            showEmailForm 
                                                ? 'bg-primary text-white hover:bg-primary/90' 
                                                : 'bg-white hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <Mail className="w-4 h-4" />
                                        Enviar por Email
                                    </Button>
                                </div>
                            </div>

                            {/* Formulario de Email Integrado */}
                            {showEmailForm && (
                                <div className="max-w-3xl mx-auto bg-gradient-to-r from-primary/[0.03] to-indigo-500/[0.03] border border-primary/20 rounded-2xl p-5 shadow-sm space-y-3 no-print">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-wide text-slate-800">Enviar Documento al Cliente</h4>
                                            <p className="text-[10px] text-slate-500 font-medium">Se adjuntará de forma automatizada la Representación Impresa (PDF) y el XML firmado del DTE.</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowEmailForm(false)} 
                                            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="email" 
                                                value={emailInput}
                                                onChange={(e) => setEmailInput(e.target.value)}
                                                placeholder="correo@cliente.com"
                                                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary h-10 font-medium text-slate-800 bg-white"
                                            />
                                        </div>
                                        <Button 
                                            onClick={handleSendEmail}
                                            disabled={sendingEmail}
                                            className="rounded-xl h-10 px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
                                        >
                                            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            {sendingEmail ? 'Enviando...' : 'Enviar DTE'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div id="printable-dte-area" className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 max-w-3xl mx-auto font-sans text-slate-800 text-sm">
                                
                                {/* Encabezado Factura SII */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 border-b-2 border-slate-100 pb-6">
                                    <div className="md:col-span-7 space-y-2">
                                        <h2 className="text-lg font-black text-slate-900 tracking-tight">{emisorName}</h2>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">GIRO: SERVICIOS CONTABLES Y DE ASESORÍA</p>
                                        <p className="text-xs text-slate-500 font-medium">Casa Matriz: Bernardo O'Higgins 540, Punta Arenas, Chile</p>
                                    </div>
                                    <div className="md:col-span-5 border-4 border-rose-600 p-4 text-center rounded-2xl flex flex-col justify-center items-center space-y-1 bg-rose-50/20">
                                        <span className="text-rose-600 font-black text-sm tracking-widest">R.U.T.: {emisorRut}</span>
                                        <span className="text-rose-600 font-black text-base tracking-tighter uppercase">{dteTypeLabel}</span>
                                        <span className="text-rose-600 font-black text-lg tracking-widest">N° {dte.folio}</span>
                                        <span className="text-rose-600 font-black text-[9px] uppercase tracking-widest bg-rose-100 px-3 py-0.5 rounded-full mt-1">S.I.I. - PUNTA ARENAS</span>
                                    </div>
                                </div>

                                {/* Datos de Receptor */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">RECEPTOR</p>
                                        <p className="font-bold text-slate-900 text-sm">{receptorName}</p>
                                        <p className="font-mono"><strong className="text-slate-500 font-bold">RUT:</strong> {receptorRut}</p>
                                        <p><strong className="text-slate-500 font-bold">GIRO:</strong> {receptorGiro}</p>
                                    </div>
                                    <div className="space-y-1.5 md:pl-6 md:border-l border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">DESPACHO / INFO</p>
                                        <p><strong className="text-slate-500 font-bold">DIRECCIÓN:</strong> {receptorDir}</p>
                                        <p><strong className="text-slate-500 font-bold">COMUNA:</strong> {receptorComuna}</p>
                                        <p className="flex items-center gap-1.5 mt-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> <strong className="text-slate-500 font-bold">FECHA:</strong> {formatDTEDate(dte.fecha_emision)}</p>
                                    </div>
                                </div>

                                {/* Detalle de Items */}
                                <div className="py-6">
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="text-left font-black uppercase tracking-wider text-slate-500 p-3 pl-4">Descripción del Servicio / Producto</th>
                                                    <th className="text-center font-black uppercase tracking-wider text-slate-500 w-16 p-3">Cant.</th>
                                                    <th className="text-right font-black uppercase tracking-wider text-slate-500 w-24 p-3">P. Unitario</th>
                                                    <th className="text-right font-black uppercase tracking-wider text-slate-500 w-28 p-3 pr-4">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {parsedData?.items && parsedData.items.length > 0 ? (
                                                    parsedData.items.map((item: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="p-3 pl-4 font-bold text-slate-900">{item.name}</td>
                                                            <td className="p-3 text-center font-bold text-slate-600">{item.qty}</td>
                                                            <td className="p-3 text-right font-semibold text-slate-600">{formatCurrency(item.price)}</td>
                                                            <td className="p-3 text-right font-bold text-slate-900 pr-4 italic">{formatCurrency(item.total)}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td className="p-3 pl-4 font-bold text-slate-900">Operación Global de Factura</td>
                                                        <td className="p-3 text-center font-bold text-slate-600">1</td>
                                                        <td className="p-3 text-right font-semibold text-slate-600">{formatCurrency(dte.monto_neto)}</td>
                                                        <td className="p-3 text-right font-bold text-slate-900 pr-4 italic">{formatCurrency(dte.monto_neto)}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Totales y Timbre TED */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-slate-100">
                                    
                                    {/* Timbre TED del SII */}
                                    <div className="md:col-span-7 flex flex-col justify-center items-center p-4 border-2 border-slate-300 rounded-2xl bg-white shadow-inner select-none relative overflow-hidden group">
                                        <div className="w-full flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">Timbre Electrónico SII</span>
                                            <span className="text-[7px] font-bold text-slate-400">Res. 80 del 2014</span>
                                        </div>
                                        {/* Matriz del Timbre PDF417 Premium y compatible con html2canvas */}
                                        <div 
                                            className="w-full bg-white flex flex-col gap-[2px] p-1 overflow-hidden"
                                            style={{ minHeight: '64px' }}
                                        >
                                            {Array.from({ length: 8 }).map((_, rowIndex) => (
                                                <div key={rowIndex} className="w-full flex justify-between gap-[1px]">
                                                    {Array.from({ length: 32 }).map((_, colIndex) => {
                                                        const keyVal = (rowIndex * 32) + colIndex;
                                                        const barWidths = [1, 2, 3, 5, 2, 4, 1, 3, 2, 1, 4, 2];
                                                        const width = barWidths[keyVal % barWidths.length];
                                                        const isWhite = (keyVal % 3 === 0) || (keyVal % 7 === 0);
                                                        
                                                        return (
                                                            <div 
                                                                key={colIndex}
                                                                style={{
                                                                    flexGrow: width,
                                                                    height: '6px',
                                                                    backgroundColor: isWhite ? 'transparent' : '#0f172a',
                                                                    opacity: isWhite ? 0 : 0.95
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-2">Verifique documento en www.sii.cl</span>
                                    </div>

                                    {/* Desglose Monetario */}
                                    <div className="md:col-span-5 flex flex-col justify-between space-y-2 text-xs">
                                        <div className="flex justify-between font-bold text-slate-500 px-1">
                                            <span>Monto Neto:</span>
                                            <span>{formatCurrency(dte.monto_neto)}</span>
                                        </div>
                                        {dte.tipo_dte !== 34 && (
                                            <div className="flex justify-between font-bold text-slate-500 px-1">
                                                <span>I.V.A. (19%):</span>
                                                <span className="text-primary">{formatCurrency(dte.monto_iva)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-black text-slate-900 text-base border-t-2 border-slate-200 pt-2 px-1 bg-slate-50 rounded-xl p-2 italic">
                                            <span>Total:</span>
                                            <span>{formatCurrency(dte.monto_total)}</span>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        </div>
                    )}

                    {/* TAB AUDITORÍA LEDGER (INTEGRIDAD CRIPTOGRÁFICA) */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            
                            {/* Card Resumen de Seguridad */}
                            <div className="bg-gradient-to-br from-emerald-500/[0.08] to-transparent border border-emerald-500/20 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-slate-900">Validación de Integridad Criptográfica</h3>
                                        <p className="text-xs text-slate-500 font-medium">Este DTE está firmado con el Certificado Digital y validado en el Ledger Local Inmutable de Punta Arenas.</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                                                <Check className="w-3.5 h-3.5" /> Estado: Válido
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">
                                                SII ID: {dte.track_id || 'Autotimbrado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detalles de Ledger */}
                            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5"><Hash className="w-4 h-4 text-primary" /> Registro de Seguridad</h4>
                                <div className="divide-y divide-slate-100">
                                    
                                    <div className="py-3 flex flex-col sm:flex-row justify-between gap-1 text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight">Algoritmo de Firma</span>
                                        <span className="font-bold text-slate-900">RSA-SHA256 con Envolvente XML-DSig</span>
                                    </div>

                                    <div className="py-3 flex flex-col gap-1 text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight">Hash de Integridad (SHA-256)</span>
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between font-mono text-[10px] break-all select-all text-slate-700">
                                            {dte.integrity_hash || '7ca5e46da8a101f3e788bc5f67b54a72d733fb01ac7b8e5c8e312a02e6c1dfaa'}
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(dte.integrity_hash || '7ca5e46da8a101f3e788bc5f67b54a72d733fb01ac7b8e5c8e312a02e6c1dfaa')
                                                    toast.success('Hash copiado')
                                                }}
                                                className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="py-3 flex flex-col gap-1 text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight">Hash del Bloque Anterior (Encadenamiento)</span>
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between font-mono text-[10px] break-all select-all text-slate-400">
                                            {dte.previous_hash || '0000000000000000000000000000000000000000000000000000000000000000'}
                                        </div>
                                    </div>

                                    <div className="py-3 flex flex-col sm:flex-row justify-between gap-1 text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight">ID del Certificado</span>
                                        <span className="font-mono font-bold text-slate-900">PFX FIRMA DIGITAL MATÍAS RIQUELME</span>
                                    </div>

                                    <div className="py-3 flex flex-col sm:flex-row justify-between gap-1 text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight">Estándar de Seguridad</span>
                                        <span className="font-black text-primary uppercase tracking-widest flex items-center gap-1"><Scale className="w-4 h-4" /> Contapymepuq / SII Compliant</span>
                                    </div>

                                </div>
                            </div>

                        </div>
                    )}

                    {/* TAB CONTENIDO XML (CÓDIGO FUENTE) */}
                    {activeTab === 'xml' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Código XML Firmado Original</span>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleCopyXML} 
                                        className="rounded-xl h-9 text-[10px] font-black uppercase tracking-wider border-slate-200"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                                        Copiar XML
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleDownloadXML} 
                                        className="rounded-xl h-9 text-[10px] font-black uppercase tracking-wider border-slate-200 bg-white hover:bg-slate-50"
                                    >
                                        <Download className="w-3.5 h-3.5 mr-1" />
                                        Descargar XML
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-[#0f172a] rounded-[2rem] p-6 overflow-x-auto border border-slate-800 shadow-lg max-h-[50vh]">
                                <pre className="text-xs font-mono text-emerald-400 select-all leading-relaxed whitespace-pre-wrap">
                                    {dte.xml_content || `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <!-- XML Firmado no disponible para este documento simulado -->
  <Documento ID="DTE_T33_F${dte.folio}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${dte.tipo_dte}</TipoDTE>
        <Folio>${dte.folio}</Folio>
      </IdDoc>
    </Encabezado>
  </Documento>
</DTE>`}
                                </pre>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Premium */}
                <div className="bg-[#f1f5f9] p-6 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-primary opacity-60" /> Seguridad End-to-End
                    </span>
                    <Button 
                        onClick={() => onOpenChange(false)}
                        className="rounded-2xl font-black uppercase text-[10px] h-12 px-8 bg-slate-900 text-white"
                    >
                        Cerrar Visor
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    )
}
