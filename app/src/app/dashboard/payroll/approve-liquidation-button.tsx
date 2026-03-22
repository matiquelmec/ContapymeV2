'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateLiquidationStatus } from '@/actions/payroll'
import { toast } from 'sonner'

export function ApproveLiquidationButton({ id, employeeName }: { id: string, employeeName: string }) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    try {
      const res = await updateLiquidationStatus(id, 'aprobada')
      if (res.success) {
        toast.success(`Liquidación de ${employeeName} aprobada.`)
      } else {
        toast.error(res.error || 'Error al aprobar')
      }
    } catch (error) {
      toast.error('Fallo en la conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleApprove}
      disabled={loading}
      className="h-8 w-8 hover:bg-emerald-600/10 text-emerald-600"
      title="Aprobar Liquidación"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
    </Button>
  )
}
