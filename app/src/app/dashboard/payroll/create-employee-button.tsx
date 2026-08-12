'use client'

import { useState } from 'react'
import { UserPlus, Loader2, Contact, Briefcase, CreditCard, HeartPulse, Building2, Calendar as CalendarIcon, Check, DollarSign, Zap, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { createEmployee } from '@/actions/payroll'
import { generateJobDescription, generateWorkSchedule } from '@/actions/ai-assistant'
import { toast } from 'sonner'
import { parseError } from '@/lib/utils/errors'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Bot, RefreshCcw, Clock, AlertCircle, Info } from 'lucide-react'
import { useEffect } from 'react'

export function CreateEmployeeButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargo, setCargo] = useState("")
  const [descripcionCargo, setDescripcionCargo] = useState("")
  const [horasSemanales, setHorasSemanales] = useState(44)
  const [horarioDetalle, setHorarioDetalle] = useState("")
  const [horarioContexto, setHorarioContexto] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isScheduleLoading, setIsScheduleLoading] = useState(false)
  const [targetHoras, setTargetHoras] = useState(42)
  const [targetDias, setTargetDias] = useState(5)
  
  // Estados para inputs corporativos
  const [sueldoBase, setSueldoBase] = useState("500000")
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0])
  
  // Planificador de Jornada Legista
  const [horaEntrada, setHoraEntrada] = useState("08:00")
  const [horaSalida, setHoraSalida] = useState("17:09")
  const [colacionMinutos, setColacionMinutos] = useState(45)
  const [diasSemana, setDiasSemana] = useState<string[]>(['lun', 'mar', 'mie', 'jue', 'vie'])
  const [isArt22, setIsArt22] = useState(false)
  
  // Datos Personales Complementarios
  const [nacionalidad, setNacionalidad] = useState("Chilena")
  const [estadoCivil, setEstadoCivil] = useState("Soltero(a)")
  const [sexo, setSexo] = useState("Masculino")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [direccion, setDireccion] = useState("")
  const [comuna, setComuna] = useState("")
  const [region, setRegion] = useState("")
  const [numeroCargas, setNumeroCargas] = useState(0)
  const [esZonaExtrema, setEsZonaExtrema] = useState(false)
  const [afcActivo, setAfcActivo] = useState(true)
  const [saludSeleccionada, setSaludSeleccionada] = useState("Fonasa")
  const [planSaludUf, setPlanSaludUf] = useState("0")

  // Estados para validación y máscara del RUT Chileno
  const [rut, setRut] = useState("")
  const [rutError, setRutError] = useState<string | null>(null)

  const formatRutString = (value: string) => {
    const cleaned = value.replace(/[^0-9kK]/g, "");
    if (cleaned.length <= 1) return cleaned;
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1).toUpperCase();
    
    let formattedBody = "";
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        formattedBody = "." + formattedBody;
      }
      formattedBody = body[i] + formattedBody;
    }
    return `${formattedBody}-${dv}`;
  };

  const validateRutString = (rutComplete: string): boolean => {
    const cleaned = rutComplete.replace(/[^0-9kK]/g, "");
    if (cleaned.length < 2) return false;
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1).toUpperCase();
    
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const expectedDv = 11 - (sum % 11);
    let calculatedDv = "";
    if (expectedDv === 11) calculatedDv = "0";
    else if (expectedDv === 10) calculatedDv = "K";
    else calculatedDv = String(expectedDv);
    
    return dv === calculatedDv;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatRutString(rawVal);
    setRut(formatted);
    
    if (formatted.length > 3) {
      if (!validateRutString(formatted)) {
        setRutError("RUT Inválido");
      } else {
        setRutError(null);
      }
    } else {
      setRutError(null);
    }
  };

  // Motor de cálculo de jornada legal (Chilerised)
  useEffect(() => {
    if (isArt22) {
      setHorarioDetalle("JORNADA LIBRE SEGÚN EL ARTÍCULO 22 INCISO 2 DEL CÓDIGO DEL TRABAJO.")
      setHorasSemanales(0)
      return
    }

    const tEntrada = horaEntrada.split(':').map(Number)
    const tSalida = horaSalida.split(':').map(Number)
    
    if (tEntrada.length < 2 || tSalida.length < 2) return

    const minEntrada = tEntrada[0] * 60 + (tEntrada[1] || 0)
    const minSalida = tSalida[0] * 60 + (tSalida[1] || 0)
    
    // Horas diarias efectivas
    const minBrutos = minSalida - minEntrada
    const minEfectivos = minBrutos - colacionMinutos
    const horasDiarias = minEfectivos / 60
    
    const horasTotales = horasDiarias * diasSemana.length
    const finalHours = parseFloat(horasTotales.toFixed(1))
    
    setHorasSemanales(finalHours)

    // Autogenerar Cláusula de Contrato Determinística
    const diasStr = diasSemana.map(d => d.toUpperCase()).join(', ')
    const clausula = `JORNADA DE ${finalHours} HORAS SEMANALES DISTRIBUIDAS DE ${diasSemana[0]?.toUpperCase()} A ${diasSemana[diasSemana.length-1]?.toUpperCase()} EN HORARIO DE ${horaEntrada} A ${horaSalida} HORAS, CON INTERRUPCIÓN DE ${colacionMinutos} MINUTOS PARA COLACIÓN.`
    setHorarioDetalle(clausula)

  }, [horaEntrada, horaSalida, colacionMinutos, diasSemana, isArt22])

  const aplicarDistribucionLegal = (horasObj: number, diasObj: number = 5) => {
    const orden = ['lun','mar','mie','jue','vie','sab']
    setDiasSemana(orden.slice(0, diasObj))
    
    // Si la jornada diaria es menor a 5 horas, quizás no es obligatorio 60 min, pero sugerimos 30.
    // Si es una jornada muy corta, 0.
    const horasDiarias = horasObj / diasObj
    const minColacion = horasDiarias > 5 ? 45 : (horasDiarias > 3 ? 30 : 0)
    setColacionMinutos(minColacion)
    
    const minEfectivosDiarios = horasDiarias * 60
    const minBrutosDiarios = minEfectivosDiarios + minColacion
    
    const hEntrada = 9
    const mEntrada = 0
    
    const minSalidaTotales = (hEntrada * 60 + mEntrada) + minBrutosDiarios
    const hSalida = Math.floor(minSalidaTotales / 60)
    const mSalida = Math.round(minSalidaTotales % 60)
    
    setHoraEntrada(`09:00`)
    setHoraSalida(`${String(hSalida).padStart(2, '0')}:${String(mSalida).padStart(2, '0')}`)
    toast.info(`Distribución de ${horasObj}h en ${diasObj} días aplicada.`)
  }

  const toggleDia = (dia: string) => {
    setDiasSemana(prev => 
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia].sort((a,b) => {
        const order=['lun','mar','mie','jue','vie','sab','dom']
        return order.indexOf(a) - order.indexOf(b)
      })
    )
  }

  const handleAiSuggest = async () => {
    if (!cargo) return toast.error("Debe ingresar primero el nombre del cargo.")
    setIsAiLoading(true)
    try {
      const result = await generateJobDescription(cargo, horasSemanales, isArt22)
      setDescripcionCargo(result)
      toast.success("Descripción generada exitosamente.", {
        icon: <Sparkles className="w-4 h-4 text-primary" />
      })
    } catch (err) {
      toast.error("Error al conectar con el Asistente IA.")
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleScheduleSuggest = async () => {
    setIsScheduleLoading(true)
    try {
      const result = await generateWorkSchedule(horasSemanales, horarioContexto)
      setHorarioDetalle(result)
      toast.success("Horario sugerido legalmente.", {
        icon: <Clock className="w-4 h-4 text-primary" />
      })
    } catch (err) {
      toast.error("Error al generar horario.")
    } finally {
      setIsScheduleLoading(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    if (rutError || !validateRutString(rut)) {
      setError("Debe ingresar un RUT válido antes de proceder.")
      toast.error("RUT Inválido. Por favor corríjalo.")
      return
    }
    setLoading(true)
    setError(null)
    const result = await createEmployee(formData)
    
    if (!result.success && result.error) {
      setError(parseError(result.error))
      setLoading(false)
      toast.error(parseError(result.error))
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
        <DialogContent className="sm:max-w-[700px] bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-y-auto max-h-[95vh] ring-1 ring-black/5 scrollbar-hide">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombres" className="text-[10px] font-bold text-muted-foreground">NOMBRES</Label>
                    <Input id="nombres" name="nombres" required className="bg-slate-50/50 border-border rounded-2xl h-14 font-black uppercase text-xs focus:ring-primary shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido_paterno" className="text-[10px] font-bold text-muted-foreground">APELLIDO PATERNO</Label>
                    <Input id="apellido_paterno" name="apellido_paterno" required className="bg-slate-50/50 border-border rounded-2xl h-14 font-black uppercase text-xs focus:ring-primary shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido_materno" className="text-[10px] font-bold text-muted-foreground">APELLIDO MATERNO</Label>
                    <Input id="apellido_materno" name="apellido_materno" required className="bg-slate-50/50 border-border rounded-2xl h-14 font-black uppercase text-xs focus:ring-primary shadow-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="rut" className="text-[10px] font-bold text-muted-foreground">RUT FISCAL</Label>
                      {rutError && (
                        <span className="text-[9px] font-black text-rose-600 uppercase flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 animate-pulse" /> {rutError}
                        </span>
                      )}
                    </div>
                    <Input 
                      id="rut" 
                      name="rut" 
                      placeholder="11.111.111-1" 
                      required 
                      value={rut}
                      onChange={handleRutChange}
                      className={`bg-white border-border rounded-xl h-12 font-black font-mono tracking-tighter text-xs pt-1 focus:ring-primary shadow-sm ${rutError ? 'border-rose-500 ring-rose-500 text-rose-600' : ''}`} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo" className="text-[10px] font-bold text-muted-foreground">CARGO / POSICIÓN</Label>
                    <Input id="cargo" name="cargo" placeholder="Ej: Vendedor" required value={cargo || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCargo(e.target.value)} className="bg-white border-border rounded-xl h-12 font-black uppercase text-xs focus:ring-primary shadow-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="centro_costo" className="text-[10px] font-bold text-muted-foreground">CENTRO DE COSTO</Label>
                    <Input id="centro_costo" name="centro_costo" placeholder="Ej: OPERACIONES" className="bg-white border-border rounded-xl h-12 font-black uppercase text-xs focus:ring-primary shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                   <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-bold text-muted-foreground">EMAIL (CONTACTO)</Label>
                      <Input id="email" name="email" type="email" placeholder="ejemplo@correo.com" className="bg-slate-50/50 border-border rounded-2xl h-14 font-black text-xs lowercase focus:ring-primary" />
                   </div>
                   <div className="space-y-2">
                       <Label htmlFor="phone" className="text-[10px] font-bold text-muted-foreground">CELULAR / WHATSAPP</Label>
                       <Input id="phone" name="phone" placeholder="+56 9 XXXX XXXX" className="bg-slate-50/50 border-border rounded-2xl h-14 font-black text-xs focus:ring-primary" />
                   </div>
                </div>

                {/* NUEVA SECCIÓN: IDENTIDAD PROFESIONAL */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-dashed border-border/50">
                   <div className="space-y-2">
                      <Label htmlFor="nacionalidad" className="text-[10px] font-black text-muted-foreground">NACIONALIDAD</Label>
                      <Input id="nacionalidad" name="nacionalidad" value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className="h-10 bg-white border-border text-[10px] font-bold uppercase" />
                   </div>
                   <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
                     <Label htmlFor="extranjero" className="text-[10px] font-black text-muted-foreground uppercase">Extranjero</Label>
                     <Checkbox id="extranjero" name="extranjero" className="w-5 h-5 rounded-md border-primary/30" />
                   </div>
                   <div className="space-y-2">
                       <Label htmlFor="sexo" className="text-[10px] font-black text-muted-foreground">SEXO</Label>
                       <Select name="sexo" value={sexo} onValueChange={(val) => setSexo(val || "Masculino")}>
                          <SelectTrigger className="h-10 text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="Masculino">Masculino</SelectItem>
                             <SelectItem value="Femenino">Femenino</SelectItem>
                             <SelectItem value="Otro">Otro/No binario</SelectItem>
                          </SelectContent>
                       </Select>
                   </div>
                   <div className="space-y-2">
                       <Label htmlFor="estado_civil" className="text-[10px] font-black text-muted-foreground">ESTADO CIVIL</Label>
                       <Select name="estado_civil" value={estadoCivil} onValueChange={(val) => setEstadoCivil(val || "Soltero(a)")}>
                          <SelectTrigger className="h-10 text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="Soltero(a)">Soltero(a)</SelectItem>
                             <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                             <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                             <SelectItem value="Viudo(a)">Viudo(a)</SelectItem>
                          </SelectContent>
                       </Select>
                   </div>
                   <div className="space-y-2">
                       <Label htmlFor="birth_date" className="text-[10px] font-black text-muted-foreground">FECHA NAC.</Label>
                       <Input id="birth_date" name="birth_date" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="h-10 text-[10px] font-bold" />
                   </div>
                </div>

                {/* NUEVA SECCIÓN: UBICACIÓN RESIDENCIAL */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="md:col-span-1 space-y-2">
                       <Label htmlFor="address" className="text-[10px] font-black text-muted-foreground">DOMICILIO (CALLE Y N°)</Label>
                       <Input id="address" name="address" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="h-10 text-[10px] font-bold uppercase" />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="city" className="text-[10px] font-black text-muted-foreground">COMUNA</Label>
                       <Input id="city" name="city" value={comuna} onChange={(e) => setComuna(e.target.value)} className="h-10 text-[10px] font-bold uppercase" />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="region" className="text-[10px] font-black text-muted-foreground">REGIÓN (EJ: XII)</Label>
                       <Input id="region" name="region" value={region} onChange={(e) => setRegion(e.target.value)} className="h-10 text-[10px] font-bold uppercase" />
                    </div>
                </div>
              </div>

              {/* Sección Jornada Legal - PLANIFICADOR DETERMINÍSTICO */}
              <div className="space-y-6 md:col-span-2 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner">
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> CONFIGURADOR DE JORNADA LEGAL
                    </Label>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200">
                        <Checkbox id="art22" checked={isArt22} onCheckedChange={(val) => setIsArt22(!!val)} className="rounded-md" />
                        <Label htmlFor="art22" className="text-[9px] font-black uppercase text-slate-500 cursor-pointer">Art. 22 Inc. 2</Label>
                    </div>
                </div>

                {!isArt22 ? (
                  <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <Label className="text-[9px] font-black text-primary uppercase flex items-center gap-2">
                                <Zap className="w-4 h-4" /> PRESETS Y JORNADA OBJETIVO
                            </Label>
                            <div className="flex gap-2">
                                {[42, 40, 30].map(h => (
                                    <Button 
                                        key={h}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => aplicarDistribucionLegal(h, 5)}
                                        className="h-8 rounded-lg text-[9px] font-black border-slate-100 px-3 hover:border-primary hover:text-primary transition-all"
                                    >
                                        {h}H
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-slate-100">
                             <div className="space-y-3">
                                <Label className="text-[9px] font-black text-slate-400 uppercase">HORAS TOTALES</Label>
                                <Input id="field_targethoras" name="field_targethoras" 
                                    type="number" 
                                    value={targetHoras} 
                                    onChange={(e) => setTargetHoras(parseInt(e.target.value) || 0)}
                                    className="h-12 rounded-xl font-black text-sm bg-slate-50 border-0 focus:ring-primary shadow-inner"
                                />
                             </div>
                             <div className="space-y-3">
                                <Label className="text-[9px] font-black text-slate-400 uppercase">DÍAS A DISTRIBUIR (MAX 6)</Label>
                                <div className="flex gap-2">
                                    <Input id="field_targetdias" name="field_targetdias" 
                                        type="number" 
                                        min="1" 
                                        max="6" 
                                        value={targetDias} 
                                        onChange={(e) => setTargetDias(parseInt(e.target.value) || 0)}
                                        className="h-12 rounded-xl font-black text-sm bg-slate-50 border-0 focus:ring-primary shadow-inner flex-1"
                                    />
                                    <Button 
                                        type="button"
                                        onClick={() => aplicarDistribucionLegal(targetHoras, targetDias)}
                                        className="h-12 rounded-xl bg-slate-800 text-white font-black text-[10px] uppercase px-5 hover:bg-black transition-all"
                                    >
                                        DISTRIBUIR
                                    </Button>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">HORARIO</Label>
                            <div className="flex items-center gap-2">
                                <Input id="field_horaentrada_00_00" name="field_horaentrada_00_00" type="time" value={horaEntrada || "00:00"} onChange={(e) => setHoraEntrada(e.target.value)} className="h-12 rounded-xl font-black text-xs text-center p-0" />
                                <span className="text-slate-300 font-bold">A</span>
                                <Input id="field_horasalida_00_00" name="field_horasalida_00_00" type="time" value={horaSalida || "00:00"} onChange={(e) => setHoraSalida(e.target.value)} className="h-12 rounded-xl font-black text-xs text-center p-0" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">COLACIÓN (MIN)</Label>
                            <Input id="field_colacionminutos_0" name="field_colacionminutos_0" type="number" step="15" value={colacionMinutos || 0} onChange={(e) => setColacionMinutos(parseInt(e.target.value) || 0)} className="h-12 rounded-xl font-black text-xs text-center" />
                        </div>

                        <div className="space-y-3 text-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <Label className="text-[9px] font-black text-primary uppercase block mb-1">CÁLCULO TOTAL</Label>
                            <div className="text-2xl font-black tracking-tighter text-slate-800 flex items-baseline justify-center gap-1">
                                {horasSemanales}
                                <span className="text-[10px] text-slate-400 font-bold">HRS/SEM</span>
                            </div>
                            {horasSemanales > 42 && (
                                <div className="text-[8px] font-black text-rose-500 uppercase flex items-center justify-center gap-1 animate-bounce mt-1">
                                    <AlertCircle className="w-3 h-3" /> Excede Límite Legal (Escalón 42h)
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">DISTRIBUCIÓN DE DÍAS TRABAJADOS</Label>
                        <div className="flex justify-between gap-2">
                            {['lun','mar','mie','jue','vie','sab','dom'].map(d => (
                                <Button 
                                    key={d} 
                                    type="button" 
                                    onClick={() => toggleDia(d)}
                                    className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${diasSemana.includes(d) ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                                >
                                    {d}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">REDACCIÓN LEGAL DE JORNADA (AUTOGENERADO)</Label>
                        <Textarea 
                            id="horario_detalle"
                            name="horario_detalle"
                            value={horarioDetalle}
                            readOnly
                            className="bg-slate-100/50 border-slate-100 rounded-2xl min-h-[60px] font-bold text-[10px] italic leading-relaxed text-slate-600 focus:ring-0 p-4 border-dashed"
                        />
                        <input type="hidden" name="horas_semanales" value={horasSemanales} />
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="p-4 bg-blue-500/10 rounded-2xl">
                        <Info className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Exención de Jornada — Artículo 22</p>
                        <p className="text-[9px] font-bold text-blue-600/80 leading-relaxed max-w-[300px]">
                            El colaborador quedará excluido de la limitación de jornada ordinaria por no encontrarse bajo fiscalización superior inmediata.
                        </p>
                    </div>
                    <input type="hidden" name="horario_detalle" value={horarioDetalle} />
                    <input type="hidden" name="horas_semanales" value="0" />
                  </div>
                )}
              </div>

              {/* Sección Financiera */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                    <DollarSign className="w-3 h-3" /> ESTRUCTURA SALARIAL
                </Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sueldo_base" className="text-[10px] font-bold text-muted-foreground">SUELDO BASE NOMINAL ($)</Label>
                    <Input 
                      id="sueldo_base" 
                      name="sueldo_base" 
                      type="number" 
                      min="0" 
                      value={sueldoBase} 
                      onChange={(e) => setSueldoBase(e.target.value)} 
                      required 
                      className="bg-slate-50/50 border-border rounded-2xl h-14 font-black font-mono text-sm focus:ring-primary shadow-sm" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 pt-6 border-t border-dashed border-border/50">
                    <div className="space-y-3">
                      <Label htmlFor="asignacion_colacion" className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                         <div className="w-5 h-5 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <Clock className="w-3 h-3 text-orange-600" />
                         </div>
                         Asignación Colación Mensual ($)
                      </Label>
                      <Input id="asignacion_colacion" name="asignacion_colacion" type="number" defaultValue="0" className="bg-slate-50/50 border-border rounded-2xl h-16 font-black font-mono text-base px-6 focus:ring-primary shadow-sm" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="asignacion_movilizacion" className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                         <div className="w-5 h-5 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <MapPin className="w-3 h-3 text-blue-600" />
                         </div>
                         Asignación Movilización Mensual ($)
                      </Label>
                      <Input id="asignacion_movilizacion" name="asignacion_movilizacion" type="number" defaultValue="0" className="bg-slate-50/50 border-border rounded-2xl h-16 font-black font-mono text-base px-6 focus:ring-primary shadow-sm" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="asignacion_viatico" className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                         <div className="w-5 h-5 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                         </div>
                         Asignación Viático Mensual ($)
                      </Label>
                      <Input id="asignacion_viatico" name="asignacion_viatico" type="number" defaultValue="0" className="bg-slate-50/50 border-border rounded-2xl h-16 font-black font-mono text-base px-6 focus:ring-primary shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bono_fijo" className="text-[10px] font-bold text-muted-foreground uppercase">Bono Fijo Mensual ($)</Label>
                    <Input id="bono_fijo" name="bono_fijo" type="number" defaultValue="0" className="bg-slate-50/50 border-border rounded-2xl h-14 font-black font-mono text-sm focus:ring-primary shadow-sm" />
                  </div>
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
                      <SelectItem value="honorarios" className="font-black text-[10px] uppercase">Honorarios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="fecha_ingreso" className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <CalendarIcon className="w-3 h-3 opacity-30" /> FECHA DE INGRESO
                  </Label>
                  <Input id="fecha_ingreso" name="fecha_ingreso" type="date" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} required className="bg-white border-border rounded-xl h-12 font-black text-xs focus:ring-primary shadow-sm" />
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
                          {[
                            { value: 'Modelo', label: 'AFP Modelo', code: '33' },
                            { value: 'Habitat', label: 'AFP Habitat', code: '05' },
                            { value: 'Capital', label: 'AFP Capital', code: '08' },
                            { value: 'Provida', label: 'AFP Provida', code: '07' },
                            { value: 'Cuprum', label: 'AFP Cuprum', code: '02' },
                            { value: 'PlanVital', label: 'AFP PlanVital', code: '29' },
                            { value: 'Uno', label: 'AFP Uno', code: '34' },
                          ].map(afp => (
                            <SelectItem key={afp.value} value={afp.value} className="font-black text-[10px] uppercase">
                              <span className="flex items-center justify-between w-full gap-3">
                                <span>{afp.label}</span>
                                <span className="text-[8px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">Cód. {afp.code}</span>
                              </span>
                            </SelectItem>
                          ))}
                       </SelectContent>
                     </Select>
                    </div>

                    <div className="space-y-2">
                     <Label htmlFor="prevision_salud" className="text-[10px] font-bold text-muted-foreground font-black uppercase">PREVISIÓN DE SALUD</Label>
                     <Select name="prevision_salud" defaultValue="Fonasa" onValueChange={(val) => setSaludSeleccionada(val || "Fonasa")}>
                       <SelectTrigger className="bg-white border-border rounded-xl h-12 font-black uppercase text-[10px] tracking-widest focus:ring-primary shadow-sm">
                         <SelectValue placeholder="Seleccione" />
                       </SelectTrigger>
                       <SelectContent className="bg-white border-border rounded-xl shadow-2xl">
                          {[
                            { value: 'Fonasa', label: 'Fonasa (7% Legal)', code: '07' },
                            { value: 'Consalud', label: 'Isapre Consalud', code: '71' },
                            { value: 'Colmena', label: 'Isapre Colmena', code: '67' },
                            { value: 'CruzBlanca', label: 'Isapre Cruz Blanca', code: '78' },
                            { value: 'Banmedica', label: 'Isapre Banmédica', code: '99' },
                            { value: 'VidaTres', label: 'Isapre Vida Tres', code: '81' },
                            { value: 'NuevaMasvida', label: 'Isapre Nueva Masvida', code: '88' },
                            { value: 'Esencial', label: 'Isapre Esencial', code: '108' },
                          ].map(isapre => (
                            <SelectItem key={isapre.value} value={isapre.value} className="font-black text-[10px] uppercase">
                              <span className="flex items-center justify-between w-full gap-3">
                                <span>{isapre.label}</span>
                                <span className="text-[8px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">Cód. {isapre.code}</span>
                              </span>
                            </SelectItem>
                          ))}
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

              {/* SECCIÓN CARGAS Y AFC — SEGURIDAD SOCIAL PROFESIONAL */}
              <div className="space-y-6 bg-slate-100/50 p-8 rounded-[2rem] border border-slate-200">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                    <HeartPulse className="w-3 h-3 text-rose-500" /> PROTECCIÓN SOCIAL
                </Label>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                       <Label htmlFor="family_allowances" className="text-[9px] font-black text-slate-400 uppercase">CARGAS FAMILIARES</Label>
                       <div className="flex items-center gap-4 pt-1">
                          <Input 
                            id="family_allowances" 
                            name="family_allowances" 
                            type="number" 
                            min="0" 
                            max="10" 
                            value={numeroCargas} 
                            onChange={(e) => setNumeroCargas(parseInt(e.target.value) || 0)}
                            className="w-20 font-black h-10 border-0 bg-slate-50 text-center text-lg" 
                          />
                          <p className="text-[9px] font-bold text-slate-400 italic leading-tight">Válido para asignación familiar.</p>
                       </div>
                   </div>

                   <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                       <Label className="text-[9px] font-black text-slate-400 uppercase">TRAMO ASIGNACIÓN</Label>
                       <Select name="tramo_asignacion" defaultValue="AUTO">
                         <SelectTrigger className="h-10 rounded-xl font-black uppercase text-[10px]">
                           <SelectValue placeholder="Automático" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="AUTO">Automático por renta</SelectItem>
                           <SelectItem value="A">Tramo A</SelectItem>
                           <SelectItem value="B">Tramo B</SelectItem>
                           <SelectItem value="C">Tramo C</SelectItem>
                           <SelectItem value="D">Tramo D</SelectItem>
                         </SelectContent>
                       </Select>
                   </div>

                   <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center overflow-hidden relative">
                       <div className="flex items-center justify-between">
                            <Label htmlFor="afc_active" className="text-[9px] font-black text-slate-400 uppercase">Seguro Cesantía (AFC)</Label>
                            <Checkbox 
                                id="afc_active" 
                                name="afc_active" 
                                checked={afcActivo} 
                                onCheckedChange={(val) => setAfcActivo(!!val)}
                                className="w-5 h-5 rounded-md border-primary/30"
                            />
                       </div>
                       <p className="text-[8px] font-bold text-slate-400 leading-tight">
                           Cálculo porcentual automático según contrato.
                       </p>
                   </div>
                   <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                       <div className="flex items-center justify-between">
                            <Label htmlFor="jornada_parcial" className="text-[9px] font-black text-slate-400 uppercase">Jornada parcial</Label>
                            <Checkbox id="jornada_parcial" name="jornada_parcial" className="w-5 h-5 rounded-md border-primary/30" />
                       </div>
                       <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <Label htmlFor="tiene_semana_corrida" className="text-[9px] font-black text-slate-400 uppercase">Semana corrida</Label>
                            <Checkbox id="tiene_semana_corrida" name="tiene_semana_corrida" className="w-5 h-5 rounded-md border-primary/30" />
                       </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <Label htmlFor="es_zona_extrema" className="text-[9px] font-black text-slate-400 uppercase">Zona extrema</Label>
                    <Checkbox
                      id="es_zona_extrema"
                      name="es_zona_extrema"
                      checked={esZonaExtrema}
                      onCheckedChange={(val) => setEsZonaExtrema(!!val)}
                      className="w-5 h-5 rounded-md border-primary/30"
                    />
                  </div>
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <Label className="text-[9px] font-black text-slate-400 uppercase">Zona</Label>
                    <Select name="zona_extrema" defaultValue="MAGALLANES">
                      <SelectTrigger className="h-10 rounded-xl font-black uppercase text-[10px]" disabled={!esZonaExtrema}>
                        <SelectValue placeholder="Seleccione zona" />
                      </SelectTrigger>
                      <SelectContent>
                        {["ARICA", "TARAPACA", "AYSEN", "MAGALLANES", "CHILOE", "PALENA"].map((zona) => (
                          <SelectItem key={zona} value={zona}>{zona}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-primary/5 p-5 rounded-[1.5rem] border border-primary/10 group">
                  <div className="mt-1">
                    <Checkbox id="gratificacion_legal" name="gratificacion_legal" defaultChecked className="border-primary/30 w-5 h-5 rounded-lg data-[state=checked]:bg-primary" />
                  </div>
                  <Label htmlFor="gratificacion_legal" className="text-[10px] font-black uppercase tracking-tight cursor-pointer text-foreground/70 leading-relaxed italic">
                    Cálculo de Gratificación Legal Automática <br/>
                    <span className="text-primary opacity-60">(Art. 50 Código del Trabajo — Tope 4.75 IMM)</span>
                  </Label>
                </div>
              </div>

              <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-3 h-3 text-primary" /> BANCO Y DATOS PREVISIONALES ADICIONALES
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banco_transferencia" className="text-[9px] font-black text-slate-400 uppercase">Banco</Label>
                    <Input id="banco_transferencia" name="banco_transferencia" className="h-11 rounded-xl font-black uppercase text-[10px]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase">Tipo cuenta</Label>
                    <Select name="tipo_cuenta" defaultValue="vista">
                      <SelectTrigger className="h-11 rounded-xl font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corriente">Corriente</SelectItem>
                        <SelectItem value="vista">Vista</SelectItem>
                        <SelectItem value="ahorro">Ahorro</SelectItem>
                        <SelectItem value="rut">Cuenta RUT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuenta_transferencia" className="text-[9px] font-black text-slate-400 uppercase">Nro. cuenta</Label>
                    <Input id="cuenta_transferencia" name="cuenta_transferencia" className="h-11 rounded-xl font-black text-[10px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fun_isapre" className="text-[9px] font-black text-slate-400 uppercase">FUN / contrato Isapre</Label>
                    <Input id="fun_isapre" name="fun_isapre" className="h-11 rounded-xl font-black uppercase text-[10px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credito_ccaf" className="text-[9px] font-black text-slate-400 uppercase">Crédito CCAF ($)</Label>
                    <Input id="credito_ccaf" name="credito_ccaf" type="number" min="0" defaultValue="0" className="h-11 rounded-xl font-black font-mono text-[10px]" />
                  </div>
                </div>
              </div>

              {/* NUEVA UBICACIÓN: ASISTENTE IA DE FUNCIONES (AL FINAL) */}
              <div className="space-y-4 pt-6 border-t border-dashed border-border">
                  <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Label htmlFor="descripcion_cargo" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Bot className="w-4 h-4" /> ASISTENTE DE REDACCIÓN IA
                        </Label>
                        <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase italic">Genera la descripción legal basada en toda la info superior.</p>
                      </div>
                      <Button 
                          type="button" 
                          size="sm" 
                          onClick={handleAiSuggest}
                          disabled={isAiLoading}
                          className="h-10 bg-primary/10 border border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest px-6 rounded-xl hover:bg-primary/20 transition-all gap-2 shadow-sm"
                      >
                          {isAiLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          REDACCIÓN INTELIGENTE
                      </Button>
                  </div>
                  <Textarea 
                      id="descripcion_cargo" 
                      name="descripcion_cargo" 
                      value={descripcionCargo || ""}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescripcionCargo(e.target.value)}
                      placeholder="La IA redactará aquí las funciones específicas considerando el cargo, jornada y Art. 22..." 
                      className="bg-white border-border rounded-2xl min-h-[140px] font-medium text-xs leading-relaxed focus:ring-primary shadow-xl shadow-slate-200/50 p-6 border-2"
                  />
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
