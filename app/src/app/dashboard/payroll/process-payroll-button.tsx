'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Calculator, 
  Zap, 
  AlertTriangle, 
  Calendar,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { processPayroll } from '@/actions/process_payroll'
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

export function ProcessPayrollButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  
  const chileDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }))
  const [mes, setMes] = useState(String(chileDate.getMonth() + 1).padStart(2, '0'))
  const [ano, setAno] = useState(String(chileDate.getFullYear()))

  async function handleProcess() {
    setLoading(true)
    const periodo = `${ano}-${mes}-01`
    
    try {
        const result = await processPayroll(periodo)
        
        if (!result.success && result.error) {
            toast.error(result.error || "Error en el procesamiento de haberes.")
        } else {
            toast.success(`Cálculo finalizado: ${result.count} liquidaciones generadas para ${mes}/${ano}.`, {
                description: "Los registros han sido inyectados en la base de datos central.",
                icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
            })

            // Alerta de indicadores estimados (fallback de emergencia)
            if (result.indicadores_estimados) {
                setTimeout(() => {
                    toast.warning('Indicadores UF/UTM Estimados', {
                        description: `Se utilizaron valores de emergencia: UF $${result.uf_usada?.toLocaleString('es-CL')} / UTM $${result.utm_usada?.toLocaleString('es-CL')}. Verifique que estos valores estén actualizados en la base de datos.`,
                        duration: 12000,
                        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
                    })
                }, 800)
            }

            // Mostrar advertencias del motor (si las hay)
            if (result.advertencias && result.advertencias.length > 0) {
                setTimeout(() => {
                    result.advertencias.forEach((adv: string) => {
                        toast.warning(adv, { duration: 10000 })
                    })
                }, 1500)
            }

            setOpen(false)

            // Redireccionar al periodo calculado para actualizar la vista
            const params = new URLSearchParams(window.location.search)
            params.set('year', ano)
            params.set('month', mes)
            router.push(`/dashboard/payroll?${params.toString()}`)
            router.refresh()
        }
    } catch (err) {
        toast.error("Fallo crítico en el Motor Algorítmico.")
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
    String(chileDate.getFullYear() - 1),
    String(chileDate.getFullYear()),
    String(chileDate.getFullYear() + 1),
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button 
              className="bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl h-11 px-6 shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all group"
          >
              <Calculator className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              PROCESAR NÓMINA
          </Button>
        }
      />
      
      <DialogContent className="sm:max-w-[450px] bg-card border-slate-200 shadow-2xl rounded-3xl p-0 overflow-hidden">
        <div className="h-2 w-full bg-emerald-500" />
        
        <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Motor de Cálculo</DialogTitle>
                    <DialogDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        PROCESAMIENTO DINÁMICO DE HABERES
                    </DialogDescription>
                </div>
            </div>
        </DialogHeader>

        <div className="px-8 py-6 space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-4 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Selección del Periodo Contable
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mes de Proceso</label>
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
            
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    Al ejecutar el motor, se generarán liquidaciones para <strong>todos</strong> los empleados activos en el periodo seleccionado. Si ya existen liquidaciones, serán actualizadas con los valores actuales del Kardex.
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
                onClick={handleProcess}
                disabled={loading}
                className="bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl h-12 px-8 shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-[0.98] transition-all"
            >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                {loading ? 'PROCESANDO...' : 'EJECUTAR CÁLCULO'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
