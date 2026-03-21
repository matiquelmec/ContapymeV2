'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UploadCloud, CheckCircle2, CircleDashed, ArrowRightLeft, FileType, XCircle, Search } from 'lucide-react'
import { analyzeBankStatementAction } from '@/actions/bank-reconciliation'

interface BankTransaction {
    fecha: string;
    descripcion: string;
    monto: number;
    tipo: 'cargo' | 'abono';
    referencia?: string;
}

interface ReconciliationMatch {
    bankRow: BankTransaction;
    accountingEntry?: any;
    status: 'matched' | 'unmatched';
    confidence: number;
}

export function ReconciliationClient({ accountingEntries }: { accountingEntries: any[] }) {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [matches, setMatches] = useState<ReconciliationMatch[]>([])
    const [error, setError] = useState<string | null>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return
        setFile(selectedFile)
        setError(null)
    }

    const runAnalysis = async () => {
        if (!file) return
        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const result = await analyzeBankStatementAction(formData)
            
            if (!result.success) {
                throw new Error(result.error)
            }

            // Auto-matching logic
            const foundMatches: ReconciliationMatch[] = result.data.transactions.map((bt: BankTransaction) => {
                // Algoritmo de cruce V2: Busca por monto exacto (sin importar el signo para simplificar el match inicial)
                const possibleMatch = accountingEntries.find(ae => 
                    Math.abs(ae.monto) === Math.abs(bt.monto)
                )

                return {
                    bankRow: bt,
                    accountingEntry: possibleMatch,
                    status: possibleMatch ? 'matched' : 'unmatched',
                    confidence: possibleMatch ? 0.95 : 0
                }
            })

            setMatches(foundMatches)
        } catch (err: any) {
            setError(err.message || "Error al procesar la cartola")
        } finally {
            setLoading(false)
        }
    }

    const fCurrency = (num: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(num)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700" suppressHydrationWarning={true}>
            
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
                                <p className="text-[10px] font-bold text-muted-foreground italic uppercase tracking-widest">Formatos admitidos: CSV, Excel (Soporte PDF en fase de Blindaje)</p>
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
                                        <Button variant="ghost" className="mt-4 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Eliminar archivo</Button>
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
                            disabled={!file || loading}
                            className="w-full h-16 bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all gap-4"
                        >
                            {loading ? <CircleDashed className="w-6 h-6 animate-spin" /> : <ArrowRightLeft className="w-6 h-6" />}
                            {loading ? 'PROCESANDO CON MOTOR V2...' : 'EJECUTAR CRUCE ALGORÍTMICO'}
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
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6">Estado de Coincidencia</h4>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black uppercase text-foreground/60">Conciliados AT-100</span>
                                    <span className="text-3xl font-black text-emerald-600 tracking-tighter">
                                        {matches.filter(m => m.status === 'matched').length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black uppercase text-foreground/60">Pendientes de Firma</span>
                                    <span className="text-3xl font-black text-rose-500 tracking-tighter">
                                        {matches.filter(m => m.status === 'unmatched').length}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-border flex items-center gap-4">
                                <div className="p-3 bg-primary/5 rounded-xl">
                                    <Search className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-foreground tracking-tight">Auditoría en Curso</p>
                                    <p className="text-[9px] font-bold text-muted-foreground italic">Cruce basado en montos exactos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Resultado de la Conciliación */}
            {matches.length > 0 && (
                <Card className="bg-card border-border shadow-2xl overflow-hidden rounded-[2.5rem] border-t-8 border-t-primary/20 animate-in slide-in-from-bottom-6 duration-500">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 border-b border-border">
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6 w-[180px]">Estado Cruce</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6">Detalle Transacción Bancaria</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6 w-[200px] text-right">Importe Bancario</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6">Vínculo Contable (ERP)</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-10 py-6 w-[200px] text-right">Valor en Libros</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/50">
                                    {matches.map((m, i) => (
                                        <TableRow key={i} className="border-border hover:bg-primary/[0.02] transition-all group">
                                            <TableCell className="px-10 py-6">
                                                {m.status === 'matched' ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 pointer-events-none gap-2 border-emerald-200 font-black uppercase text-[8px] tracking-[0.15em] py-2 px-4 shadow-sm rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5"/> Consolidado V2
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-rose-50 text-rose-700 pointer-events-none border-rose-200 font-black uppercase text-[8px] tracking-[0.15em] py-2 px-4 shadow-sm rounded-full">
                                                        Pendiente Cruce
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-black uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{m.bankRow.descripcion}</span>
                                                    <span className="text-muted-foreground text-[10px] font-bold italic mt-1 uppercase tracking-widest opacity-60">{btDate(m.bankRow.fecha)}</span>
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
                                                        <span className="text-[10px] font-black uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">Auditoría Requerida</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            
                                            <TableCell className="text-right px-10 py-6 bg-muted/5 group-hover:bg-primary/[0.03] transition-colors border-l border-border/30">
                                                {m.status === 'matched' ? (
                                                    <span className="font-black text-sm text-primary tracking-tighter">{fCurrency(m.accountingEntry.monto)}</span>
                                                ): (
                                                    <span className="text-muted-foreground/30 font-black italic text-[10px] tracking-widest uppercase">Sin Registro</span>
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
        </div>
    )
}

function btDate(d: string) {
    if (!d) return "Sin fecha";
    return d;
}
