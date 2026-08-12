'use client'

import React, { useState, useRef } from 'react'
import { 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileWarning 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadPreviredPDFAction } from '@/actions/dj_previred_importer'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ImportPreviredPDFButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Archivo no válido. Por favor suba un archivo PDF.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadPreviredPDFAction(formData)

      if (result.success) {
        toast.success(`Importación Previred exitosa: ${result.periodo}`, {
          description: `${result.message} (${result.empleados_creados} nuevos empleados, ${result.liquidaciones_creadas} liquidaciones).`,
          icon: <CheckCircle2 className="w-5 h-5 text-teal-600" />
        })
        setOpen(false)
        // Recargar la página para ver los datos inyectados
        window.location.reload()
      } else {
        toast.error(result.error || 'Error al procesar el PDF de cotizaciones.')
      }
    } catch (error) {
      toast.error('Error de red al subir el PDF de cotizaciones.')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        className="border-teal-200 bg-teal-50/30 text-teal-700 hover:bg-teal-50 hover:border-teal-300 font-black uppercase text-xs tracking-widest rounded-[1.5rem] h-11 px-6 shadow-lg shadow-teal-500/5 transition-all"
      >
        <Upload className="w-4 h-4 mr-2" />
        Importar Previred PDF
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
          <div className="h-2 w-full bg-gradient-to-r from-teal-600 via-teal-300 to-transparent" />
          
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-100">
                <Upload className="h-6 w-6 text-teal-600" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-xl font-black text-foreground uppercase tracking-tight">
                  Importador de Cotizaciones
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                  INYECCIÓN MASIVA HISTÓRICA DESDE PDF PREVIRED
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 pt-4 space-y-6">
            <div className="rounded-2xl border border-teal-100 bg-teal-50/20 p-4 text-xs text-teal-900 flex gap-3">
              <AlertCircle className="h-5 w-5 text-teal-600 shrink-0" />
              <p className="font-medium italic leading-relaxed">
                Suba el PDF de &quot;Detalle de Cotizaciones&quot; mensual descargado desde Previred. El motor extraerá y creará automáticamente las fichas de los trabajadores y sus liquidaciones históricas asociadas a ese periodo.
              </p>
            </div>

            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[2rem] p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? 'border-teal-500 bg-teal-50/40 scale-95' 
                  : 'border-border bg-muted/5 hover:border-teal-300 hover:bg-teal-50/10'
              }`}
              onClick={onButtonClick}
            >
              <input id="import_previred_button_input_1" name="import_previred_button_input_1" 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".pdf"
                onChange={handleFileChange}
                disabled={loading}
              />
              
              {loading ? (
                <div className="space-y-3">
                  <Loader2 className="h-10 w-10 animate-spin text-teal-600 mx-auto" />
                  <p className="text-xs font-black uppercase tracking-widest text-teal-700 italic">
                    Analizando y procesando documento...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-full border shadow-sm w-16 h-16 flex items-center justify-center mx-auto text-teal-600">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-foreground">
                      Arrastre el PDF de Previred aquí
                    </p>
                    <p className="text-[10px] text-muted-foreground font-bold italic mt-1">
                      o haga clic para seleccionar archivo de su computador
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/5 border-t border-border">
            <Button
              variant="outline"
              disabled={loading}
              className="text-[10px] font-black uppercase tracking-widest h-12 w-full rounded-xl"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
