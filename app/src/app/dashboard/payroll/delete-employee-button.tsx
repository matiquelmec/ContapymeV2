'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteEmployee } from '@/actions/payroll'
import { toast } from 'sonner'

interface DeleteEmployeeButtonProps {
  employeeId: string
  employeeName: string
}

export function DeleteEmployeeButton({ employeeId, employeeName }: DeleteEmployeeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const result = await deleteEmployee(employeeId)
      if (result.success) {
        toast.success(`Colaborador ${employeeName} eliminado correctamente.`)
        setOpen(false)
      } else {
        toast.error(result.error || "No se pudo eliminar al colaborador.")
      }
    } catch (error) {
      toast.error("Error crítico de comunicación.")
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
            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
            title="Borrar registro por error"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        }
      />
      <DialogContent className="rounded-[2rem] border-border shadow-2xl sm:max-w-[400px]">
        <DialogHeader>
          <div className="bg-rose-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-left">¿Eliminar registro?</DialogTitle>
          <DialogDescription className="text-xs font-bold text-muted-foreground leading-relaxed text-left">
            Esta acción eliminará la ficha de <span className="text-foreground font-black uppercase">{employeeName}</span> de forma permanente. 
            <br/><br/>
            <span className="text-rose-600 font-black uppercase">⚠️ ADVERTENCIA:</span> Use esto solo si el registro fue ingresado por error.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 sm:justify-between gap-4">
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-6">
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest h-12 px-8 flex-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            CONFIRMAR ELIMINACIÓN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
