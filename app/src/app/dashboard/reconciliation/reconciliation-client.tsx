'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UploadCloud, CheckCircle2, CircleDashed, ArrowRightLeft, FileType, XCircle, Search, History, Landmark, Plus, Save, Loader2 } from 'lucide-react'
import { analyzeBankStatementAction, saveReconciliationAction, reconcileWithAdjustmentAction } from '@/actions/bank-reconciliation'
import { suggestAccountWithSovereignAI } from '@/actions/ai-classifier'
import { toast } from 'sonner'
import { fCurrency } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    bankAccounts: initialBankAccounts,
    accounts,
    organizationId 
}: { 
    accountingEntries: any[],
    bankAccounts: BankAccount[],
    accounts: any[],
    organizationId: string
}) {
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts)
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [matches, setMatches] = useState<ReconciliationMatch[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isBankDialogOpen, setIsBankDialogOpen] = useState(false)
    const [newBank, setNewBank] = useState({
        bank_name: "",
        account_number: "",
        account_type: "corriente",
        chart_account_id: ""
    })
    const [creatingBank, setCreatingBank] = useState(false)

    const handleCreateBank = async () => {
        if (!newBank.bank_name || !newBank.account_number) {
            toast.error("Complete el nombre y número de cuenta")
            return
        }
        setCreatingBank(true)
        const { createBankAccount } = await import("@/actions/bank-reconciliation")
        try {
            const result = await createBankAccount({
                ...newBank,
                organization_id: organizationId
            })
            if (result.success) {
                toast.success("Cuenta bancaria registrada con éxito")
                setIsBankDialogOpen(false)
                window.location.reload()
            } else {
                toast.error(result.error || "Error al registrar banco")
            }
        } catch (error) {
            toast.error("Error al conectar con el motor bancario")
        } finally {
            setCreatingBank(false)
        }
    }

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

    const handleQuickAdjustment = async (bankRowId: string, desc: string) => {
        setLoading(true)
        
        // 1. Consultar The Sovereign AI Memory
        let targetCode = "5.1.05.001"
        let targetName = "Gastos y Comisiones Bancarias"
        let aiMsg = ""
        
        try {
            const aiRes = await suggestAccountWithSovereignAI({ 
                organization_id: organizationId, 
                description: desc 
            });
            
            if (aiRes.success && aiRes.data && aiRes.data.account_code) {
                // Si la IA tiene alta confianza, lo marcamos como sugerencia inteligente
                targetCode = aiRes.data.account_code;
                targetName = aiRes.data.account_name;
                
                if (aiRes.data.suggested) {
                    aiMsg = `\n\n🤖 Sugerencia Sovereign AI (${aiRes.data.confidence}% confianza):\nSe detectó un patrón histórico.`;
                } else {
                    aiMsg = `\n\n⚠️ Sugerencia Básica Sovereign AI (Baja certeza - requiere más historial).`;
                }
            }
        } catch(e) {
            console.warn("Fallo en inferencia IA predictiva", e)
        }
        
        setLoading(false)

        const proceed = confirm(`¿Desea generar un Asiento de Ajuste por este movimiento bancario?\n\nDetalle: "${desc}"${aiMsg}\n\n-> Se imputará a: [${targetCode}] ${targetName}`)
        if (!proceed) return

        setLoading(true)
        try {
            const result = await reconcileWithAdjustmentAction({
                bank_line_id: bankRowId,
                account_code: targetCode, 
                account_name: targetName,
                organization_id: organizationId
            })

            if (result.success) {
                toast.success("Asiento de ajuste generado y conciliado.")
                setMatches(prev => prev.map(m => 
                    m.bankRow.id === bankRowId 
                    ? { ...m, status: 'matched', confidence: 1.0, accountingEntry: { id: 'NEW', account_name: 'AJUSTE: Gasto Bancario', monto: m.bankRow.monto, journal_entries: { numero_asiento: 'NUEVO' } } } 
                    : m
                ))
            } else {
                throw new Error(result.error)
            }
        } catch (err: any) {
            toast.error(err.message || "Error al crear ajuste")
        } finally {
            setLoading(false)
        }
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

            const pendingEntries = accountingEntries.filter(ae => 
                !ae.bank_reconciliations || (Array.isArray(ae.bank_reconciliations) ? ae.bank_reconciliations.length === 0 : false)
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
        const matchedItems = matches.filter(m => m.status === 'matched' && m.accountingEntry && m.accountingEntry.id !== 'NEW')
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

    if (bankAccounts.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700" suppressHydrationWarning={true}>
                <div className="flex flex-col items-center justify-center py-24 bg-card border border-border/80 rounded-[2.5rem] shadow-xl relative overflow-hidden bg-gradient-to-tr from-slate-50 via-white to-primary/[0.02] group">
                   {/* Glow decorativo sutil */}
                   <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
                   
                   <div className="relative z-10 flex flex-col items-center max-w-md text-center px-6">
                     <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 mb-6 group-hover:scale-105 transition-transform duration-300">
                       <Landmark className="h-12 w-12 text-primary" />
                     </div>
                     <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Cuentas Bancarias Vacías</h3>
                     <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1 mb-4">Conciliación Bancaria Persistente</p>
                     <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8">
                       No se han detectado cuentas corrientes configuradas para esta empresa. Registre su primera cuenta bancaria para habilitar la importación de cartolas y el cruce automatizado V2.
                     </p>

                     <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
                       <DialogTrigger render={
                         <Button className="w-full inline-flex items-center justify-center gap-3 px-8 py-6 bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase text-xs tracking-widest rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all">
                           <Plus className="h-5 w-5" /> Registrar Cuenta Bancaria
                         </Button>
                       } />
                       <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-border bg-card shadow-2xl p-8">
                         <DialogHeader className="space-y-4 pb-6 border-b border-border">
                           <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Nueva Cuenta Bancaria</DialogTitle>
                           <DialogDescription className="text-xs font-bold italic text-muted-foreground leading-relaxed">
                             Vincule su cuenta corriente al Plan de Cuentas para registrar automáticamente las conciliaciones.
                           </DialogDescription>
                         </DialogHeader>
                         <div className="grid gap-6 py-8">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-3">
                               <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Institución</Label>
                               <Input 
                                 placeholder="Ej: Santander"
                                 value={newBank.bank_name}
                                 onChange={(e) => setNewBank({...newBank, bank_name: e.target.value})}
                                 className="bg-muted/10 border-2 border-border font-black h-12 rounded-2xl px-4"
                               />
                             </div>
                             <div className="space-y-3">
                               <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tipo</Label>
                               <Select 
                                 value={newBank.account_type}
                                 onValueChange={(val: string | null) => setNewBank({...newBank, account_type: val || "corriente"})}
                               >
                                 <SelectTrigger className="bg-muted/10 border-2 border-border h-12 rounded-2xl font-black text-xs uppercase px-4">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className="bg-white border-border rounded-xl">
                                   <SelectItem value="corriente" className="font-bold text-xs uppercase">Corriente</SelectItem>
                                   <SelectItem value="vista" className="font-bold text-xs uppercase">Vista</SelectItem>
                                   <SelectItem value="ahorro" className="font-bold text-xs uppercase">Ahorro</SelectItem>
                                 </SelectContent>
                               </Select>
                             </div>
                           </div>
                           <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Número de Cuenta</Label>
                             <Input 
                               placeholder="000-1234567-8"
                               value={newBank.account_number}
                               onChange={(e) => setNewBank({...newBank, account_number: e.target.value})}
                               className="bg-muted/10 border-2 border-border font-black h-12 rounded-2xl px-4"
                             />
                           </div>
                           <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vincular a Cuenta Contable (Libro Diario)</Label>
                             <Select 
                               onValueChange={(val: string | null) => setNewBank({...newBank, chart_account_id: val || ""})}
                             >
                               <SelectTrigger className="bg-muted/10 border-2 border-border h-12 rounded-2xl px-6 font-black text-xs uppercase">
                                 <SelectValue placeholder="Seleccione Cuenta en Plan de Cuentas" />
                               </SelectTrigger>
                               <SelectContent className="max-h-60 bg-white border-border rounded-2xl shadow-2xl p-2">
                                 {accounts.filter((a: any) => a.codigo.startsWith('1.1.01') || a.nombre.toLowerCase().includes('banco')).map((acc: any) => (
                                   <SelectItem key={acc.id} value={acc.id} className="font-bold text-[10px] uppercase">
                                     {acc.codigo} - {acc.nombre}
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>
                         </div>
                         <DialogFooter className="border-t border-border pt-6 mt-4">
                           <Button 
                             onClick={handleCreateBank}
                             disabled={creatingBank}
                             className="w-full h-12 bg-primary text-primary-foreground font-extrabold uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/20 gap-2"
                           >
                             {creatingBank ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                             Registrar Cuenta Bancaria
                           </Button>
                         </DialogFooter>
                       </DialogContent>
                     </Dialog>

                   </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700" suppressHydrationWarning={true}>
            
            <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-end">
                <div className="w-full md:w-80">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Cuenta Bancaria Activa</label>
                    <Select value={selectedBankAccountId} onValueChange={(val) => setSelectedBankAccountId(val || '')}>
                        <SelectTrigger className="h-14 rounded-2xl bg-card border-border shadow-md font-black uppercase text-xs">
                            <SelectValue placeholder="Seleccione una cuenta..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-border rounded-xl">
                            {bankAccounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id} className="font-bold text-xs uppercase">
                                    {acc.bank_name} - {acc.account_number}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
                  <DialogTrigger render={
                    <Button variant="outline" className="h-14 px-5 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary text-primary font-black uppercase text-xs tracking-wider transition-all gap-2 flex items-center justify-center shrink-0 w-full md:w-auto">
                        <Plus className="w-5 h-5" /> Registrar Cuenta
                    </Button>
                  } />
                  <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-border bg-card shadow-2xl p-8">
                    <DialogHeader className="space-y-4 pb-6 border-b border-border">
                      <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Nueva Cuenta Bancaria</DialogTitle>
                      <DialogDescription className="text-xs font-bold italic text-muted-foreground leading-relaxed">
                        Vincule su cuenta corriente al Plan de Cuentas para registrar automáticamente las conciliaciones.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Institución</Label>
                          <Input 
                            placeholder="Ej: Santander"
                            value={newBank.bank_name}
                            onChange={(e) => setNewBank({...newBank, bank_name: e.target.value})}
                            className="bg-muted/10 border-2 border-border font-black h-12 rounded-2xl px-4"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tipo</Label>
                          <Select 
                            value={newBank.account_type}
                            onValueChange={(val: string | null) => setNewBank({...newBank, account_type: val || "corriente"})}
                          >
                            <SelectTrigger className="bg-muted/10 border-2 border-border h-12 rounded-2xl font-black text-xs uppercase px-4">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-border rounded-xl">
                              <SelectItem value="corriente" className="font-bold text-xs uppercase">Corriente</SelectItem>
                              <SelectItem value="vista" className="font-bold text-xs uppercase">Vista</SelectItem>
                              <SelectItem value="ahorro" className="font-bold text-xs uppercase">Ahorro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Número de Cuenta</Label>
                        <Input 
                          placeholder="000-1234567-8"
                          value={newBank.account_number}
                          onChange={(e) => setNewBank({...newBank, account_number: e.target.value})}
                          className="bg-muted/10 border-2 border-border font-black h-12 rounded-2xl px-4"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vincular a Cuenta Contable (Libro Diario)</Label>
                        <Select 
                          onValueChange={(val: string | null) => setNewBank({...newBank, chart_account_id: val || ""})}
                        >
                          <SelectTrigger className="bg-muted/10 border-2 border-border h-12 rounded-2xl px-6 font-black text-xs uppercase">
                            <SelectValue placeholder="Seleccione Cuenta en Plan de Cuentas" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 bg-white border-border rounded-2xl shadow-2xl p-2">
                            {accounts.filter((a: any) => a.codigo.startsWith('1.1.01') || a.nombre.toLowerCase().includes('banco')).map((acc: any) => (
                              <SelectItem key={acc.id} value={acc.id} className="font-bold text-[10px] uppercase">
                                {acc.codigo} - {acc.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="border-t border-border pt-6 mt-4">
                      <Button 
                        onClick={handleCreateBank}
                        disabled={creatingBank}
                        className="w-full h-12 bg-primary text-primary-foreground font-extrabold uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/20 gap-2"
                      >
                        {creatingBank ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Registrar Cuenta Bancaria
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-card border-border shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary">
                    <CardContent className="p-6 sm:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
                                <UploadCloud className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Importación de Cartola Maestro</h3>
                                <p className="text-[10px] font-bold text-muted-foreground italic uppercase tracking-widest leading-relaxed">Soporta CSV y Excel. La cartola se guardará vinculada a la cuenta seleccionada.</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className={`border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[180px] ${file ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/5 hover:bg-muted/10 hover:border-primary/50'}`}>
                                <input 
                                    type="file" 
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                bag-account-id="file-input"/>
                                {file ? (
                                    <div className="flex flex-col items-center text-primary animate-in zoom-in duration-300">
                                        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-primary/20">
                                            <FileType className="w-8 h-8" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-tight max-w-[240px] sm:max-w-[300px] truncate">{file.name}</span>
                                        <Button variant="outline" className="mt-4 text-[10px] font-black uppercase border-rose-200 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Eliminar archivo</Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground transition-colors group-hover:text-primary">
                                        <div className="w-16 h-16 bg-white border-2 border-border/50 shadow-sm rounded-3xl flex items-center justify-center mb-4 group-hover:border-primary/30 group-hover:bg-primary/5">
                                            <UploadCloud className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-widest text-center">Suelte la Cartola digital aquí</span>
                                        <span className="text-[10px] font-bold italic mt-2 uppercase text-center">o haga clic para explorar archivos del equipo</span>
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
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-white border-border shadow-xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-6 sm:p-8">
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

                            {matches.some(m => m.status === 'matched' && m.accountingEntry && m.accountingEntry.id !== 'NEW') && !loading && (
                                <Button 
                                    onClick={handleSave}
                                    className="w-full mt-8 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest rounded-3xl shadow-lg shadow-emerald-500/20 gap-3"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Confirmar Blindaje
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {matches.length > 0 && (
                <Card className="bg-card border-border shadow-2xl overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border-t-8 border-t-primary/20 animate-in slide-in-from-bottom-6 duration-500">
                    <CardContent className="p-0">
                            <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 border-b border-border">
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-4 sm:px-10 py-4 sm:py-6 w-[180px]">Estado</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-4 sm:px-10 py-4 sm:py-6">Detalle Cartola</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-4 sm:px-10 py-4 sm:py-6 w-[180px] text-right">Monto</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-4 sm:px-10 py-4 sm:py-6">Registro ERP</TableHead>
                                        <TableHead className="text-foreground/60 font-black uppercase text-[10px] tracking-widest px-4 sm:px-10 py-4 sm:py-6 w-[120px] text-center">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/50">
                                    {matches.map((m, i) => (
                                        <TableRow key={i} className="border-border hover:bg-primary/[0.02] transition-all group">
                                            <TableCell className="px-4 sm:px-10 py-4 sm:py-6">
                                                {m.status === 'matched' ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 pointer-events-none gap-2 border-emerald-200 font-black uppercase text-[8px] tracking-[0.15em] py-2 px-4 shadow-sm rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5"/> Match OK
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-rose-50 text-rose-700 pointer-events-none border-rose-200 font-black uppercase text-[8px] tracking-[0.15em] py-2 px-4 shadow-sm rounded-full">
                                                        Pendiente
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4 sm:px-10 py-4 sm:py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-black uppercase text-xs tracking-tight truncate max-w-[150px] sm:max-w-[300px]">{m.bankRow.descripcion}</span>
                                                    <span className="text-muted-foreground text-[10px] font-bold italic mt-1 uppercase opacity-60">{m.bankRow.fecha}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-4 sm:px-10 py-4 sm:py-6 font-black text-sm tracking-tighter">
                                                {fCurrency(m.bankRow.monto)}
                                            </TableCell>
                                            <TableCell className="px-4 sm:px-10 py-4 sm:py-6">
                                                {m.status === 'matched' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-foreground font-black uppercase text-[10px]">{m.accountingEntry.account_name}</span>
                                                        <span className="text-muted-foreground text-[9px] font-bold uppercase opacity-60">Asiento: {m.accountingEntry.journal_entries.numero_asiento || 'N/A'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Sin coincidencia</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4 sm:px-10 py-4 sm:py-6 text-center">
                                                {m.status === 'unmatched' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleQuickAdjustment(m.bankRow.id, m.bankRow.descripcion)}
                                                        className="h-9 px-4 rounded-xl border-primary/20 text-primary font-black uppercase text-[9px] hover:bg-primary hover:text-white transition-all gap-2"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        + Gasto
                                                    </Button>
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

            {reconciledEntries.length > 0 && (
                <Card className="bg-card border-border shadow-2xl overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border-t-8 border-t-emerald-500/20 animate-in slide-in-from-bottom-10 duration-700">
                    <CardContent className="p-0">
                        <div className="p-6 sm:p-8 bg-emerald-50/50 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                             <h3 className="text-lg font-black uppercase tracking-tighter text-foreground flex items-center gap-4">
                                <History className="w-6 h-6 text-emerald-600 shrink-0" />
                                Historial de Auditoría Bancaria
                             </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 border-b border-border">
                                        <TableHead className="px-4 sm:px-10 py-4 sm:py-6 font-black uppercase text-[10px]">Fecha</TableHead>
                                        <TableHead className="px-4 sm:px-10 py-4 sm:py-6 font-black uppercase text-[10px]">Glosa</TableHead>
                                        <TableHead className="px-4 sm:px-10 py-4 sm:py-6 font-black uppercase text-[10px] text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reconciledEntries.map((ae, i) => (
                                        <TableRow key={i} className="border-border">
                                            <TableCell className="px-4 sm:px-10 py-4 sm:py-6 font-bold text-xs">
                                                {new Date(getBRVal(ae, 'reconciled_at') || ae.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="px-4 sm:px-10 py-4 sm:py-6 font-black uppercase text-xs">
                                                {getBRVal(ae, 'notes') || ae.glosa || 'Sin observaciones'}
                                            </TableCell>
                                            <TableCell className="px-4 sm:px-10 py-4 sm:py-6 text-right font-black text-emerald-600 tracking-tighter">
                                                {fCurrency(Number(ae.monto))}
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
