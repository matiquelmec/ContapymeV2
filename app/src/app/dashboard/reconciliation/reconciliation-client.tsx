'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UploadCloud, CheckCircle2, CircleDashed, ArrowRightLeft } from 'lucide-react'

// Mock simplificado de la cartola
const MOCK_CARTOLA = [
    { fecha: '2023-10-15', descripcion: 'Traspaso BANCO ESTADO', monto: 1200000, tipo: 'ingreso' },
    { fecha: '2023-10-18', descripcion: 'Pago Proveedor SOPROLE S.A.', monto: 450000, tipo: 'egreso' },
    { fecha: '2023-10-20', descripcion: 'Pago Servicios LUMEN LTDA', monto: 125000, tipo: 'egreso' }
]

export function ReconciliationClient({ accountingEntries }: { accountingEntries: any[] }) {
    const [cartolaLoaded, setCartolaLoaded] = useState(false)
    const [reconciling, setReconciling] = useState(false)
    const [matches, setMatches] = useState<any[]>([])

    const loadMockCartola = () => {
        setCartolaLoaded(true)
    }

    const startReconciliation = () => {
        setReconciling(true)
        
        setTimeout(() => {
            const foundMatches = MOCK_CARTOLA.map(c => {
                 const possibleMatch = accountingEntries.find(entry => entry.monto === c.monto)
                 return {
                     cartolaRow: c,
                     accountingEntry: possibleMatch,
                     status: possibleMatch ? 'matched' : 'unmatched'
                 }
            })
            setMatches(foundMatches)
            setReconciling(false)
        }, 1500)
    }

    const fCurrency = (num: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(num)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700" suppressHydrationWarning={true}>
            
            {/* Zona de Carga/Activación de Conciliación */}
            <div className="flex flex-col lg:flex-row gap-6 p-8 bg-card border border-border rounded-[2.5rem] shadow-2xl justify-between items-center bg-gradient-to-br from-white to-muted/20 ring-1 ring-black/[0.03]">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
                        <UploadCloud className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex flex-col space-y-1">
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Carga de Movimientos</h3>
                        <p className="text-xs font-bold text-muted-foreground italic uppercase tracking-[0.15em]">Sincronización de Cartolas Bancarias Automatizada</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    {!cartolaLoaded ? (
                        <Button 
                            onClick={loadMockCartola} 
                            className="gap-3 font-black uppercase text-[10px] tracking-widest rounded-full shadow-xl shadow-emerald-500/10 h-14 px-8 hover:scale-[1.02] active:scale-95 transition-all w-full lg:w-auto"
                        >
                           <UploadCloud className="w-5 h-5" /> 
                           Ingesta de Cartola Maestro
                        </Button>
                    ) : (
                        <Button 
                           onClick={startReconciliation} 
                           disabled={reconciling}
                           className="gap-3 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-full shadow-2xl shadow-primary/20 h-14 px-10 hover:scale-[1.02] active:scale-95 transition-all w-full lg:w-auto"
                        >
                           {reconciling ? <CircleDashed className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}
                           {reconciling ? 'Sincronizando Cruces...' : 'Ejecutar Cruce Algorítmico V2'}
                        </Button>
                    )}
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
                                                        <CheckCircle2 className="w-3.5 h-3.5"/> Consolidado
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-rose-50 text-rose-700 pointer-events-none border-rose-200 font-black uppercase text-[8px] tracking-[0.15em] py-2 px-4 shadow-sm rounded-full">
                                                        Pendiente Cruce
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-black uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{m.cartolaRow.descripcion}</span>
                                                    <span className="text-muted-foreground text-[10px] font-bold italic mt-1 uppercase tracking-widest opacity-60">{m.cartolaRow.fecha}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-10 py-6">
                                                <span className={`font-black text-sm tracking-tighter ${m.cartolaRow.tipo === 'ingreso' ? 'text-primary' : 'text-rose-600'}`}>
                                                    {m.cartolaRow.tipo === 'egreso' ? '-' : '+'}{fCurrency(m.cartolaRow.monto)}
                                                </span>
                                            </TableCell>
                                            
                                            <TableCell className="px-10 py-6">
                                                {m.status === 'matched' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-foreground font-black uppercase text-xs tracking-tight">Voucher #{m.accountingEntry.journal_entries.id.substring(0,8).toUpperCase()}</span>
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
