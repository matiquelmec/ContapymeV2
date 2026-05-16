'use client'

import { useState, useEffect } from 'react'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select'
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table'
import { 
    Plus, 
    Trash2, 
    Calculator, 
    FileText, 
    User, 
    Building2,
    ShieldCheck,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { issueDTE } from '@/actions/billing'
import { cleanRUT, formatRUT, validateRUT } from '@/lib/utils/rut'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { StatusModal, StatusType } from '../components/status-modal'

interface IssueInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organizationId: string
}

interface DTEItem {
    id: string
    product_name: string
    quantity: number
    unit_price: number
    total_amount: number
    is_exempt: boolean
}

export function IssueInvoiceDialog({ open, onOpenChange, organizationId }: IssueInvoiceDialogProps) {
    const [loading, setLoading] = useState(false)
    const [tipoDte, setTipoDte] = useState('33')
    const [receptor, setReceptor] = useState({
        rut: '',
        razon_social: '',
        giro: ''
    })
    const [items, setItems] = useState<DTEItem[]>([
        { id: crypto.randomUUID(), product_name: '', quantity: 1, unit_price: 0, total_amount: 0, is_exempt: false }
    ])

    const [totals, setTotals] = useState({
        neto: 0,
        iva: 0,
        total: 0
    })

    const [statusModal, setStatusModal] = useState({
        open: false,
        type: 'success' as StatusType,
        title: '',
        description: '',
        actionLabel: undefined as string | undefined,
        onAction: undefined as (() => void) | undefined
    });

    const supabase = createClient();

    const handleRUTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const cleaned = cleanRUT(rawValue);
        if (cleaned.length > 9) return;

        const formatted = formatRUT(cleaned);
        setReceptor(prev => ({ ...prev, rut: formatted }));

        if (validateRUT(cleaned)) {
            // Debounce manual
            const timeoutId = setTimeout(async () => {
                try {
                    const { data } = await supabase
                        .from('sales_records')
                        .select('receptor_razon_social')
                        .eq('receptor_rut', formatted)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (data?.receptor_razon_social) {
                        setReceptor(prev => ({ ...prev, razon_social: data.receptor_razon_social }));
                    }
                } catch (err) {
                    console.error("Error looking up Razón Social:", err);
                }
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    };

    // Lógica de cálculo heredada de SistemaOC (19% IVA)
    useEffect(() => {
        let neto = 0
        let exento = 0

        items.forEach(item => {
            const amount = item.quantity * item.unit_price
            if (item.is_exempt || tipoDte === '34') {
                exento += amount
            } else {
                neto += amount
            }
        })

        const iva = Math.round(neto * 0.19)
        const total = neto + iva + exento

        setTotals({ neto, iva, total })
    }, [items, tipoDte])

    const addItem = () => {
        setItems([...items, { id: crypto.randomUUID(), product_name: '', quantity: 1, unit_price: 0, total_amount: 0, is_exempt: false }])
    }

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id))
        }
    }

    const updateItem = (id: string, field: keyof DTEItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                // Si es un campo numérico y el valor es NaN (input vacío), usamos 0
                let finalValue = value;
                if ((field === 'quantity' || field === 'unit_price') && isNaN(value)) {
                    finalValue = 0;
                }
                
                const updated = { ...item, [field]: finalValue }
                updated.total_amount = (updated.quantity || 0) * (updated.unit_price || 0)
                return updated
            }
            return item
        }))
    }

    const handleIssue = async () => {
        if (!receptor.rut || !receptor.razon_social) {
            toast.error('Debe ingresar los datos del receptor.')
            return
        }

        if (items.some(i => !i.product_name || i.unit_price <= 0)) {
            toast.error('Todos los ítems deben tener nombre y precio.')
            return
        }

        setLoading(true)
        try {
            const result = await issueDTE({
                organization_id: organizationId,
                tipo_dte: parseInt(tipoDte),
                receptor_rut: receptor.rut,
                receptor_razon_social: receptor.razon_social,
                receptor_giro: receptor.giro,
                monto_neto: totals.neto,
                monto_iva: totals.iva,
                monto_total: totals.total,
                items: items.map(({ product_name, quantity, unit_price, total_amount }) => ({
                    product_name,
                    quantity,
                    unit_price,
                    total_amount
                }))
            })

            if (result.success) {
                setStatusModal({
                    open: true,
                    type: 'success',
                    title: 'DTE Emitido',
                    description: `El documento Folio ${result.data.folio} ha sido generado y timbrado exitosamente por el SII.`,
                    actionLabel: 'Ver PDF',
                    onAction: () => {
                        // Aquí iría la lógica para abrir el PDF
                        onOpenChange(false)
                        setReceptor({ rut: '', razon_social: '', giro: '' })
                        setItems([{ id: crypto.randomUUID(), product_name: '', quantity: 1, unit_price: 0, total_amount: 0, is_exempt: false }])
                    }
                })
            } else {
                setStatusModal({
                    open: true,
                    type: 'error',
                    title: 'Fallo en Emisión',
                    description: result.error || 'No se pudo completar el timbrado del documento.',
                    actionLabel: undefined,
                    onAction: undefined
                })
            }
        } catch (error) {
            setStatusModal({
                open: true,
                type: 'error',
                title: 'Error Crítico',
                description: 'El motor de facturación no respondió. Verifique su conexión o folios.',
                actionLabel: undefined,
                onAction: undefined
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <StatusModal 
                open={statusModal.open}
                onOpenChange={(open) => setStatusModal(prev => ({ ...prev, open }))}
                type={statusModal.type}
                title={statusModal.title}
                description={statusModal.description}
                actionLabel={statusModal.actionLabel}
                onAction={statusModal.onAction}
            />
            <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-full p-0 overflow-hidden border-none rounded-[2rem] md:rounded-[3rem] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]">
                <div className="bg-[#0f172a] p-6 md:p-10 text-white relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 p-8 opacity-[0.03] rotate-12">
                        <FileText className="w-64 h-64" />
                    </div>
                    <div className="relative z-10">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-primary/20 p-2 rounded-xl backdrop-blur-sm border border-primary/20">
                                    <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground/60">Emisión Certificada</span>
                            </div>
                            <DialogTitle className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                                EMISIÓN DE DTE <span className="text-primary italic">PRIME</span>
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                </div>

                <div className="p-6 md:p-10 space-y-8 md:space-y-10 overflow-y-auto max-h-[70vh] bg-[#f8fafc]">
                    {/* SECCIÓN CONFIGURACIÓN BASE */}
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8">
                        <div className="md:col-span-4 space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Tipo de Documento</Label>
                            <Select value={tipoDte} onValueChange={setTipoDte}>
                                <SelectTrigger className="w-full rounded-2xl h-14 border-slate-200 bg-white shadow-sm font-bold text-slate-700 px-6">
                                    <SelectValue placeholder="Seleccione Tipo" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                                    <SelectItem value="33" className="font-bold py-3">Factura Electrónica (33)</SelectItem>
                                    <SelectItem value="34" className="font-bold py-3">Factura Exenta (34)</SelectItem>
                                    <SelectItem value="39" className="font-bold py-3">Boleta Electrónica (39)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="md:col-span-8 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-slate-100 p-2 rounded-xl">
                                    <User className="w-4 h-4 text-slate-600" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Receptor</h3>
                            </div>
                            <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6">
                                <div className="md:col-span-4 space-y-2">
                                    <div className="flex justify-between items-center pr-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-tight text-slate-400 pl-1">RUT</Label>
                                        {validateRUT(receptor.rut) && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Válido</span>}
                                    </div>
                                    <div className="relative">
                                        <Input 
                                            placeholder="77.123.456-K" 
                                            className={cn(
                                                "rounded-xl border-slate-200 h-12 bg-slate-50/50 focus:bg-white font-mono",
                                                validateRUT(receptor.rut) && "border-emerald-200 bg-emerald-50/20"
                                            )}
                                            value={receptor.rut}
                                            onChange={handleRUTChange}
                                        />
                                        {loading && <Loader2 className="absolute right-3 top-3.5 w-5 h-5 animate-spin text-slate-300" />}
                                    </div>
                                </div>
                                <div className="md:col-span-8 space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-tight text-slate-400 pl-1">Razón Social</Label>
                                    <Input 
                                        placeholder="Nombre completo" 
                                        className="rounded-xl border-slate-200 h-12 bg-slate-50/50 focus:bg-white font-bold"
                                        value={receptor.razon_social}
                                        onChange={e => setReceptor({...receptor, razon_social: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN ÍTEMS */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Desglose de Operación</h3>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={addItem} 
                                className="rounded-xl font-black h-10 px-5 text-[10px] uppercase tracking-widest border-slate-200"
                            >
                                <Plus className="w-3 h-3 mr-2" /> Añadir Ítem
                            </Button>
                        </div>
                        
                        <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm overflow-x-auto">
                            <Table className="min-w-[700px]">
                                <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest pl-8 py-5 text-slate-400">Descripción</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest w-[100px] text-center text-slate-400">Cant.</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest w-[160px] text-right text-slate-400">P. Unitario</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest w-[160px] text-right pr-10 text-slate-400">Total</TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-50">
                                    {items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/30">
                                            <TableCell className="py-4 pl-8">
                                                <Input 
                                                    value={item.product_name}
                                                    onChange={e => updateItem(item.id, 'product_name', e.target.value)}
                                                    className="rounded-xl h-11 border-transparent bg-transparent hover:bg-white focus:bg-white font-bold text-sm"
                                                />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Input 
                                                    type="number"
                                                    value={item.quantity || ''}
                                                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                                    className="rounded-xl h-11 border-transparent bg-transparent hover:bg-white text-center font-black"
                                                />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Input 
                                                    type="number"
                                                    value={item.unit_price || ''}
                                                    onChange={e => updateItem(item.id, 'unit_price', parseInt(e.target.value))}
                                                    className="rounded-xl h-11 border-transparent bg-transparent hover:bg-white text-right font-black"
                                                />
                                            </TableCell>
                                            <TableCell className="py-4 font-black text-sm text-right pr-10 text-slate-900 italic">
                                                ${(item.quantity * item.unit_price).toLocaleString('es-CL')}
                                            </TableCell>
                                            <TableCell className="py-4 text-center">
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-10 border-t border-slate-100 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-wrap gap-4 md:gap-10 items-center justify-center bg-slate-50/50 p-4 md:p-6 md:px-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 w-full md:w-auto">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Neto</p>
                                <p className="text-lg font-black text-slate-600 italic">${totals.neto.toLocaleString('es-CL')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">IVA</p>
                                <p className="text-lg font-black text-primary italic">${totals.iva.toLocaleString('es-CL')}</p>
                            </div>
                            <div className="text-center px-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Total</p>
                                <p className="text-2xl md:text-4xl font-black text-slate-900 italic">${totals.total.toLocaleString('es-CL')}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl font-black uppercase text-[10px] h-14 px-8 text-slate-400">
                                Cancelar
                            </Button>
                            <Button 
                                className="rounded-2xl font-black uppercase text-[10px] h-14 px-12 shadow-xl bg-primary text-white min-w-[200px]"
                                disabled={loading}
                                onClick={handleIssue}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                Emitir DTE
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}
