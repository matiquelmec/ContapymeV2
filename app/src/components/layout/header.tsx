'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { getUserOrganizations, setActiveOrganization, getActiveOrganizationId } from '@/actions/organizations'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function Header() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const orgs = await getUserOrganizations()
      const activeId = await getActiveOrganizationId()
      setOrganizations(orgs)
      if (activeId) setActiveOrgId(activeId)
    }
    loadData()
  }, [])

  const handleOrgChange = async (value: string | null) => {
    if (!value || value === 'none') return
    setActiveOrgId(value)
    await setActiveOrganization(value)
    toast.success('Empresa cambiada correctamente')
    // No necesitamos reload total si usamos revalidatePath, pero router.refresh ayuda a refrescar los RSC
    router.refresh()
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-white shadow-sm px-6">
      <div className="flex items-center gap-4">
        {/* Company Switcher Dinámico */}
        <div className="w-80">
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
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-4" suppressHydrationWarning={true}>
        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground hover:bg-accent" 
          onClick={async () => { await signOut() }}
        >
          Cerrar Sesión
        </Button>
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-primary text-primary-foreground font-black uppercase text-xs">CO</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
