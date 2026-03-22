'use client'

import { useState } from 'react'
import { 
  Loader2, 
  CheckCircle, 
  Landmark, 
  AlertTriangle, 
  Calendar,
  Wallet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { centralizePayroll } from '@/actions/centralize_payroll'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function CentralizePayrollButton() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  
  const now = new Date()
  const [mes, setMes] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [ano, setAno] = useState(String(now.getFullYear()))

  async function handleCentralize() {
    setLoading(true)
    const periodo = `${ano}-${mes}-01`
    
    try {
        const result = await centralizePayroll(periodo)
        
        if (!result.success) {
            toast.error(result.error || result.message || "Fallo en la Centralización.")
        } else if (result.created === 0) {
            toast.success("Sin datos para centralizar", {
                description: result.message || "No existen liquidaciones en el mes.",
            })
            setOpen(false)
        } else {
            toast.success(`Asiento generado exitosamente en el Libro Mayor.`, {
                description: `El asiento consolida haberes y obligaciones de ${mes}/${ano}.`,
                icon: <CheckCircle className="w-5 h-5 text-indigo-500" />
            })
            setOpen(false)
        }
    } catch (err) {
        toast.error("Fallo crítico al conectar con el backend.")
    } finally {
        setLoading(false)
    }
  }

  const meses = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

  const anos = [
    String(now.getFullYear() - 1),
    String(now.getFullYear()),
    String(now.getFullYear() + 1),
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button 
              variant="outline"
              className="bg-indigo-50 text-indigo-600 border-indigo-200 font-bold uppercase text-xs tracking-widest rounded-2xl h-11 px-6 hover:bg-indigo-600 hover:text-white hover:scale-105 active:scale-95 transition-all group"
          >
              <Landmark className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              CENTRALIZAR
          </Button>
        }
      />
      
      <DialogContent className="sm:max-w-[450px] bg-card border-slate-200 shadow-2xl rounded-3xl p-0 overflow-hidden">
        <div className="h-2 w-full bg-indigo-500" />
        
        <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <Wallet className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Centralización</DialogTitle>
                    <DialogDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        ASIENTO DE REMUNERACIONES
                    </DialogDescription>
                </div>
            </div>
        </DialogHeader>

        <div className="px-8 py-6 space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-4 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Mes Contable a Centralizar
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mes</label>
                        <Select value={mes} onValueChange={(val) => setMes(val || "")}>
                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold uppercase text-xs w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                                {meses.map(m => (
                                    <SelectItem key={m.value} value={m.value} className="text-xs font-bold uppercase">{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Año Fiscal</label>
                        <Select value={ano} onValueChange={(val) => setAno(val || "")}>
                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold uppercase text-xs w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                                {anos.map(a => (
                                    <SelectItem key={a} value={a} className="text-xs font-bold uppercase">{a}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                    Esto leerá todas las liquidaciones generadas en el mes seleccionado y <strong>creará automáticamente el Comprobante (Asiento) de Sueldos</strong> en la contabilidad, enrutando pasivos por retenciones.
                </p>
            </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50/50 border-t border-slate-100 rounded-b-3xl">
            <Button 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600"
            >
                Cancelar
            </Button>
            <Button 
                onClick={handleCentralize}
                disabled={loading}
                className="bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl h-12 px-8 shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-[0.98] transition-all"
            >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Landmark className="w-4 h-4 mr-2" />}
                {loading ? 'CONTABILIZANDO...' : 'CONTABILIZAR'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
