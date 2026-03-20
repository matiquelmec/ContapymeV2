'use client'

import { useState } from 'react'
import { UserPlus, Loader2, Contact, Briefcase, CreditCard, HeartPulse, Building2, Calendar as CalendarIcon, Check, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { createEmployee } from '@/actions/payroll'
import { toast } from 'sonner'

export function CreateEmployeeButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await createEmployee(formData)
    
    if (!result.success && result.error) {
      setError(result.error)
      setLoading(false)
      toast.error(result.error)
      return
    }
    
    toast.success("Colaborador inyectado correctamente en el Kardex.")
    setOpen(false)
    setLoading(false)
  }

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        className="bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl h-11 px-6 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Nuevo Colaborador
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-500 to-transparent" />
          
          <DialogHeader className="p-10 pb-6 border-b border-border bg-muted/5">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                    <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-0.5">
                    <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Alta de Personal</DialogTitle>
                    <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                        REGISTRO CENTRALIZADO DE CAPITAL HUMANO — MOTOR V2
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <form action={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sección Identidad */}
              <div className="space-y-4 md:col-span-2 border-b border-border pb-6">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Contact className="w-3 h-3" /> IDENTIFICACIÓN BÁSICA
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombres" className="text-[10px] font-bold text-muted-foreground">NOMBRES</Label>
                    <Input id="nombres" name="nombres" required className="bg-white border-border rounded-xl h-12 font-black uppercase text-xs focus:ring-primary shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido_paterno" className="text-[10px] font-bold text-muted-foreground">APELLIDO PATERNO</Label>
                    <Input id="apellido_paterno" name="apellido_paterno" required className="bg-white border-border rounded-xl h-12 font-black uppercase text-xs focus:ring-primary shadow-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="rut" className="text-[10px] font-bold text-muted-foreground">RUT FISCAL</Label>
                    <Input id="rut" name="rut" placeholder="11.111.111-1" required className="bg-white border-border rounded-xl h-12 font-black font-mono tracking-tighter text-xs pt-1 focus:ring-primary shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo" className="text-[10px] font-bold text-muted-foreground">CARGO / POSICIÓN</Label>
                    <Input id="cargo" name="cargo" placeholder="Vendedor" required className="bg-white border-border rounded-xl h-12 font-black uppercase text-xs focus:ring-primary shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Sección Financiera */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                    <DollarSign className="w-3 h-3" /> ESTRUCTURA SALARIAL
                </Label>
                <div className="space-y-2">
                  <Label htmlFor="sueldo_base" className="text-[10px] font-bold text-muted-foreground">SUELDO BASE NOMINAL ($)</Label>
                  <Input id="sueldo_base" name="sueldo_base" type="number" min="0" defaultValue="500000" required className="bg-white border-border rounded-xl h-12 font-black font-mono text-xs focus:ring-primary shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_contrato" className="text-[10px] font-bold text-muted-foreground">TIPO DE CONTRATO</Label>
                  <Select name="tipo_contrato" defaultValue="indefinido">
                    <SelectTrigger className="bg-white border-border rounded-xl h-12 font-black uppercase text-[10px] tracking-widest focus:ring-primary shadow-sm">
                      <SelectValue placeholder="Contrato" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-border rounded-xl shadow-2xl">
                      <SelectItem value="indefinido" className="font-black text-[10px] uppercase">Indefinido</SelectItem>
                      <SelectItem value="plazo_fijo" className="font-black text-[10px] uppercase">Plazo Fijo</SelectItem>
                      <SelectItem value="por_obra" className="font-black text-[10px] uppercase">Por Obra/Faena</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="fecha_ingreso" className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <CalendarIcon className="w-3 h-3 opacity-30" /> FECHA DE INGRESO
                  </Label>
                  <Input id="fecha_ingreso" name="fecha_ingreso" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="bg-white border-border rounded-xl h-12 font-black text-xs focus:ring-primary shadow-sm" />
                </div>
              </div>

              {/* Sección Seguridad Social */}
              <div className="space-y-4 bg-muted/20 p-6 rounded-3xl border border-border">
                <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> SEGURIDAD SOCIAL
                </Label>
                 <div className="space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="afp" className="text-[10px] font-bold text-muted-foreground">INSTITUCIÓN PREVISIONAL (AFP)</Label>
                    <Select name="afp" defaultValue="Habitat">
                      <SelectTrigger className="bg-white border-border rounded-xl h-12 font-black uppercase text-[10px] tracking-widest focus:ring-primary shadow-sm">
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-border rounded-xl shadow-2xl">
                        {['Modelo', 'Habitat', 'Capital', 'Provida', 'Cuprum', 'PlanVital', 'Uno'].map(afp => (
                          <SelectItem key={afp} value={afp} className="font-black text-[10px] uppercase">{afp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prevision_salud" className="text-[10px] font-bold text-muted-foreground font-black uppercase">PREVISIÓN DE SALUD</Label>
                    <Select name="prevision_salud" defaultValue="Fonasa">
                      <SelectTrigger className="bg-white border-border rounded-xl h-12 font-black uppercase text-[10px] tracking-widest focus:ring-primary shadow-sm">
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-border rounded-xl shadow-2xl">
                        <SelectItem value="Fonasa" className="font-black text-[10px] uppercase">Fonasa (7%)</SelectItem>
                        <SelectItem value="Consalud" className="font-black text-[10px] uppercase">Isapre Consalud</SelectItem>
                        <SelectItem value="Colmena" className="font-black text-[10px] uppercase">Isapre Colmena</SelectItem>
                        <SelectItem value="CruzBlanca" className="font-black text-[10px] uppercase">Isapre CruzBlanca</SelectItem>
                        <SelectItem value="Banmedica" className="font-black text-[10px] uppercase">Isapre Banmédica</SelectItem>
                        <SelectItem value="VidaTres" className="font-black text-[10px] uppercase">Isapre VidaTres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                 </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-primary/5 p-5 rounded-[1.5rem] border border-primary/10 shadow-inner group">
              <div className="mt-1">
                <Checkbox id="gratificacion_legal" name="gratificacion_legal" defaultChecked className="border-primary/30 w-5 h-5 rounded-lg data-[state=checked]:bg-primary" />
              </div>
              <Label htmlFor="gratificacion_legal" className="text-[11px] font-black uppercase tracking-tight cursor-pointer text-foreground/70 leading-relaxed italic">
                Cálculo de Gratificación Legal Automática <br/>
                <span className="text-primary opacity-60">(Art. 50 Código del Trabajo — Tope 4.75 IMM)</span>
              </Label>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                </div>
            )}

            <DialogFooter className="md:justify-between items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground h-14 px-8 rounded-2xl transition-all">
                ABORTAR OPERACIÓN
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest h-14 px-12 rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <div className="flex items-center gap-3">CONFIRMAR ALTA <Check className="w-5 h-5" /></div>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
