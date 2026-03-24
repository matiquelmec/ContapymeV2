'use client'

import { useState } from 'react'
import { Package, Loader2, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createAsset } from '@/actions/assets'
import { toast } from 'sonner'

export function CreateAssetButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await createAsset(formData)
    if (!result.success && result.error) {
      toast.error('Error al registrar: ' + result.error)
      setLoading(false)
      return
    }
    toast.success('Activo registrado correctamente.', {
      description: 'La depreciación mensual ha sido calculada por el motor contable.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    })
    setOpen(false)
    setLoading(false)
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] px-10 shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all gap-3"
      >
        <Package className="w-5 h-5" />
        NUEVO ACTIVO
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden ring-1 ring-black/5">
          {/* STRIPE SUPERIOR */}
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-400 to-transparent" />

          <form action={handleSubmit} className="p-10 space-y-8">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">
                    Registrar Activo Fijo
                  </DialogTitle>
                  <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                    EL MOTOR CALCULARÁ LA DEPRECIACIÓN AUTOMÁTICAMENTE
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* NOMBRE */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOMBRE DEL BIEN DE CAPITAL</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder='Ej: MacBook Pro 16"'
                  required
                  className="h-14 bg-white border-border rounded-2xl font-black text-sm focus:ring-primary/20 shadow-sm px-6"
                />
              </div>

              {/* DETALLES DE INVENTARIO */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CATEGORÍA</Label>
                  <Input name="categoria" placeholder="Ej: Tecnología" className="h-12 bg-white border-border rounded-2xl font-bold text-sm px-6" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">MARCA</Label>
                  <Input name="marca" placeholder="Ej: Apple" className="h-12 bg-white border-border rounded-2xl font-bold text-sm px-6" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">MODELO</Label>
                  <Input name="modelo" placeholder="Ej: M3 Max" className="h-12 bg-white border-border rounded-2xl font-bold text-sm px-6" />
                </div>
              </div>

              {/* UBICACIÓN Y RESPONSABLE */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">UBICACIÓN</Label>
                  <Input name="ubicacion" placeholder="Ej: Oficina Central" className="h-12 bg-white border-border rounded-2xl font-bold text-sm px-6" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">RESPONSABLE</Label>
                  <Input name="responsable" placeholder="Ej: Juan Pérez" className="h-12 bg-white border-border rounded-2xl font-bold text-sm px-6" />
                </div>
              </div>

              {/* DESCRIPCIÓN */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">DESCRIPCIÓN / NOTAS (OPCIONAL)</Label>
                <Input
                  id="descripcion"
                  name="descripcion"
                  placeholder="Ej: Computador de diseño, SN: XYZ123"
                  className="h-12 bg-white border-border rounded-2xl font-bold text-sm focus:ring-primary/20 shadow-sm px-6"
                />
              </div>

              {/* FECHA + MÉTODO */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">FECHA DE ADQUISICIÓN</Label>
                  <Input
                    id="fecha_adquisicion"
                    name="fecha_adquisicion"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="h-12 bg-white border-border rounded-2xl font-black text-sm focus:ring-primary/20 shadow-sm px-6"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">MÉTODO DE DEPRECIACIÓN</Label>
                  <Select name="metodo_depreciacion" defaultValue="lineal">
                    <SelectTrigger className="h-12 bg-white border-border rounded-2xl font-black text-xs focus:ring-primary/20 shadow-sm px-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-border rounded-2xl shadow-2xl">
                      <SelectItem value="lineal" className="font-bold">Lineal (SII Chile)</SelectItem>
                      <SelectItem value="acelerada" className="font-bold">Acelerada (Doble Tasa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* VALORES */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">VALOR ADQ. ($)</Label>
                  <Input
                    id="valor_adquisicion"
                    name="valor_adquisicion"
                    type="number"
                    min="0"
                    defaultValue="1000000"
                    required
                    className="h-12 bg-white border-border rounded-2xl font-black text-sm text-center focus:ring-primary/20 shadow-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">VALOR RES. ($)</Label>
                  <Input
                    id="valor_residual"
                    name="valor_residual"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="h-12 bg-white border-border rounded-2xl font-black text-sm text-center focus:ring-primary/20 shadow-sm"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">VIDA ÚTIL (MESES)</Label>
                  <Input
                    id="vida_util_meses"
                    name="vida_util_meses"
                    type="number"
                    min="1"
                    defaultValue="60"
                    required
                    className="h-12 bg-white border-border rounded-2xl font-black text-sm text-center focus:ring-primary/20 shadow-sm"
                  />
                </div>
              </div>

              {/* NOTA */}
              <div className="bg-emerald-50/50 border-2 border-emerald-100 rounded-3xl p-5 flex items-start gap-4">
                <Info className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-emerald-900/70 font-black uppercase tracking-tight italic leading-relaxed">
                  El sistema generará el <strong>Asiento Contable</strong> de depreciación automáticamente cada vez que se ejecute el proceso de cierre mensual.
                </p>
              </div>

            </div>

            <DialogFooter className="flex gap-4 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                CANCELAR
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-3"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> REGISTRANDO...</> : <><Package className="w-5 h-5" /> REGISTRAR ACTIVO</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
