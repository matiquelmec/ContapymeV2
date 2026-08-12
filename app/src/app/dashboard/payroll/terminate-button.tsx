'use client'

import { useState } from 'react'
import { UserMinus, Loader2, AlertTriangle, Calendar as CalendarIcon, FileWarning, Gavel, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { calculateTerminationAction, getTerminationCausesAction } from '@/actions/terminations'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function TerminateEmployeeButton({ 
  employeeId, 
  employeeName,
  organizationId 
}: { 
  employeeId: string, 
  employeeName: string,
  organizationId: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [causes, setCauses] = useState<any[]>([])
  const [fechaTermino, setFechaTermino] = useState(new Date().toISOString().split('T')[0])
  const [causal, setCausal] = useState('161-1')
  const [avisoPrevio, setAvisoPrevio] = useState(true)
  const [diasVacaciones, setDiasVacaciones] = useState(0)
  const [horasExtras, setHorasExtras] = useState(0)
  const [otrosBonos, setOtrosBonos] = useState(0)

  useEffect(() => {
    if (open) {
      getTerminationCausesAction().then(res => {
        if (res.success) {
          setCauses(res.data)
        }
      })
    }
  }, [open])

  const handleTerminate = async () => {
    setLoading(true)
    try {
      const result = await calculateTerminationAction({
        employee_id: employeeId,
        organization_id: organizationId,
        fecha_termino: fechaTermino,
        causal_despido: causal,
        aviso_previo: avisoPrevio,
        dias_vacaciones_tomados: diasVacaciones,
        pending_overtime_amount: horasExtras,
        other_bonuses: otrosBonos
      })
      
      if (result.success) {
        toast.success(`Finiquito proyectado para ${employeeName}`, {
            description: "El motor legal ha procesado las indemnizaciones correspondientes.",
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        })
        setOpen(false)
      } else {
        toast.error(result.error || 'Error al calcular finiquito')
      }
    } catch (error) {
      toast.error('Fallo en la conexión con el motor de cálculo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 px-4 text-rose-600 hover:text-white hover:bg-rose-600 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all duration-300 border border-transparent hover:border-rose-400 group shadow-sm active:scale-95"
          >
            <UserMinus className="w-3.5 h-3.5 mr-2 group-hover:scale-125 transition-transform duration-300" />
            Desvincular
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[600px] bg-card border-border shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] rounded-[3rem] p-0 ring-1 ring-black/5 animate-in slide-in-from-bottom-5 duration-500">
        <div className="h-4 w-full bg-gradient-to-r from-rose-600 via-rose-300 to-transparent rounded-t-[3rem]" />
        
        <DialogHeader className="p-10 pb-8 border-b border-border/40 bg-muted/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
              <FileWarning className="w-24 h-24 text-rose-600 rotate-12" />
          </div>
          <div className="flex items-center gap-6 relative z-10">
              <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-inner">
                  <FileWarning className="w-8 h-8 text-rose-600 drop-shadow-sm" />
              </div>
              <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">Gestión Legal</DialogTitle>
                  <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] italic opacity-70">
                      DESVINCULACIÓN ESTRATÉGICA — {employeeName}
                  </DialogDescription>
              </div>
          </div>
        </DialogHeader>
        
        <div className="p-10 space-y-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-[0.98]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 md:col-span-2">
                <div className="p-5 bg-amber-500/5 backdrop-blur-md border border-amber-500/20 rounded-[1.5rem] flex items-start gap-4 shadow-sm group hover:border-amber-500/40 transition-colors">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    </div>
                    <p className="text-[11px] text-amber-900/80 font-bold leading-relaxed italic pr-4">
                        <span className="text-amber-600 font-black uppercase tracking-widest mr-2 underline underline-offset-4">Cláusula de Riesgo:</span>
                        Esta acción proyectará las indemnizaciones por años de servicio y vacaciones proporcionales según el Código del Trabajo.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2 ml-1">
                <CalendarIcon className="w-3.5 h-3.5 text-rose-500/50" /> Fecha de Término
              </Label>
              <div className="relative group">
                  <Input 
                    id="date" 
                    type="date" 
                    value={fechaTermino} 
                    onChange={(e) => setFechaTermino(e.target.value)}
                    className="bg-muted/10 border-border/40 hover:border-rose-500/30 rounded-2xl h-14 font-black text-sm focus:ring-rose-500 focus:bg-white transition-all shadow-sm"
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-rose-500/0 group-hover:ring-rose-500/10 pointer-events-none transition-all" />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="causal" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2 ml-1">
                <Gavel className="w-3.5 h-3.5 text-rose-500/50" /> Causal Aplicada
              </Label>
              <Select id="field_causal" name="field_causal" value={causal} onValueChange={(v) => setCausal(v || '')}>
                <SelectTrigger className="bg-muted/10 border-border/40 hover:border-rose-500/30 rounded-2xl h-14 font-black uppercase text-[10px] tracking-tight focus:ring-rose-500 transition-all shadow-sm px-6">
                  <SelectValue placeholder="Seleccione causal" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} sideOffset={8} className="rounded-2xl border-border/40 max-h-[450px] min-w-[500px] w-auto shadow-2xl p-2 z-[100]">
                  {causes.length > 0 ? (
                    causes.map((c) => (
                      <SelectItem key={c.article_code} value={c.article_code} className="font-bold text-[10px] uppercase py-4 border-b border-muted/20 last:border-0 hover:bg-rose-50 transition-colors">
                        <span className="text-rose-600 mr-2 shrink-0">{c.article_code}</span> — <span className="flex-1">{c.article_name}</span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="161-1" className="font-bold text-[10px]">
                      161-1 — NECESIDADES DE LA EMPRESA
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
                <div className="flex items-center space-x-6 bg-gradient-to-r from-rose-50/80 to-transparent p-6 rounded-[1.5rem] border border-rose-100 group hover:shadow-md hover:border-rose-200 transition-all">
                    <div className="mt-0.5 relative">
                        <Checkbox 
                        id="aviso" 
                        checked={avisoPrevio}
                        onCheckedChange={(checked) => setAvisoPrevio(checked as boolean)}
                        className="border-rose-300 w-6 h-6 rounded-lg data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600 transition-colors shadow-sm"
                        />
                    </div>
                    <Label htmlFor="aviso" className="text-[11px] font-black uppercase tracking-tight cursor-pointer text-foreground/70 leading-relaxed italic flex-1">
                        ¿Se cursó carta de aviso con 30 días de antelación? <br/>
                        <span className="text-rose-600 opacity-60 font-bold uppercase text-[9px] tracking-[0.1em]">Cláusula 161: Evita indemnización sustitutiva de aviso previo.</span>
                    </Label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2 pt-2">
              <div className="space-y-3">
                <Label htmlFor="vacaciones" className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Vacaciones Pendientes
                </Label>
                <div className="relative">
                    <Input 
                      id="vacaciones" 
                      type="number" 
                      min="0"
                      value={diasVacaciones} 
                      onChange={(e) => setDiasVacaciones(Number(e.target.value))}
                      className="bg-muted/10 border-border/40 rounded-2xl h-14 font-black text-sm focus:ring-rose-500 focus:bg-white pl-10"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 font-black text-[10px] uppercase">Días</span>
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="horasExtras" className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> H.E. Adicionales
                </Label>
                <div className="relative">
                    <Input 
                      id="horasExtras" 
                      type="number" 
                      min="0"
                      value={horasExtras} 
                      onChange={(e) => setHorasExtras(Number(e.target.value))}
                      className="bg-muted/10 border-border/40 rounded-2xl h-14 font-black text-sm focus:ring-rose-500 focus:bg-white pl-10"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 font-black text-[10px] uppercase">$</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-10 pt-4 flex flex-col md:flex-row gap-5 bg-muted/5">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)} 
            disabled={loading} 
            className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex-1 h-16 rounded-[1.5rem]"
          >
            CANCELAR PROCESO
          </Button>
          <Button 
            className="relative bg-gradient-to-r from-rose-600 to-rose-400 hover:from-rose-700 hover:to-rose-500 text-white font-black uppercase text-xs tracking-[0.2em] h-16 px-16 rounded-[1.8rem] shadow-[0_20px_40px_-10px_rgba(225,29,72,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(225,29,72,0.5)] hover:scale-[1.03] active:scale-95 transition-all flex-[1.5] group overflow-hidden" 
            onClick={handleTerminate}
            disabled={loading}
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "GENERAR CÁLCULO LEGAL"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  )
}
