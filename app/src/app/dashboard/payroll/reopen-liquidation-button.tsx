'use client'

import { useState } from 'react'
import { RotateCcw, Loader2, Unlock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { revertLiquidationToDraft } from '@/actions/payroll'
import { toast } from 'sonner'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"

interface ReopenLiquidationButtonProps {
  id: string
  employeeName: string
}

export function ReopenLiquidationButton({ id, employeeName }: ReopenLiquidationButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  const handleRevert = async () => {
    setLoading(true)
    try {
      const res = await revertLiquidationToDraft(id, reason)
      if (res.success) {
        toast.success(`Liquidación de ${employeeName} desaprobada y reabierta a borrador.`, {
          description: 'Ahora puedes editar haberes, descuentos o recalcular.',
          icon: <RotateCcw className="w-5 h-5 text-amber-500" />
        })
        setOpen(false)
        setReason('')
      } else {
        toast.error(res.error || 'Error al desaprobar liquidación')
      }
    } catch (error) {
      toast.error('Error de conexión al reabrir liquidación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setOpen(true)}
        disabled={loading}
        className="h-8 w-8 hover:bg-amber-500/10 text-amber-600 group"
        title="Desaprobar y Reabrir a Borrador para corregir"
      >
        <Unlock className="h-4 w-4 group-hover:scale-110 transition-transform" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-3xl p-6">
          <DialogHeader className="space-y-2 text-center">
            <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-2xl w-fit mx-auto border border-amber-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-foreground">
              ¿Desaprobar Liquidación?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Vas a reabrir la liquidación de <strong>{employeeName}</strong> a estado <strong>Borrador</strong>. Se limpiará el sello digital anterior para permitir ajustes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-[11px] font-bold text-foreground block">
              Motivo de la Reapertura (Opcional):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Corrección de horas extras / Bono atrasado"
              className="w-full px-3.5 py-2 rounded-xl bg-muted/50 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-xl text-xs font-bold uppercase"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleRevert}
              disabled={loading}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Reabriendo...
                </>
              ) : (
                'Desaprobar y Reabrir ➔'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
