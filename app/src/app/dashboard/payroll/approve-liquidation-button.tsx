'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateLiquidationStatus } from '@/actions/payroll'
import { toast } from 'sonner'
import { SignaturePad } from '@/components/ui/signature-pad'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"

export function ApproveLiquidationButton({ id, employeeName }: { id: string, employeeName: string }) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSign = async (signatureDataUrl: string) => {
    setLoading(true)
    try {
      // Registrar la liquidación como aprobada con firma
      const res = await updateLiquidationStatus(id, 'aprobada', signatureDataUrl)
      if (res.success) {
        toast.success(`Liquidación de ${employeeName} protocolizada con éxito.`, {
            description: 'Sello digital aplicado correctamente al folio legal.',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        })
        setOpen(false)
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
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setOpen(true)}
        disabled={loading}
        className="h-8 w-8 hover:bg-emerald-600/10 text-emerald-600 group"
        title="Protocolizar con Firma Digital"
      >
        <PenTool className="h-4 w-4 group-hover:scale-110 transition-transform" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
            <div className="h-4 w-full bg-gradient-to-r from-emerald-600 via-rose-300 to-transparent" />
            <DialogHeader className="p-10 pb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="space-y-0.5">
                        <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Cierre de Liquidación Mensual</DialogTitle>
                        <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">PROTOCOLO DE ACEPTACIÓN — {employeeName}</DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            <div className="p-10 pt-4">
                <p className="text-[11px] text-muted-foreground font-bold italic mb-6 leading-relaxed opacity-60">
                    Al protocolizar este documento, se confirma el pago de haberes y el cumplimiento de las obligaciones previsionales correspondientes. Proporcione la firma táctil para sellar el folio.
                </p>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-20" />
                        <p className="font-black uppercase text-[10px] tracking-widest text-emerald-700 italic">Sellando Liquidación...</p>
                    </div>
                ) : (
                    <SignaturePad onSave={handleSign} />
                )}
            </div>
            <DialogFooter className="p-10 pt-0">
                <Button variant="ghost" onClick={() => setOpen(false)} className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-muted-foreground">ABORTAR PROTOCOLO</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
