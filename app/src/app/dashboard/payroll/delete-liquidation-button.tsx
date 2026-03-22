'use client'

import { useState } from 'react'
import { Trash, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteLiquidation } from '@/actions/payroll'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DeleteLiquidationButton({ id, employeeName }: { id: string, employeeName: string }) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteLiquidation(id)
      if (res.success) {
        toast.success(`Liquidación de ${employeeName} eliminada.`)
        setOpen(false)
      } else {
        toast.error(res.error || "No se pudo eliminar.")
      }
    } catch (e) {
      toast.error("Error de comunicación.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash className="h-4 w-4" />}
          </Button>
        }
      />
      <DialogContent className="rounded-[2rem] border-border shadow-2xl sm:max-w-[400px] bg-card">
        <DialogHeader>
          <div className="bg-rose-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
            <Trash className="h-6 w-6 text-rose-600" />
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-left">¿Eliminar cálculo?</DialogTitle>
          <DialogDescription className="text-xs font-bold text-muted-foreground/80 leading-relaxed text-left">
            Estás a punto de borrar el registro de nómina de <span className="text-foreground font-black uppercase">{employeeName}</span>. 
            <br/><br/>
            <span className="text-rose-600 font-black uppercase">⚠️ IMPORTANTE:</span> Esto solo borrará el cálculo de este periodo. No afectará la ficha del empleado. Use esto para corregir errores de procesamiento.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-8 sm:justify-between gap-4">
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-6">
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest h-12 px-8 flex-1"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
            CONFIRMAR ELIMINACIÓN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
