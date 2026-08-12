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

  return (
    <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-border/50 shadow-sm">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 hover:bg-emerald-50 text-emerald-700">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
            {months.find(m => m.value === month)?.label} {year}
          </span>
        </div>

        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 hover:bg-emerald-50 text-emerald-700">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="h-6 w-[1px] bg-border/60 mx-1" />

      <Select id="field_month" name="field_month" value={month} onValueChange={(val) => val && updatePeriod(String(year), val)}>
        <SelectTrigger className="w-[140px] h-10 border-none bg-transparent hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-tight transition-colors">
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border shadow-2xl">
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs font-bold uppercase tracking-tight focus:bg-emerald-50 focus:text-emerald-700">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select id="field_year" name="field_year" value={year} onValueChange={(val) => val && updatePeriod(val, String(month))}>
        <SelectTrigger className="w-[100px] h-10 border-none bg-transparent hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-tight transition-colors">
          <SelectValue placeholder="Año" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border shadow-2xl">
          {years.map((y) => (
            <SelectItem key={y} value={y} className="text-xs font-bold uppercase tracking-tight focus:bg-emerald-50 focus:text-emerald-700">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
