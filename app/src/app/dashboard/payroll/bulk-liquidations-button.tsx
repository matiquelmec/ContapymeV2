'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { buildLiquidationPDFDocument, getLiquidationPdfFilename, getLiquidationsZipFilename } from '@/lib/payroll/liquidation-pdf'

interface BulkLiquidationsButtonProps {
  organizationId: string
  year: string
  month: string
  count: number
}

export function BulkLiquidationsButton({ organizationId, year, month, count }: BulkLiquidationsButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (count === 0 || downloading) return

    setDownloading(true)
    const toastId = toast.loading('Preparando liquidaciones en PDF...')

    try {
      const supabase = createClient()
      const paddedMonth = month.padStart(2, '0')
      const dateStart = `${year}-${paddedMonth}-01`
      const lastDay = new Date(Number(year), Number(paddedMonth), 0).getDate()
      const dateEnd = `${year}-${paddedMonth}-${lastDay}`

      const [{ data: liquidations, error: liqError }, { data: organization }, { data: settings }] = await Promise.all([
        supabase
          .from('liquidations')
          .select('*, employees(*)')
          .eq('organization_id', organizationId)
          .gte('periodo', dateStart)
          .lte('periodo', dateEnd)
          .order('created_at', { ascending: false }),
        supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single(),
        supabase
          .from('organization_payroll_settings')
          .select('*')
          .eq('organization_id', organizationId)
          .maybeSingle()
      ])

      if (liqError) throw liqError
      if (!liquidations || liquidations.length === 0) {
        toast.error('No hay liquidaciones para descargar.', { id: toastId })
        return
      }

      const zip = new JSZip()

      for (const liquidation of liquidations) {
        const doc = await buildLiquidationPDFDocument({ liquidation, organization, settings })
        const pdfBlob = doc.output('blob')
        zip.file(getLiquidationPdfFilename(liquidation), pdfBlob)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = getLiquidationsZipFilename(year, paddedMonth, organization?.nombre)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast.success(`${liquidations.length} liquidaciones descargadas en ZIP.`, { id: toastId })
    } catch (error: any) {
      console.error('Error descargando liquidaciones:', error)
      toast.error(error?.message || 'No se pudo generar la descarga masiva.', { id: toastId })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={downloading || count === 0}
      onClick={handleDownload}
      className="border-emerald-200 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-black uppercase text-[10px] tracking-widest rounded-2xl h-10 px-4 shadow-lg shadow-emerald-500/5 transition-all gap-2 w-full sm:w-auto"
    >
      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {downloading ? 'Generando ZIP' : 'Descargar PDFs'}
    </Button>
  )
}
