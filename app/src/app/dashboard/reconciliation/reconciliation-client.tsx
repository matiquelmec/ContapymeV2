'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UploadCloud, CheckCircle2, CircleDashed, ArrowRightLeft, FileType, XCircle, Search, History, Landmark, Plus } from 'lucide-react'
import { analyzeBankStatementAction, saveReconciliationAction } from '@/actions/bank-reconciliation'
import { toast } from 'sonner'
import { fCurrency } from '@/lib/utils'

interface BankAccount {
    id: string;
    bank_name: string;
    account_number: string;
}

interface BankTransaction {
    id: string;
    fecha: string;
    descripcion: string;
    monto: number;
    tipo: 'cargo' | 'abono';
    referencia_bancaria?: string;
}

interface ReconciliationMatch {
    bankRow: BankTransaction;
    accountingEntry?: any;
    status: 'matched' | 'unmatched';
    confidence: number;
}

export function ReconciliationClient({ 
    accountingEntries,
    bankAccounts,
    organizationId 
}: { 
    accountingEntries: any[],
    bankAccounts: BankAccount[],
    organizationId: string
}) {
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [matches, setMatches] = useState<ReconciliationMatch[]>([])
    const [error, setError] = useState<string | null>(null)

    // Si solo hay una cuenta, seleccionarla por defecto
    useEffect(() => {
        if (bankAccounts.length === 1 && !selectedBankAccountId) {
            setSelectedBankAccountId(bankAccounts[0].id)
        }
    }, [bankAccounts, selectedBankAccountId])

    // Filtrar entradas ya conciliadas
    const reconciledEntries = accountingEntries.filter(ae => {
        const br = ae.bank_reconciliations;
        return br && (Array.isArray(br) ? br.length > 0 : true);
    })

    const getBRVal = (ae: any, field: string) => {
        const br = ae.bank_reconciliations;
        if (!br) return null;
        return Array.isArray(br) ? br[0]?.[field] : br[field];
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return
        setFile(selectedFile)
        setError(null)
    }

    const runAnalysis = async () => {
        if (!file || !selectedBankAccountId) {
            toast.error("Seleccione una cuenta bancaria antes de procesar.")
            return
        }
        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('organization_id', organizationId)
            formData.append('bank_account_id', selectedBankAccountId)

            const result = await analyzeBankStatementAction(formData)
            
            if (!result.success) {
                throw new Error(result.error)
            }

            // Entradas contables pedientes de esta cuenta (o genéricas si no hay filtro aún)
            const pendingEntries = accountingEntries.filter(ae => 
                !ae.bank_reconciliations || ae.bank_reconciliations.length === 0
            )

            const foundMatches: ReconciliationMatch[] = result.data.transactions.map((bt: BankTransaction) => {
                const possibleMatch = pendingEntries.find(ae => 
                    Math.abs(Number(ae.monto)) === Math.abs(bt.monto)
                )

                return {
                    bankRow: bt,
                    accountingEntry: possibleMatch,
                    status: (possibleMatch ? 'matched' : 'unmatched') as 'matched' | 'unmatched',
                    confidence: possibleMatch ? 0.95 : 0
                }
            })

            setMatches(foundMatches)
            toast.success("Análisis persistente completado con Motor V2.")
        } catch (err: any) {
            setError(err.message || "Error al procesar la cartola")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        const matchedItems = matches.filter(m => m.status === 'matched' && m.accountingEntry)
        if (matchedItems.length === 0) return

        setLoading(true)
        try {
            const data = {
                organization_id: organizationId,
                matches: matchedItems.map(m => ({
                    bank_line_id: m.bankRow.id,
                    journal_entry_line_id: m.accountingEntry.id,
                    organization_id: organizationId,
                    status: 'matched',
                    notes: `Conciliado: ${m.bankRow.descripcion}`
                }))
            }

            const result = await saveReconciliationAction(data)
            if (result.success) {
                toast.success(result.message)
                setMatches([]) 
                setFile(null)
            } else {
                throw new Error(result.error)
            }
        } catch (err: any) {
            toast.error(err.message || "Error al guardar la conciliación")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700" suppressHydrationWarning={true}>
            
            {/* Cabecera de Configuración Bancaria */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-80">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Cuenta Bancaria Activa</label>
                    <Select value={selectedBankAccountId} onValueChange={(val) => setSelectedBankAccountId(val || '')}>
                        <SelectTrigger className="h-14 rounded-2xl bg-card border-border shadow-md font-black uppercase text-xs">
                            <SelectValue placeholder="Seleccione una cuenta..." />
                        </SelectTrigger>
                        <SelectContent>
                            {bankAccounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id} className="font-bold text-xs uppercase">
                                    {acc.bank_name} - {acc.account_number}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {bankAccounts.length === 0 && (
                     <div className="flex-1 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] font-black uppercase text-amber-700 leading-relaxed italic">
                        ⚠️ No tiene cuentas bancarias configuradas. Ingrese una en la configuración para habilitar la persistencia avanzada.
                     </div>
                )}
            </div>

            {/* Zona de Carga Premium */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                <UploadCloud className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Importación de Cartola Maestro</h3>
                                <p className="text-[10px] font-bold text-muted-foreground italic uppercase tracking-widest">Soporta CSV y Excel. La cartola se guardará vinculada a la cuenta seleccionada.</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[180px] ${file ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/5 hover:bg-muted/10 hover:border-primary/50'}`}>
                                <input 
                                    type="file" 
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {file ? (
                                    <div className="flex flex-col items-center text-primary animate-in zoom-in duration-300">
                                        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-primary/20">
                                            <FileType className="w-8 h-8" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-tight max-w-[300px] truncate">{file.name}</span>
                                        <Button variant="outline" className="mt-4 text-[10px] font-black uppercase border-rose-200 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Eliminar archivo</Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground transition-colors group-hover:text-primary">
                                        <div className="w-16 h-16 bg-white border-2 border-border/50 shadow-sm rounded-3xl flex items-center justify-center mb-4 group-hover:border-primary/30 group-hover:bg-primary/5">
                                            <UploadCloud className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-widest">Suelte la Cartola digital aquí</span>
                                        <span className="text-[10px] font-bold italic mt-2 uppercase">o haga clic para explorar archivos del equipo</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button 
                            onClick={runAnalysis} 
                            disabled={!file || loading || !selectedBankAccountId}
                            className="w-full h-16 bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all gap-4"
                        >
                            {loading ? <CircleDashed className="w-6 h-6 animate-spin" /> : <ArrowRightLeft className="w-6 h-6" />}
                            {loading ? 'PERSISTIENDO Y ANALIZANDO...' : 'EJECUTAR CRUCE PERSISTENTE'}
                        </Button>

                        {error && (
                            <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-4 text-rose-700 font-bold text-xs uppercase animate-in slide-in-from-top-2">
                                <XCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Resumen Lateral */}
                <div className="space-y-6">
                    <Card className="bg-white border-border shadow-xl rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-8">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6">Estado del Cruce</h4>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black uppercase text-foreground/60">Conciliados (Match)</span>
                                    <span className="text-3xl font-black text-emerald-600 tracking-tighter">
                                        {matches.filter(m => m.status === 'matched').length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black uppercase text-foreground/60">No Detectados</span>
                                    <span className="text-3xl font-black text-rose-500 tracking-tighter">
                                        {matches.filter(m => m.status === 'unmatched').length}
                                    </span>
                                </div>
                            </div>

                            {matches.some(m => m.status === 'matched') && !loading && (
                                <Button 
                                    onClick={handleSave}
                                    className="w-full mt-8 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest rounded-3xl shadow-lg shadow-emerald-500/20 gap-3"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Confirmar Blindaje
                                </Button>
                            )}
                            
                            <div className="mt-8 pt-8 border-t border-border flex items-center gap-4">
                                <div className="p-3 bg-primary/5 rounded-xl">
                                    <Search className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-foreground tracking-tight">Persistencia Master</p>
                                    <p className="text-[9px] font-bold text-muted-foreground italic leading-tight">Mapeo ID a ID blindado en Base de Datos.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Resultado de la Conciliación Actual */}
            {matches.length > 0 && (
                <Card className="bg-card border-border shadow-2xl overflow-hidden rounded-[2.5rem] border-t-8 border-t-primary/20 animate-in slide-in-from-bottom-6 duration-500">
                    <CardContent className="p-0">
                        <div className="p-6 bg-muted/20 border-b border-border flex justify-between items-center">
                            <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                                <Landmark className="w-5 h-5 text-primary" />
                                Cruce Algorítmico Persistente
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 border-b border-border">
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6 w-[180px]">Estado</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6">Detalle Cartola (DB-Link)</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6 w-[180px] text-right">Monto Banco</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6">Registro Contable (ERP)</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6 w-[180px] text-right">Monto Diario</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/50">
                                    {matches.map((m, i) => (
                                        <TableRow key={i} className="border-border hover:bg-primary/[0.02] transition-all group">
                                            <TableCell className="px-10 py-6">
                                                {m.status === 'matched' ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 pointer-events-none gap-2 border-emerald-200 font-black uppercase text-[8px] tracking-[0.15em] py-2 px-4 shadow-sm rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5"/> Match 1:1
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-rose-50 text-rose-700 pointer-events-none border-rose-200 font-black uppercase text-[8px] tracking-[0.15em] py-2 px-4 shadow-sm rounded-full">
                                                        Pendiente
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-black uppercase text-xs tracking-tight group-hover:text-primary transition-colors line-clamp-1">{m.bankRow.descripcion}</span>
                                                    <span className="text-muted-foreground text-[10px] font-bold italic mt-1 uppercase tracking-widest opacity-60">ID: {m.bankRow.id.substring(0,8)} | {m.bankRow.fecha}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-10 py-6">
                                                <span className={`font-black text-sm tracking-tighter ${m.bankRow.tipo === 'abono' ? 'text-primary' : 'text-rose-600'}`}>
                                                    {m.bankRow.tipo === 'cargo' ? '-' : '+'}{fCurrency(m.bankRow.monto)}
                                                </span>
                                            </TableCell>
                                            
                                            <TableCell className="px-10 py-6">
                                                {m.status === 'matched' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-foreground font-black uppercase text-xs tracking-tight">Asiento #{m.accountingEntry.journal_entries.numero_asiento || m.accountingEntry.journal_entries.id.substring(0,8).toUpperCase()}</span>
                                                        <span className="text-muted-foreground text-[10px] font-bold uppercase truncate max-w-[200px] mt-1 tracking-widest opacity-60">
                                                            {m.accountingEntry.cuenta_nombre}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-rose-600">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">Sin coincidencia</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            
                                            <TableCell className="text-right px-10 py-6 bg-muted/5 group-hover:bg-primary/[0.03] transition-colors border-l border-border/30">
                                                {m.status === 'matched' ? (
                                                    <span className="font-black text-sm text-primary tracking-tighter">{fCurrency(Number(m.accountingEntry.monto))}</span>
                                                ): (
                                                    <span className="text-muted-foreground/30 font-black italic text-[10px] tracking-widest uppercase">N/A</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Historial de Conciliaciones Pasadas */}
            {reconciledEntries.length > 0 && (
                <Card className="bg-card border-border shadow-2xl overflow-hidden rounded-[2.5rem] border-t-8 border-t-emerald-500/20 animate-in slide-in-from-bottom-10 duration-700">
                    <CardContent className="p-0">
                        <div className="p-8 bg-emerald-50/50 border-b border-border flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <History className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Historial de Auditoría Bancaria</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground italic uppercase">Registros blindados y verificados en el Libro Diario</p>
                                </div>
                            </div>
                            <Badge className="bg-emerald-600 text-white font-black px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/20 border-none uppercase text-[10px]">
                                {reconciledEntries.length} Registros Consolidados
                            </Badge>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 border-b border-border">
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6">Fecha Conciliación</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6 text-center">Referencia ERP</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6">Glosa Auditoría</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6 text-right">Monto Auditado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reconciledEntries.map((ae, i) => (
                                        <TableRow key={i} className="border-border hover:bg-emerald-500/[0.02] transition-all">
                                            <TableCell className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-black uppercase text-xs">
                                                        {new Date(getBRVal(ae, 'reconciled_at') || ae.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-600 uppercase italic">Verificado V2</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10 py-6 text-center">
                                                <Badge variant="outline" className="font-black uppercase text-[9px] border-border bg-white py-1 px-3 rounded-lg">
                                                    Asiento #{ae.journal_entries.numero_asiento || ae.id.substring(0,8).toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-bold text-xs uppercase">{getBRVal(ae, 'notes') || 'Sin observaciones'}</span>
                                                    <span className="text-[10px] text-muted-foreground font-bold italic truncate max-w-[300px] mt-1 uppercase tracking-widest">Cuenta: {ae.cuenta_nombre}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10 py-6 text-right">
                                                <span className="font-black text-sm text-emerald-600 tracking-tighter">
                                                    {fCurrency(Number(ae.monto))}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
