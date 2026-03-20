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
import { calculateTerminationAction } from '@/actions/terminations'
import { toast } from 'sonner'

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
  const [fechaTermino, setFechaTermino] = useState(new Date().toISOString().split('T')[0])
  const [causal, setCausal] = useState('Art. 161 - Necesidades de la empresa')
  const [avisoPrevio, setAvisoPrevio] = useState(true)
  const [diasVacaciones, setDiasVacaciones] = useState(0)
  const [horasExtras, setHorasExtras] = useState(0)
  const [otrosBonos, setOtrosBonos] = useState(0)

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
            className="h-9 px-4 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
          >
            <UserMinus className="w-3.5 h-3.5 mr-2" />
            Desvincular
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[550px] bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
        <div className="h-2 w-full bg-gradient-to-r from-rose-600 via-rose-400 to-transparent" />
        
        <DialogHeader className="p-10 pb-6 border-b border-border bg-muted/5">
          <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <FileWarning className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-0.5">
                  <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Cálculo de Finiquito</DialogTitle>
                  <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                      PROCESO LEGAL DE DESVINCULACIÓN — {employeeName}
                  </DialogDescription>
              </div>
          </div>
        </DialogHeader>
        
        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
                    <p className="text-[11px] text-amber-800 font-bold leading-relaxed italic">
                        Atención: Esta acción proyectará las indemnizaciones por años de servicio y vacaciones proporcionales según la legislación vigente.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="w-3 h-3 opacity-40" /> Fecha de Término
              </Label>
              <Input 
                id="date" 
                type="date" 
                value={fechaTermino} 
                onChange={(e) => setFechaTermino(e.target.value)}
                className="bg-white border-border rounded-xl h-12 font-black text-xs focus:ring-rose-500 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="causal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Gavel className="w-3 h-3 opacity-40" /> Causal Legal
              </Label>
              <Input 
                id="causal" 
                placeholder="Art. 161 - Necesidades..."
                value={causal}
                onChange={(e) => setCausal(e.target.value)}
                className="bg-white border-border rounded-xl h-12 font-black uppercase text-[10px] tracking-tight focus:ring-rose-500 shadow-sm"
              />
            </div>

            <div className="md:col-span-2 py-4 border-y border-border/50">
                <div className="flex items-start space-x-4 bg-rose-50/50 p-5 rounded-2xl border border-rose-100 group">
                    <div className="mt-1">
                        <Checkbox 
                        id="aviso" 
                        checked={avisoPrevio}
                        onCheckedChange={(checked) => setAvisoPrevio(checked as boolean)}
                        className="border-rose-300 w-5 h-5 rounded-lg data-[state=checked]:bg-rose-600"
                        />
                    </div>
                    <Label htmlFor="aviso" className="text-[11px] font-black uppercase tracking-tight cursor-pointer text-foreground/70 leading-relaxed italic">
                        ¿Se cursó carta de aviso con 30 días de antelación? <br/>
                        <span className="text-rose-600 opacity-60">(En caso contrario se incluirá indemnización sustitutiva)</span>
                    </Label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="vacaciones" className="text-[10px] font-bold text-muted-foreground uppercase">Vacaciones Proporcionales (Días)</Label>
                <Input 
                  id="vacaciones" 
                  type="number" 
                  min="0"
                  value={diasVacaciones} 
                  onChange={(e) => setDiasVacaciones(Number(e.target.value))}
                  className="bg-white border-border rounded-xl h-12 font-black text-xs focus:ring-rose-500 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horasExtras" className="text-[10px] font-bold text-muted-foreground uppercase">H.E. Pendientes ($)</Label>
                <Input 
                  id="horasExtras" 
                  type="number" 
                  min="0"
                  value={horasExtras} 
                  onChange={(e) => setHorasExtras(Number(e.target.value))}
                  className="bg-white border-border rounded-xl h-12 font-black text-xs focus:ring-rose-500 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-10 pt-0 flex flex-col md:flex-row gap-4">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex-1 h-14 rounded-2xl">
            CANCELAR
          </Button>
          <Button 
            className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs tracking-widest h-14 px-12 rounded-[1.5rem] shadow-2xl shadow-rose-600/30 hover:scale-[1.03] active:scale-95 transition-all flex-1" 
            onClick={handleTerminate}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "PROCESAR FINIQUITO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
