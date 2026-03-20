'use client'

import { useState } from 'react'
import { Download, Loader2, FileSpreadsheet, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportPreviredAction } from '@/actions/previred'
import { toast } from 'sonner'

export function ExportPreviredButton({ 
  organizationId, 
  periodo 
}: { 
  organizationId: string, 
  periodo: string 
}) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const result = await exportPreviredAction(organizationId, periodo)
      
      if (!result.success || !result.content) {
        toast.error(result.error || 'Fallo en la síntesis del archivo Previred.')
        return
      }

      // Crear y descargar el archivo TXT
      const blob = new Blob([result.content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename || 'previred.txt'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Sincronización Previred exitosa.', {
          description: "Archivo maestro .txt listo para carga en portal.",
          icon: <CheckCircle2 className="w-5 h-5 text-orange-500" />
      })
    } catch (error) {
      toast.error('Error de comunicación con el motor de exportación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={loading}
      className="border-orange-200 bg-orange-50/30 text-orange-700 hover:bg-orange-50 hover:border-orange-300 font-black uppercase text-xs tracking-widest rounded-[1.5rem] h-11 px-6 shadow-lg shadow-orange-500/5 transition-all"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4 mr-2" />
      )}
      Exportar Previred
    </Button>
  )
}
