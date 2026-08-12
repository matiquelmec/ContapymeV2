'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateAccountingPeriod, getAccountingPeriods } from '@/actions/accounting-periods'
import { Calendar, ShieldAlert, Lock, Unlock, Loader2 } from 'lucide-react'

interface Period {
  id: string
  ano: number
  mes: number
  status: 'open' | 'closed' | 'locked'
}

interface PeriodsClientProps {
  initialPeriods: Period[]
  activeOrgId: string
  activeOrgName: string
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function PeriodsClient({ initialPeriods, activeOrgId, activeOrgName }: PeriodsClientProps) {
  const [periods, setPeriods] = useState<Period[]>(initialPeriods)
  const [year, setYear] = useState(new Date().getFullYear())
  const [isLoadingYear, setIsLoadingYear] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [updatingMonth, setUpdatingMonth] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoadingYear(true)
    getAccountingPeriods(activeOrgId, year)
      .then(data => {
        if (isMounted) {
          setPeriods(data)
          setIsLoadingYear(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingYear(false)
      })
    return () => { isMounted = false }
  }, [year, activeOrgId])

  const getStatus = (month: number) => {
    const p = periods.find(p => p.mes === month)
    return p ? p.status : 'open' // Abierto por defecto
  }

  const handleStatusChange = async (month: number, newStatus: 'open' | 'closed' | 'locked') => {
    setUpdatingMonth(month)
    startTransition(async () => {
      const res = await updateAccountingPeriod(activeOrgId, year, month, newStatus)
      if (res.success) {
        setPeriods(prev => {
          const idx = prev.findIndex(p => p.mes === month)
          if (idx !== -1) {
            const updated = [...prev]
            updated[idx] = { ...updated[idx], status: newStatus }
            return updated
          } else {
            return [...prev, { id: '', ano: year, mes: month, status: newStatus }]
          }
        })
      } else {
        alert('Error al cambiar el estado del periodo: ' + res.error)
      }
      setUpdatingMonth(null)
    })
  }

  return (
    <div className="space-y-8 pb-10">
      {/* CABECERA PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            Cierre <span className="text-primary italic ml-1">Contable</span>
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-xs mt-1">
            Empresa: <strong className="text-foreground not-italic">{activeOrgName}</strong>
          </p>
        </div>

        {/* SELECTOR DE AÑO */}
        <div className="flex items-center gap-2">
          {isLoadingYear && <Loader2 className="w-4 h-4 text-primary animate-spin mr-1" />}
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Año Fiscal:</span>
          <select id="field_year" name="field_year"
            value={year}
            disabled={isLoadingYear}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 rounded-xl border border-border bg-card px-4 font-black uppercase text-xs tracking-wider text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      {/* GRILLA DE MESES RESPONSIVA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MESES.map((nombreMes, index) => {
          const monthNum = index + 1
          const status = getStatus(monthNum)
          const isCurrentUpdating = updatingMonth === monthNum

          return (
            <Card key={monthNum} className="bg-card border-border shadow-md rounded-[2rem] overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between border-t-4 border-t-primary/10">
              <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">{nombreMes}</CardTitle>
                  <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Período {monthNum}-{year}</CardDescription>
                </div>

                {/* BADGE DE ESTADO */}
                <div className="flex items-center">
                  {isCurrentUpdating ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : status === 'open' ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl font-bold uppercase text-[9px] tracking-wider px-2 py-0.5">
                      Abierto
                    </Badge>
                  ) : status === 'closed' ? (
                    <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl font-bold uppercase text-[9px] tracking-wider px-2 py-0.5">
                      Cerrado
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-xl font-bold uppercase text-[9px] tracking-wider px-2 py-0.5">
                      Bloqueado
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4 flex-grow flex flex-col justify-end">
                {/* BOTONES PREMIUM DE ACCIONES */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={status === 'open' ? 'default' : 'outline'}
                    disabled={isCurrentUpdating}
                    onClick={() => handleStatusChange(monthNum, 'open')}
                    className={`h-9 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all flex items-center justify-center gap-1 ${
                      status === 'open' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Abrir
                  </Button>

                  <Button
                    size="sm"
                    variant={status === 'closed' ? 'default' : 'outline'}
                    disabled={isCurrentUpdating}
                    onClick={() => handleStatusChange(monthNum, 'closed')}
                    className={`h-9 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all flex items-center justify-center gap-1 ${
                      status === 'closed' ? 'bg-amber-600 text-white' : 'hover:bg-amber-50'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Cerrar
                  </Button>

                  <Button
                    size="sm"
                    variant={status === 'locked' ? 'default' : 'outline'}
                    disabled={isCurrentUpdating}
                    onClick={() => handleStatusChange(monthNum, 'locked')}
                    className={`h-9 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all flex items-center justify-center gap-1 ${
                      status === 'locked' ? 'bg-rose-600 text-white' : 'hover:bg-rose-50'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Lock
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
