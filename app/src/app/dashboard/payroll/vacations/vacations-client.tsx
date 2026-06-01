'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Calendar as CalendarIcon, 
  User, 
  Send, 
  SlidersHorizontal,
  CheckCircle, 
  XCircle, 
  Clock, 
  HelpCircle, 
  Loader2,
  AlertTriangle,
  History,
  PlaneTakeoff,
  BookOpen,
  FileText
} from 'lucide-react'
import {
  VacationRequest,
  createVacationRequest,
  createVacationAdjustment,
  updateVacationStatus,
  getEmployeeVacationSummary,
  getEmployeeVacationLedger,
  getVacationComprobanteData,
  VacationLedgerEntry,
  VacationSummary
} from '@/actions/vacations'
import { buildVacationComprobantePDF, getVacationComprobanteFilename } from '@/lib/payroll/vacation-comprobante-pdf'

interface EmployeeOption {
  id: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  fecha_ingreso?: string
  region?: string
}

interface VacationsClientProps {
  initialRequests: VacationRequest[]
  employees: EmployeeOption[]
  activeOrgId: string
  activeOrgName: string
}

export function VacationsClient({ 
  initialRequests, 
  employees, 
  activeOrgId, 
  activeOrgName 
}: VacationsClientProps) {
  const [requests, setRequests] = useState<VacationRequest[]>(initialRequests)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [selectedEmployeeSummary, setSelectedEmployeeSummary] = useState<VacationSummary>({
    acumulados: 0,
    tomados: 0,
    saldo: 0,
    dias_legales_anuales: 20
  })
  const [selectedEmployeeLedger, setSelectedEmployeeLedger] = useState<VacationLedgerEntry[]>([])
  
  // Formulario de nueva solicitud
  const [newRequest, setNewRequest] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    dias_solicitados: 0,
    comentarios: ''
  })
  const [adjustment, setAdjustment] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    dias: '',
    motivo: 'Saldo inicial por migración',
    comentarios: ''
  })

  const [isPending, startTransition] = useTransition()
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [comprobanteId, setComprobanteId] = useState<string | null>(null)

  // Cargar estadísticas y ledger cuando se selecciona un empleado
  useEffect(() => {
    if (!selectedEmployeeId) {
      setSelectedEmployeeSummary({ acumulados: 0, tomados: 0, saldo: 0, dias_legales_anuales: 20 })
      setSelectedEmployeeLedger([])
      return
    }

    const loadEmployeeData = async () => {
      setLoadingSummary(true)
      try {
        const summary = await getEmployeeVacationSummary(selectedEmployeeId)
        setSelectedEmployeeSummary(summary)

        const ledger = await getEmployeeVacationLedger(activeOrgId, selectedEmployeeId)
        setSelectedEmployeeLedger(ledger)
      } catch (err) {
        console.error(err)
        toast.error('Error al cargar la información del empleado')
      } finally {
        setLoadingSummary(false)
      }
    }

    loadEmployeeData()
  }, [selectedEmployeeId, activeOrgId, requests])

  // Calcular automáticamente la diferencia de días entre fechas
  useEffect(() => {
    if (!newRequest.fecha_inicio || !newRequest.fecha_fin) {
      setNewRequest(prev => ({ ...prev, dias_solicitados: 0 }))
      return
    }

    const start = new Date(newRequest.fecha_inicio + 'T12:00:00')
    const end = new Date(newRequest.fecha_fin + 'T12:00:00')
    
    if (end < start) {
      setNewRequest(prev => ({ ...prev, dias_solicitados: 0 }))
      return
    }

    // Cálculo básico de días hábiles o corridos
    // Para simplificar, calculamos días hábiles de Lunes a Viernes
    let count = 0
    const curDate = new Date(start.getTime())
    while (curDate <= end) {
      const dayOfWeek = curDate.getDay()
      // 0 = Domingo, 6 = Sábado
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      curDate.setDate(curDate.getDate() + 1)
    }

    setNewRequest(prev => ({ ...prev, dias_solicitados: count }))
  }, [newRequest.fecha_inicio, newRequest.fecha_fin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployeeId) {
      toast.error('Por favor, seleccione un colaborador')
      return
    }

    if (newRequest.dias_solicitados <= 0) {
      toast.error('Rango de fechas inválido o sin días hábiles')
      return
    }

    if (newRequest.dias_solicitados > selectedEmployeeSummary.saldo) {
      toast.error(`Exceso de cupo: El saldo disponible (${selectedEmployeeSummary.saldo} días) no cubre los ${newRequest.dias_solicitados} solicitados.`)
      return
    }

    setSubmitting(true)
    try {
      const res = await createVacationRequest({
        organization_id: activeOrgId,
        employee_id: selectedEmployeeId,
        fecha_inicio: newRequest.fecha_inicio,
        fecha_fin: newRequest.fecha_fin,
        dias_solicitados: newRequest.dias_solicitados,
        comentarios: newRequest.comentarios
      })

      if (res.success) {
        toast.success('Solicitud enviada correctamente')
        setNewRequest({
          fecha_inicio: '',
          fecha_fin: '',
          dias_solicitados: 0,
          comentarios: ''
        })
        
        // Recargar solicitudes locales
        const { getVacationRequests } = await import('@/actions/vacations')
        const updatedRequests = await getVacationRequests(activeOrgId)
        setRequests(updatedRequests)
      } else {
        toast.error(`Error: ${res.error}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al registrar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (requestId: string, newStatus: 'approved' | 'rejected' | 'cancelled') => {
    setUpdatingId(requestId)
    startTransition(async () => {
      try {
        const res = await updateVacationStatus(activeOrgId, requestId, newStatus)
        if (res.success) {
          toast.success(`Solicitud de vacaciones actualizada a ${newStatus === 'approved' ? 'Aprobada' : newStatus === 'rejected' ? 'Rechazada' : 'Cancelada'}`)
          
          // Recargar solicitudes locales
          const { getVacationRequests } = await import('@/actions/vacations')
          const updatedRequests = await getVacationRequests(activeOrgId)
          setRequests(updatedRequests)
        } else {
          toast.error(`Error al procesar: ${res.error}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        toast.error('Fallo de integridad: ' + message)
      } finally {
        setUpdatingId(null)
      }
    })
  }

  const refreshEmployeeData = async () => {
    if (!selectedEmployeeId) return

    const [summary, ledger] = await Promise.all([
      getEmployeeVacationSummary(selectedEmployeeId),
      getEmployeeVacationLedger(activeOrgId, selectedEmployeeId)
    ])
    setSelectedEmployeeSummary(summary)
    setSelectedEmployeeLedger(ledger)
  }

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployeeId) {
      toast.error('Seleccione un colaborador antes de ajustar saldo')
      return
    }

    const dias = Number(adjustment.dias)
    if (!Number.isFinite(dias) || dias === 0) {
      toast.error('El ajuste debe ser distinto de cero')
      return
    }

    if (!adjustment.comentarios.trim() || adjustment.comentarios.trim().length < 8) {
      toast.error('Ingrese un comentario de respaldo de al menos 8 caracteres')
      return
    }

    setAdjusting(true)
    try {
      const res = await createVacationAdjustment({
        organization_id: activeOrgId,
        employee_id: selectedEmployeeId,
        fecha: adjustment.fecha,
        dias,
        motivo: adjustment.motivo,
        comentarios: adjustment.comentarios
      })

      if (res.success) {
        toast.success('Ajuste de saldo registrado en la cartola')
        setAdjustment({
          fecha: new Date().toISOString().slice(0, 10),
          dias: '',
          motivo: 'Saldo inicial por migración',
          comentarios: ''
        })
        await refreshEmployeeData()
      } else {
        toast.error(`Error: ${res.error}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al registrar el ajuste')
    } finally {
      setAdjusting(false)
    }
  }

  const handleComprobante = async (requestId: string) => {
    setComprobanteId(requestId)
    try {
      const res = await getVacationComprobanteData(activeOrgId, requestId)
      if (!res.success || !res.data) {
        toast.error(res.error || 'No se pudo generar el comprobante')
        return
      }
      const doc = buildVacationComprobantePDF(res.data)
      doc.save(getVacationComprobanteFilename(res.data))
      toast.success('Comprobante de feriado generado')
    } catch (err) {
      console.error(err)
      toast.error('Error al generar el comprobante')
    } finally {
      setComprobanteId(null)
    }
  }

  const getStatusBadge = (status: VacationRequest['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-600 text-white rounded-xl font-bold uppercase text-[9px] tracking-wider px-3 py-1 flex items-center gap-1 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> Aprobada</Badge>
      case 'rejected':
        return <Badge className="bg-rose-600 text-white rounded-xl font-bold uppercase text-[9px] tracking-wider px-3 py-1 flex items-center gap-1 shadow-sm"><XCircle className="w-3.5 h-3.5" /> Rechazada</Badge>
      case 'cancelled':
        return <Badge className="bg-slate-500 text-white rounded-xl font-bold uppercase text-[9px] tracking-wider px-3 py-1 flex items-center gap-1 shadow-sm"><XCircle className="w-3.5 h-3.5" /> Cancelada</Badge>
      default:
        return <Badge className="bg-amber-500 text-white rounded-xl font-bold uppercase text-[9px] tracking-wider px-3 py-1 flex items-center gap-1 shadow-sm animate-pulse"><Clock className="w-3.5 h-3.5" /> Pendiente</Badge>
    }
  }

  return (
    <div className="space-y-10 pb-10">
      {/* CABECERA PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
              <PlaneTakeoff className="w-8 h-8 text-primary" />
            </div>
            Gestión de <span className="text-primary italic ml-1">Vacaciones</span>
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-xs mt-1">
            Empresa: <strong className="text-foreground not-italic">{activeOrgName}</strong>
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      {/* SELECTOR DE COLABORADOR */}
      <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-4 border-t-primary/10">
        <CardContent className="p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Seleccione un Colaborador</label>
            <div className="relative w-full">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="pl-12 h-14 w-full rounded-3xl border-2 border-border bg-card px-4 font-black uppercase text-xs tracking-wider text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="">Seleccione...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.apellido_paterno} {emp.apellido_materno}, {emp.nombres}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedEmployeeId && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/20 border border-border p-4 rounded-3xl w-full md:w-auto md:min-w-[560px]">
              <div className="text-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Base Legal</span>
                {loadingSummary ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto mt-2" />
                ) : (
                  <span className="text-xl font-black text-indigo-600 font-mono">{selectedEmployeeSummary.dias_legales_anuales}</span>
                )}
              </div>
              <div className="text-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Devengados</span>
                {loadingSummary ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto mt-2" />
                ) : (
                  <span className="text-xl font-black text-emerald-600 font-mono">+{selectedEmployeeSummary.acumulados.toFixed(1)}</span>
                )}
              </div>
              <div className="text-center sm:border-x border-border/80 px-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Días Tomados</span>
                {loadingSummary ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto mt-2" />
                ) : (
                  <span className="text-xl font-black text-rose-600 font-mono">-{selectedEmployeeSummary.tomados.toFixed(1)}</span>
                )}
              </div>
              <div className="text-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Saldo Disponible</span>
                {loadingSummary ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto mt-2" />
                ) : (
                  <span className="text-xl font-black text-primary font-mono">{selectedEmployeeSummary.saldo.toFixed(1)}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULARIO DE SOLICITUD */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10">
            <CardHeader className="bg-muted/5 border-b border-border p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> Solicitar Feriado
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Crea una nueva solicitud al flujo de RRHH</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedEmployeeId ? (
                <div className="py-10 text-center text-muted-foreground/60 font-bold italic text-xs uppercase tracking-widest">
                  Seleccione un colaborador para habilitar el formulario.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Fecha de Inicio</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                      <Input
                        type="date"
                        required
                        value={newRequest.fecha_inicio}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                        className="pl-12 bg-muted/10 border-2 border-border text-foreground font-black text-xs uppercase h-14 rounded-3xl focus:ring-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Fecha de Término</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                      <Input
                        type="date"
                        required
                        value={newRequest.fecha_fin}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, fecha_fin: e.target.value }))}
                        className="pl-12 bg-muted/10 border-2 border-border text-foreground font-black text-xs uppercase h-14 rounded-3xl focus:ring-primary transition-all"
                      />
                    </div>
                  </div>

                  {newRequest.dias_solicitados > 0 && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">Días Solicitados (Háb.):</span>
                      <span className="text-lg font-black text-primary font-mono">{newRequest.dias_solicitados} días</span>
                    </div>
                  )}

                  {newRequest.dias_solicitados > selectedEmployeeSummary.saldo && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-[10px] font-bold uppercase leading-relaxed">
                        Cupo insuficiente: Posee {selectedEmployeeSummary.saldo} días hábiles disponibles.
                        <span className="block mt-1 normal-case text-rose-700/80">
                          Cálculo legal Magallanes: {selectedEmployeeSummary.dias_legales_anuales} días hábiles anuales proporcionales desde la fecha de ingreso.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Comentarios</label>
                    <textarea
                      placeholder="Ej. Viaje familiar, descanso ley..."
                      value={newRequest.comentarios}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, comentarios: e.target.value }))}
                      rows={3}
                      className="w-full bg-muted/10 border-2 border-border text-foreground p-4 text-xs font-bold uppercase rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || newRequest.dias_solicitados <= 0 || newRequest.dias_solicitados > selectedEmployeeSummary.saldo}
                    className="w-full h-14 font-black uppercase text-[10px] tracking-widest rounded-full shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Enviar Solicitud
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-indigo-600/20">
            <CardHeader className="bg-muted/5 border-b border-border p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-600" /> Ajustar Saldo
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">
                Movimiento manual auditado para migraciones o regularizaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedEmployeeId ? (
                <div className="py-10 text-center text-muted-foreground/60 font-bold italic text-xs uppercase tracking-widest">
                  Seleccione un colaborador para habilitar ajustes.
                </div>
              ) : (
                <form onSubmit={handleAdjustmentSubmit} className="space-y-5">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-2xl text-[10px] font-bold uppercase leading-relaxed">
                    Use valores positivos para cargar saldo inicial o abonos. Use valores negativos para regularizar días ya usados antes de migrar.
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Fecha efectiva</label>
                    <Input
                      type="date"
                      required
                      value={adjustment.fecha}
                      onChange={(e) => setAdjustment(prev => ({ ...prev, fecha: e.target.value }))}
                      className="bg-muted/10 border-2 border-border text-foreground font-black text-xs uppercase h-14 rounded-3xl focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Días a ajustar</label>
                    <Input
                      type="number"
                      required
                      step="0.5"
                      placeholder="Ej. 12.5 o -3"
                      value={adjustment.dias}
                      onChange={(e) => setAdjustment(prev => ({ ...prev, dias: e.target.value }))}
                      className="bg-muted/10 border-2 border-border text-foreground font-black text-xs uppercase h-14 rounded-3xl focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Motivo</label>
                    <select
                      value={adjustment.motivo}
                      onChange={(e) => setAdjustment(prev => ({ ...prev, motivo: e.target.value }))}
                      className="h-14 w-full rounded-3xl border-2 border-border bg-card px-4 font-black uppercase text-xs tracking-wider text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                    >
                      <option>Saldo inicial por migración</option>
                      <option>Corrección administrativa</option>
                      <option>Regularización por vacaciones tomadas</option>
                      <option>Ajuste por jornada/contrato</option>
                      <option>Otro</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Comentario obligatorio</label>
                    <textarea
                      required
                      placeholder="Ej. Saldo informado por planilla histórica al migrar..."
                      value={adjustment.comentarios}
                      onChange={(e) => setAdjustment(prev => ({ ...prev, comentarios: e.target.value }))}
                      rows={3}
                      className="w-full bg-muted/10 border-2 border-border text-foreground p-4 text-xs font-bold uppercase rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={adjusting}
                    variant="outline"
                    className="w-full h-14 border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-black uppercase text-[10px] tracking-widest rounded-full gap-2"
                  >
                    {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SlidersHorizontal className="w-4 h-4" />}
                    Registrar Ajuste
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* HISTORIAL Y SOLICITUDES ACTIVAS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10">
            <CardHeader className="bg-muted/5 border-b border-border p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Historial de Solicitudes
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Flujo de aprobaciones de vacaciones</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {requests.length === 0 ? (
                <div className="py-24 text-center text-muted-foreground">
                  <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="font-black uppercase text-xs tracking-widest italic">No se registran solicitudes en el sistema</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60">Colaborador</TableHead>
                        <TableHead className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60">Rango / Periodo</TableHead>
                        <TableHead className="text-center px-6 py-4 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-32">Días Háb.</TableHead>
                        <TableHead className="text-center px-6 py-4 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-36">Estado</TableHead>
                        <TableHead className="text-right px-6 py-4 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-44">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/30">
                      {requests.map(req => (
                        <TableRow key={req.id} className="hover:bg-primary/[0.02] transition-colors group">
                          <TableCell className="px-6 py-4">
                            <span className="text-foreground font-black uppercase text-xs tracking-tight">
                              {req.employees?.apellido_paterno} {req.employees?.nombres}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 font-mono text-[10px] font-black text-muted-foreground/75">
                            {new Date(req.fecha_inicio + 'T12:00:00').toLocaleDateString()} al {new Date(req.fecha_fin + 'T12:00:00').toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-center px-6 py-4 font-mono text-sm font-black text-foreground">
                            {Number(req.dias_solicitados).toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center px-6 py-4">
                            <div className="flex justify-center">{getStatusBadge(req.status)}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {req.status === 'pending' ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusChange(req.id, 'approved')}
                                    disabled={updatingId === req.id || isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-wider rounded-xl h-8 px-3"
                                  >
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(req.id, 'rejected')}
                                    disabled={updatingId === req.id || isPending}
                                    className="border-rose-200 text-rose-600 hover:bg-rose-50 font-black uppercase text-[9px] tracking-wider rounded-xl h-8 px-3"
                                  >
                                    Rechazar
                                  </Button>
                                </>
                              ) : req.status === 'approved' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleComprobante(req.id)}
                                    disabled={comprobanteId === req.id}
                                    className="border-primary/30 text-primary hover:bg-primary/5 font-black uppercase text-[9px] tracking-wider rounded-xl h-8 px-3 gap-1"
                                  >
                                    {comprobanteId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                                    Comprobante
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleStatusChange(req.id, 'cancelled')}
                                    disabled={updatingId === req.id || isPending}
                                    className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 font-black uppercase text-[9px] tracking-wider rounded-xl h-8 px-3"
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/30 font-bold uppercase italic">—</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CUENTA CORRIENTE (LEDGER) DEL TRABAJADOR */}
          {selectedEmployeeId && (
            <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-indigo-600/10">
              <CardHeader className="bg-muted/5 border-b border-border p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" /> Cartola de Cuenta Corriente
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Usos y ajustes sobre el saldo legal proporcional</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {selectedEmployeeLedger.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground/60 italic font-bold text-xs uppercase tracking-widest">
                    No se registran movimientos en el Ledger del empleado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60">Fecha</TableHead>
                          <TableHead className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60">Tipo</TableHead>
                          <TableHead className="text-right px-6 py-4 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60 w-32">Días</TableHead>
                          <TableHead className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.15em] text-foreground/60">Detalle / Concepto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-border/30">
                        {selectedEmployeeLedger.map(ledgerEntry => (
                          <TableRow key={ledgerEntry.id} className="hover:bg-primary/[0.01] transition-colors">
                            <TableCell className="px-6 py-4 font-mono text-[10px] font-black text-muted-foreground/75">
                              {new Date(ledgerEntry.fecha + 'T12:00:00').toLocaleDateString()}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${
                                ledgerEntry.tipo === 'accrual' 
                                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                                  : ledgerEntry.tipo === 'usage'
                                  ? 'bg-rose-50 border border-rose-100 text-rose-700'
                                  : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                              }`}>
                                {ledgerEntry.tipo === 'accrual' ? 'Abono Ley' : ledgerEntry.tipo === 'usage' ? 'Uso Días' : 'Ajuste'}
                              </span>
                            </TableCell>
                            <TableCell className={`text-right px-6 py-4 font-mono text-xs font-black ${Number(ledgerEntry.dias) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {Number(ledgerEntry.dias) >= 0 ? `+${Number(ledgerEntry.dias).toFixed(1)}` : `${Number(ledgerEntry.dias).toFixed(1)}`}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-xs font-bold text-foreground/70 uppercase max-w-xs truncate">
                              {ledgerEntry.comentarios || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
