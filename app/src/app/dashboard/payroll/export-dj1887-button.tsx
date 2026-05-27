'use client'

import { useState } from 'react'
import { 
  FileText, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  Calendar, 
  AlertTriangle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportDJ1887Action } from '@/actions/dj_previred_importer'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ExportDJ1887Button() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear - 1)) // El año comercial anterior por defecto

  const handleExport = async (type: 'xml' | 'excel') => {
    setLoading(type)
    try {
      const result = await exportDJ1887Action(parseInt(selectedYear), type)
      
      if (!result.success || !result.base64) {
        toast.error(result.error || `Fallo en la síntesis de la DJ 1887 (${type.toUpperCase()}).`)
        return
      }

      // Convertir base64 de vuelta a binario
      const binaryString = window.atob(result.base64)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const blob = new Blob([bytes], { type: result.mediaType })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename || `DJ1887_${selectedYear}.${type}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Declaración Jurada 1887 (${type.toUpperCase()}) exportada`, {
        description: `Datos consolidados del año comercial ${selectedYear} listos.`,
        icon: <CheckCircle2 className="w-5 h-5 text-indigo-600" />
      })
      setOpen(false)
    } catch (error) {
      toast.error('Error de comunicación con el motor tributario.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        className="border-indigo-200 bg-indigo-50/30 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 font-black uppercase text-xs tracking-widest rounded-[1.5rem] h-11 px-6 shadow-lg shadow-indigo-500/5 transition-all"
      >
        <FileText className="w-4 h-4 mr-2" />
        DJ 1887
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
          <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-indigo-300 to-transparent" />
          
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-xl font-black text-foreground uppercase tracking-tight">
                  Declaración Jurada 1887
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                  EXPORTACIÓN SII Y RESUMEN ANUAL DE CONTROL
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 pt-4 space-y-6">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4 text-xs text-indigo-900 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-indigo-600 shrink-0" />
              <p className="font-medium italic leading-relaxed">
                Esta declaración consolida todas las rentas imponibles, no imponibles, previsiones, salud e impuesto único pagados a su personal durante el año comercial seleccionado.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Año Comercial / Periodo Fiscal
              </label>
              <Select value={selectedYear} onValueChange={(val) => setSelectedYear(val || '')}>
                <SelectTrigger className="h-12 w-full rounded-xl border border-border bg-white px-4 text-xs font-black uppercase tracking-tight shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none">
                  <SelectValue placeholder="Seleccione año" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border rounded-xl">
                  {years.map((y) => (
                    <SelectItem key={y} value={y} className="text-xs font-bold uppercase tracking-tight">
                      Año Comercial {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-6 md:p-8 bg-muted/5 border-t border-border flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              disabled={loading !== null}
              className="text-[10px] font-black uppercase tracking-widest h-12 rounded-xl flex-1 border-2"
              onClick={() => handleExport('excel')}
            >
              {loading === 'excel' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              {loading === 'excel' ? 'GENERANDO...' : 'DESCARGAR CONTROL (EXCEL)'}
            </Button>
            
            <Button
              disabled={loading !== null}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest h-12 px-6 rounded-xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex-1 gap-2"
              onClick={() => handleExport('xml')}
            >
              {loading === 'xml' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {loading === 'xml' ? 'PROCESANDO...' : 'DESCARGAR XML (SII)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
