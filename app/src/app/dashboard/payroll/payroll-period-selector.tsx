'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PayrollPeriodSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Normalizar la fecha actual a la zona horaria de Chile para evitar desfases de hidratación (UTC vs Local)
  const chileDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }))
  const currentYearVal = chileDate.getFullYear()
  const year = searchParams.get('year') ?? currentYearVal.toString()
  const month = searchParams.get('month') ?? (chileDate.getMonth() + 1).toString().padStart(2, '0')

  const years = Array.from({ length: 5 }, (_, i) => (currentYearVal - 2 + i).toString())
  const months = [
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

  const updatePeriod = (newYear: string, newMonth: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('year', newYear)
    params.set('month', newMonth)
    router.push(`/dashboard/payroll?${params.toString()}`, { scroll: false })
  }

  const handlePrevMonth = () => {
    let m = parseInt(month) - 1
    let y = parseInt(year)
    if (m < 1) {
      m = 12
      y--
    }
    updatePeriod(y.toString(), m.toString().padStart(2, '0'))
  }

  const handleNextMonth = () => {
    let m = parseInt(month) + 1
    let y = parseInt(year)
    if (m > 12) {
      m = 1
      y++
    }
    updatePeriod(y.toString(), m.toString().padStart(2, '0'))
  }

  const currentMonthLabel = months.find(m => m.value === month)?.label || 'Agosto'

  return (
    <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm p-1.5 rounded-2xl border border-border/60 shadow-xs">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handlePrevMonth} 
        className="h-8 w-8 hover:bg-emerald-50 text-emerald-700 rounded-xl"
        title="Mes Anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Selector de Mes */}
      <Select id="field_month" name="field_month" value={month} onValueChange={(val) => val && updatePeriod(String(year), val)}>
        <SelectTrigger className="h-8 border-none bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-950 rounded-xl font-black text-xs uppercase tracking-wider px-3 gap-1.5 transition-colors cursor-pointer">
          <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>{currentMonthLabel}</span>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-border shadow-2xl">
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs font-bold uppercase tracking-tight focus:bg-emerald-50 focus:text-emerald-700">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Selector de Año */}
      <Select id="field_year" name="field_year" value={year} onValueChange={(val) => val && updatePeriod(val, String(month))}>
        <SelectTrigger className="h-8 border-none bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-xs tracking-wider px-2.5 transition-colors cursor-pointer">
          <span>{year}</span>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-border shadow-2xl">
          {years.map((y) => (
            <SelectItem key={y} value={y} className="text-xs font-bold uppercase tracking-tight focus:bg-emerald-50 focus:text-emerald-700">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleNextMonth} 
        className="h-8 w-8 hover:bg-emerald-50 text-emerald-700 rounded-xl"
        title="Mes Siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
