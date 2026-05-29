'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, PenTool } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SignaturePad } from '@/components/ui/signature-pad'
import { bulkApproveLiquidations } from '@/actions/payroll'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface BulkApproveLiquidationsButtonProps {
  organizationId: string
  year: string
  month: string
  count: number
}

export function BulkApproveLiquidationsButton({ organizationId, year, month, count }: BulkApproveLiquidationsButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleApprove = async (signatureDataUrl: string) => {
    setLoading(true)
    try {
      const result = await bulkApproveLiquidations({
        organizationId,
        year,
        month,
        signature_base64: signatureDataUrl
      })

      if (result.success) {
        toast.success(`${result.approvedCount || 0} liquidaciones aprobadas.`, {
          description: 'La firma registrada quedo asociada al cierre masivo del periodo.'
        })
        setOpen(false)
      } else {
        toast.error(result.error || 'No se pudo aprobar en masa.')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Fallo al aprobar liquidaciones.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        disabled={loading || count === 0}
        onClick={() => setOpen(true)}
        className="border-emerald-200 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-black uppercase text-[10px] tracking-widest rounded-2xl h-10 px-4 shadow-lg shadow-emerald-500/5 transition-all gap-2 w-full sm:w-auto"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
        Aprobar borradores
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
          <div className="h-4 w-full bg-gradient-to-r from-emerald-600 via-emerald-200 to-transparent" />
          <DialogHeader className="p-10 pb-6">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">
                  Aprobacion masiva
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                  {count} liquidaciones en borrador del periodo {month.padStart(2, '0')}/{year}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-10 pt-4">
            <p className="text-[11px] text-muted-foreground font-bold italic mb-6 leading-relaxed opacity-70">
              Esta accion cierra las liquidaciones en borrador del periodo. Una liquidacion aprobada no vuelve a borrador ni se elimina desde la operacion normal.
            </p>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-30" />
                <p className="font-black uppercase text-[10px] tracking-widest text-emerald-700 italic">Cerrando periodo...</p>
              </div>
            ) : (
              <SignaturePad onSave={handleApprove} />
            )}
          </div>
          <DialogFooter className="p-10 pt-0">
            <Button variant="ghost" onClick={() => setOpen(false)} className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-muted-foreground">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
