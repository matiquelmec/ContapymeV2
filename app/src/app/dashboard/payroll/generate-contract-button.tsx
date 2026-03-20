'use client'

import { useState } from 'react'
import { FileText, Loader2, Download, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateContractAction } from '@/actions/documents'
import { toast } from 'sonner'

export function GenerateContractButton({ employeeId }: { employeeId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    
    try {
      const response = await generateContractAction(employeeId)
      
      if (!response.success || !response.base64Doc) {
        toast.error(response.error || 'Fallo en la generación del documento.')
        return
      }

      // Convertir Base64 a Blob
      const byteCharacters = atob(response.base64Doc)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })

      // Descarga
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = response.filename || `Contrato_${employeeId}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success("Contrato generado con éxito.", {
          description: "El archivo .docx ha sido descargado automáticamente.",
          icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />
      })
    } catch (e: any) {
      toast.error("Error crítico al generar el contrato.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
        variant="ghost" 
        onClick={handleDownload} 
        disabled={loading}
        className="h-9 px-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
    >
        {loading ? (
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
        ) : (
            <Download className="w-3.5 h-3.5 mr-2" />
        )}
        Contrato (.docx)
    </Button>
  )
}
