'use client'

import { useState } from 'react'
import { 
  UserPlus, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Calculator, 
  DollarSign, 
  Building2, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  Plus, 
  HeartPulse, 
  X,
  Info,
  ChevronRight,
  Sparkles,
  Search,
  Zap,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  Globe,
  MapPin,
  Phone,
  Mail,
  Edit2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateEmployee } from '@/actions/payroll'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function EditEmployeeButton({ employee }: { employee: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // States from employee data
  const [sueldoBase, setSueldoBase] = useState(employee.sueldo_base?.toString() || "0")
  const [afcActivo, setAfcActivo] = useState(!!employee.afc_active)
  const [numeroCargas, setNumeroCargas] = useState(employee.family_allowances || 0)
  const [fechaIngreso, setFechaIngreso] = useState(employee.fecha_ingreso || new Date().toISOString().split('T')[0])
  const [colacion, setColacion] = useState(employee.asignacion_colacion?.toString() || "0")
  const [movilizacion, setMovilizacion] = useState(employee.asignacion_movilizacion?.toString() || "0")
  const [bonoFijo, setBonoFijo] = useState(employee.bono_fijo?.toString() || "0")
  const [saludSeleccionada, setSaludSeleccionada] = useState(employee.prevision_salud || "Fonasa")
  const [planSaludUf, setPlanSaludUf] = useState(employee.plan_salud_uf?.toString() || "0")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    formData.append('id', employee.id) // Essential for update
    
    try {
      const result = await updateEmployee(formData)
      if (result.success) {
        toast.success("Ficha actualizada con éxito.")
        setOpen(false)
      } else {
        toast.error(result.error || "Fallo en la actualización.")
      }
    } catch (err) {
      toast.error("Error crítico en el proceso de guardado.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setOpen(true)}
          className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all group"
      >
          <Edit2 className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0 border-none bg-white shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] rounded-[2.5rem] overflow-hidden max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header Premium */}
          <div className="bg-slate-900 px-10 py-10 text-white relative flex-shrink-0">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[size:40px_40px] opacity-20" />
            <DialogHeader>
              <div className="flex items-center gap-5 mb-4">
                <div className="p-4 bg-primary rounded-3xl shadow-2xl shadow-primary/40 group-hover:rotate-6 transition-transform">
                  <Edit2 className="w-8 h-8 text-white" />
                </div>
                <div>
                   <DialogTitle className="text-3xl font-black uppercase tracking-tight leading-none mb-1">
                      Editar <span className="text-primary italic">Colaborador</span>
                   </DialogTitle>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        Sincronización de Ficha ID: {employee.id.slice(0,8)}
                   </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="bg-slate-100 p-1.5 rounded-2xl mb-10 h-14 w-full grid grid-cols-3">
                <TabsTrigger value="basic" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">Identidad</TabsTrigger>
                <TabsTrigger value="contract" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">Contrato</TabsTrigger>
                <TabsTrigger value="financial" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">Financiero</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" forceMount className="space-y-8 animate-in fade-in slide-in-from-bottom-2 data-[state=inactive]:hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">RUT Identidad</Label>
                    <Input name="rut" defaultValue={employee.rut} readOnly className="h-14 rounded-2xl bg-slate-50 font-black text-xs border-slate-200" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombres</Label>
                    <Input name="nombres" defaultValue={employee.nombres} required className="h-14 rounded-2xl font-black text-xs uppercase" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Apellido Paterno</Label>
                    <Input name="apellido_paterno" defaultValue={employee.apellido_paterno} required className="h-14 rounded-2xl font-black text-xs uppercase" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Apellido Materno</Label>
                    <Input name="apellido_materno" defaultValue={employee.apellido_materno} className="h-14 rounded-2xl font-black text-xs uppercase" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-dashed border-slate-200">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                            <div className="w-5 h-5 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Mail className="w-3 h-3 text-primary" />
                            </div>
                            Correo Institucional
                        </Label>
                        <Input name="email" type="email" defaultValue={employee.email} className="h-14 rounded-2xl font-bold text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-all shadow-sm" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                            <div className="w-5 h-5 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                <Phone className="w-3 h-3 text-amber-600" />
                            </div>
                            Teléfono Directo
                        </Label>
                        <Input name="phone" defaultValue={employee.phone} className="h-14 rounded-2xl font-bold text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-all shadow-sm" />
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="contract" forceMount className="space-y-8 animate-in fade-in slide-in-from-bottom-2 data-[state=inactive]:hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cargo / Posición</Label>
                    <Input name="cargo" defaultValue={employee.cargo} className="h-12 rounded-xl font-black text-xs" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipo de Contrato</Label>
                    <Select name="tipo_contrato" defaultValue={employee.tipo_contrato || "indefinido"}>
                       <SelectTrigger className="h-12 rounded-xl font-black uppercase text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indefinido">Indefinido</SelectItem>
                        <SelectItem value="plazo_fijo">Plazo Fijo</SelectItem>
                        <SelectItem value="por_obra">Por Obra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha de Ingreso</Label>
                  <Input type="date" name="fecha_ingreso" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} className="h-12 rounded-xl font-black text-xs" />
                </div>
              </TabsContent>

              <TabsContent value="financial" forceMount className="space-y-8 animate-in fade-in slide-in-from-bottom-2 data-[state=inactive]:hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                          <DollarSign className="w-3 h-3" /> Remuneración Fija
                      </Label>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Sueldo Base ($)</Label>
                          <Input name="sueldo_base" type="number" value={sueldoBase} onChange={(e) => setSueldoBase(e.target.value)} className="h-14 rounded-2xl font-black font-mono text-sm border-emerald-100 bg-emerald-50/10 focus:bg-white shadow-sm" />
                        </div>
                        <div className="grid grid-cols-1 gap-6 pt-6 border-t border-dashed border-border/50">
                           <div className="space-y-3">
                            <Label htmlFor="asignacion_colacion" className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                               <div className="w-5 h-5 bg-orange-500/10 rounded-lg flex items-center justify-center">
                                  <Clock className="w-3 h-3 text-orange-600" />
                               </div>
                               Asignación Colación Mensual ($)
                            </Label>
                            <Input id="asignacion_colacion" name="asignacion_colacion" type="number" value={colacion} onChange={(e) => setColacion(e.target.value)} className="bg-slate-50/50 border-border rounded-2xl h-16 font-black font-mono text-base px-6 focus:ring-primary shadow-sm" />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="asignacion_movilizacion" className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                               <div className="w-5 h-5 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                  <MapPin className="w-3 h-3 text-blue-600" />
                               </div>
                               Asignación Movilización Mensual ($)
                            </Label>
                            <Input id="asignacion_movilizacion" name="asignacion_movilizacion" type="number" value={movilizacion} onChange={(e) => setMovilizacion(e.target.value)} className="bg-slate-50/50 border-border rounded-2xl h-16 font-black font-mono text-base px-6 focus:ring-primary shadow-sm" />
                          </div>
                        </div>
                        <div className="space-y-2 pb-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bono Fijo Mensual ($)</Label>
                            <Input name="bono_fijo" type="number" value={bonoFijo} onChange={(e) => setBonoFijo(e.target.value)} className="h-14 rounded-2xl font-black font-mono text-sm shadow-sm" />
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                          <Building2 className="w-3 h-3" /> Seguridad Social
                      </Label>
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase">AFP</Label>
                            <Select name="afp" defaultValue={employee.afp || "Habitat"}>
                               <SelectTrigger className="h-12 rounded-xl font-black uppercase text-[10px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['Modelo', 'Habitat', 'Capital', 'Provida', 'Cuprum', 'PlanVital', 'Uno'].map(afp => (
                                  <SelectItem key={afp} value={afp}>{afp}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase">Salud</Label>
                            <Select 
                              name="prevision_salud" 
                              defaultValue={saludSeleccionada}
                              onValueChange={(val) => setSaludSeleccionada(val)}
                            >
                               <SelectTrigger className="h-12 rounded-xl font-black uppercase text-[10px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Fonasa">Fonasa</SelectItem>
                                <SelectItem value="Consalud">Isapre Consalud</SelectItem>
                                <SelectItem value="Colmena">Isapre Colmena</SelectItem>
                                <SelectItem value="CruzBlanca">Isapre Cruz Blanca</SelectItem>
                                <SelectItem value="Banmedica">Isapre Banmédica</SelectItem>
                                <SelectItem value="VidaTres">Isapre Vida Tres</SelectItem>
                                <SelectItem value="NuevaMasvida">Isapre Nueva Masvida</SelectItem>
                              </SelectContent>
                            </Select>
                         </div>
                         {saludSeleccionada !== "Fonasa" && (
                           <div className="space-y-2 p-4 bg-blue-50/80 rounded-2xl border-2 border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                             <Label className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-2">
                               <HeartPulse className="w-3 h-3" /> Plan Isapre (UF/mes)
                             </Label>
                             <Input 
                               name="plan_salud_uf" 
                               type="number" 
                               step="0.01"
                               value={planSaludUf} 
                               onChange={(e) => setPlanSaludUf(e.target.value)}
                               placeholder="Ej: 3.5" 
                               className="h-12 rounded-xl font-black font-mono text-sm bg-white border-blue-200 focus:ring-blue-300 shadow-sm" 
                             />
                             <p className="text-[9px] text-blue-500 italic mt-1 ml-1">
                               Valor del plan pactado con la Isapre. Si el 7% legal no lo cubre, la diferencia se descuenta automáticamente.
                             </p>
                           </div>
                         )}
                         {saludSeleccionada === "Fonasa" && (
                           <input type="hidden" name="plan_salud_uf" value="0" />
                         )}
                      </div>
                   </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-8 bg-slate-50 flex-shrink-0">
             <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all"
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
