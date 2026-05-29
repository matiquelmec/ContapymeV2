'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { sendPayrollLiquidationsByEmailAction } from '@/actions/payroll-email'

interface BulkEmailLiquidationsButtonProps {
  organizationId: string
  year: string
  month: string
  count: number
}

export function BulkEmailLiquidationsButton({ organizationId, year, month, count }: BulkEmailLiquidationsButtonProps) {
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (count === 0 || sending) return

    setSending(true)
    const toastId = toast.loading('Preparando envio masivo de liquidaciones...')

    try {
      const result = await sendPayrollLiquidationsByEmailAction({ organizationId, year, month })

      if (result.success) {
        toast.success(result.message, { id: toastId })
      } else {
        toast.warning(result.message, { id: toastId })
      }
    } catch (error: any) {
      console.error('Error enviando liquidaciones:', error)
      toast.error(error?.message || 'No se pudo enviar el correo masivo.', { id: toastId })
    } finally {
      setSending(false)
    }
  }

  return (
    <Button
      type="button"
      disabled={sending || count === 0}
      onClick={handleSend}
      className="border-blue-200 bg-blue-50/40 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-black uppercase text-[10px] tracking-widest rounded-2xl h-10 px-4 shadow-lg shadow-blue-500/5 transition-all gap-2 w-full sm:w-auto"
    >
      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
      {sending ? 'Enviando correos' : 'Enviar correos'}
    </Button>
  )
}
