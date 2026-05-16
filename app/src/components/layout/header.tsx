'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { getUserOrganizations, setActiveOrganization, getActiveOrganizationId } from '@/actions/organizations'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'
import { Plus, Menu } from 'lucide-react'
import { NewCompanyModal } from './new-company-modal'
import { MobileSidebar } from './mobile-sidebar'

export function Header() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const loadData = async () => {
    const orgs = await getUserOrganizations()
    const activeId = await getActiveOrganizationId()
    setOrganizations(orgs)
    if (activeId) setActiveOrgId(activeId)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOrgChange = async (value: string | null) => {
    if (!value || value === 'none') return
    
    // Si quiere crear una nueva empresa, abre el modal
    if (value === 'new_org') {
      setIsModalOpen(true)
      return
    }

    // Flujo normal de cambio de empresa
    setActiveOrgId(value)
    await setActiveOrganization(value)
    toast.success('Empresa cambiada correctamente')
    
    // Lógica inteligente de ruteo post-cambio:
    const segments = pathname.split('/').filter(Boolean)
    let targetPath = pathname

    if (segments.length >= 4) {
      targetPath = `/${segments[0]}/${segments[1]}`
    } else {
      targetPath = '/' + segments.slice(0, 3).join('/')
    }
    
    // Forzamos un hard-reload para asegurar que todos los datos y el layout se limpien de la caché
    window.location.href = targetPath || '/dashboard'
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-white shadow-sm px-4 md:px-6">
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        <MobileSidebar />
        {/* Company Switcher Dinámico */}
        <div className="w-full max-w-[200px] sm:max-w-80">
          <Select 
            value={activeOrgId} 
            onValueChange={handleOrgChange}
          >
            <SelectTrigger className="w-full bg-muted border-border text-foreground font-bold hover:bg-muted/80 transition-colors">
              <SelectValue>
                {organizations.find(o => o.id === activeOrgId)?.nombre || "Selecciona una empresa"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {organizations.length > 0 ? (
                organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.nombre}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No hay empresas</SelectItem>
              )}
              
              <div className="h-px bg-border my-1" />
              <SelectItem value="new_org" className="text-primary font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-primary/5 focus:bg-primary/10">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> CREAR NUEVA EMPRESA
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-4" suppressHydrationWarning={true}>
        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground hover:bg-accent px-2 sm:px-4" 
          onClick={async () => { await signOut() }}
        >
          <span className="hidden sm:inline">Cerrar Sesión</span>
          <span className="sm:hidden">Salir</span>
        </Button>
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-primary text-primary-foreground font-black uppercase text-xs">CO</AvatarFallback>
        </Avatar>
      </div>

      <NewCompanyModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSuccess={loadData}
      />
    </header>
  )
}
