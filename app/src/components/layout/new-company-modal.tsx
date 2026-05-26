'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createOrganization, seedChartOfAccounts, seedPayrollSettings } from '@/actions/onboarding'

export function NewCompanyModal({ 
  open, 
  onOpenChange,
  onSuccess
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void 
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    rut: '', nombre: '', giro: '', direccion: '', comuna: '', region: 'Magallanes', regimen: 'pro_pyme',
    repLegalNombre: '', repLegalRut: ''
  })

  // Formateador automático del RUT 🇨🇱
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9kK]/g, '')
    if (value.length > 1) {
      const body = value.slice(0, -1)
      const dv = value.slice(-1).toUpperCase()
      value = `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
    }
    setFormData({ ...formData, rut: value })
  }

  const handleRepRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9kK]/g, '')
    if (value.length > 1) {
      const body = value.slice(0, -1)
      const dv = value.slice(-1).toUpperCase()
      value = `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
    }
    setFormData({ ...formData, repLegalNombre: formData.repLegalNombre, repLegalRut: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Crear empresa y miembro dueño
      toast.loading('Iniciando creación en el motor corporativo...', { id: 'new-org' })
      const resOrg = await createOrganization(formData)
      if (!resOrg.success || !resOrg.organizationId) {
        if (resOrg.error === 'LIMIT_REACHED') {
          toast.error(resOrg.message || 'Límite de empresas alcanzado en tu plan actual.', {
            id: 'new-org',
            duration: 6000,
            action: {
              label: 'Ver Planes',
              onClick: () => {
                window.location.href = '/precios';
              }
            }
          })
          return
        }
        throw new Error(resOrg.error)
      }

      // 2. Sembrar el plan de cuentas inicial (RPC)
      toast.loading('Forjando el Plan de Cuentas estándar (IFRS)...', { id: 'new-org' })
      const resCuentas = await seedChartOfAccounts(resOrg.organizationId)
      if (!resCuentas.success) throw new Error(resCuentas.error)

      // 3. Sembrar configuración previsional (AFPs + Isapres + Representante)
      toast.loading('Configurando instituciones previsionales...', { id: 'new-org' })
      await seedPayrollSettings(resOrg.organizationId, formData.repLegalNombre, formData.repLegalRut)

      toast.success('Empresa Corporativa creada exitosamente.', { id: 'new-org' })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: 'new-org' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-[2rem] shadow-2xl p-8">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Agregar Nueva Empresa B2B</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              EL SISTEMA RLS CREARÁ UNA INSTANCIA COMPLETAMENTE AISLADA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>RUT Empresa</Label>
                <Input required placeholder="76.123.456-0" value={formData.rut} onChange={handleRutChange} maxLength={12} className="h-12 bg-muted/50 font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Razón Social</Label>
                <Input required placeholder="Inversiones B2B SpA" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="h-12 bg-muted/50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Giro / Actividad Económica</Label>
              <Input required placeholder="Servicios Financieros y Contables" value={formData.giro} onChange={e => setFormData({...formData, giro: e.target.value})} className="h-12 bg-muted/50" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input required placeholder="Av. Apoquindo 4501" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="h-12 bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Comuna</Label>
                <Input required placeholder="Las Condes" value={formData.comuna} onChange={e => setFormData({...formData, comuna: e.target.value})} className="h-12 bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Región</Label>
                <Input required placeholder="Metropolitana" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="h-12 bg-muted/50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Régimen Tributario Oficial</Label>
              <Select value={formData.regimen} onValueChange={(val) => setFormData({...formData, regimen: val || 'pro_pyme'})}>
                <SelectTrigger className="w-full h-12 bg-muted/50">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro_pyme">14 D N°3 - Pro Pyme General</SelectItem>
                  <SelectItem value="pro_pyme_transparente">14 D N°8 - Pro Pyme Transparente</SelectItem>
                  <SelectItem value="parcialmente_integrado">14 A - Parcialmente Integrado</SelectItem>
                  <SelectItem value="renta_presunta">Renta Presunta</SelectItem>
                </SelectContent>
              </Select>
            </div> { /* Fin sección Régimen */ }

            {/* Nueva Sección: Representante Legal */}
            <div className="pt-4 border-t border-border mt-2 space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Representante Legal (Para Firmas)</Label>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Nombre Completo</Label>
                    <Input placeholder="Juan Pérez" value={formData.repLegalNombre} onChange={e => setFormData({...formData, repLegalNombre: e.target.value})} className="h-10 bg-muted/30" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">RUT Personal</Label>
                    <Input placeholder="12.345.678-9" value={formData.repLegalRut} onChange={handleRepRutChange} maxLength={12} className="h-10 bg-muted/30 font-mono" />
                  </div>
               </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CONSTRUIR INSTANCIA B2B'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
