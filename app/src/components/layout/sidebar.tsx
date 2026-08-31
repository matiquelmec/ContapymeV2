'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { FileText, Users, TrendingUp, Settings, BookOpen, Layers, Scale, Landmark, Shield, ClipboardList, FileSpreadsheet, Settings2, BarChart3, Calculator, Box, UserCog, Calendar as CalendarIcon, WalletCards, Briefcase, Newspaper, Megaphone, Globe } from 'lucide-react'

export const navigationGroups = [
  {
    title: "Visión General",
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: TrendingUp },
    ]
  },
  {
    title: "Ecosistema Regional",
    items: [
      { name: 'Portada & Diario', href: '/', icon: Globe },
      { name: 'Mis Empleos', href: '/dashboard/empleos', icon: Briefcase },
      { name: 'Mis Comunicados', href: '/dashboard/noticias', icon: Newspaper },
      { name: 'Banners & Publicidad', href: '/dashboard/publicidad', icon: Megaphone },
    ]
  },
  {
    title: "Tributario & RCV",
    items: [
      { name: 'Registro RCV', href: '/dashboard/accounting/rcv', icon: FileText },
      { name: 'Facturación (DTE)', href: '/dashboard/billing', icon: Box },
      { name: 'Contabilidad (F29)', href: '/dashboard/accounting/f29-comparative', icon: Calculator },
      { name: 'Análisis F29', href: '/dashboard/accounting/reports', icon: BarChart3 },
    ]
  },
  {
    title: "Contabilidad Financiera",
    items: [
      { name: 'Plan de Cuentas', href: '/dashboard/accounting/chart-of-accounts', icon: Settings2 },
      { name: 'Libro Diario', href: '/dashboard/accounting/journal', icon: BookOpen },
      { name: 'Libro Mayor', href: '/dashboard/accounting/ledger', icon: Layers },
      { name: 'Balance de Comprobación', href: '/dashboard/accounting/trial-balance', icon: Scale },
      { name: 'Cierre de Periodos', href: '/dashboard/accounting/periods', icon: CalendarIcon },
      { name: 'Tesorería', href: '/dashboard/treasury', icon: WalletCards },
      { name: 'Conciliación Bancaria', href: '/dashboard/reconciliation', icon: Landmark },
      { name: 'Reportes Financieros', href: '/dashboard/accounting/reports', icon: BarChart3 },
      { name: 'Config. de Cuentas', href: '/dashboard/accounting/config', icon: Settings },
    ]
  },
  {
    title: "Recursos Humanos (RRHH)",
    items: [
      { name: 'Remuneraciones', href: '/dashboard/payroll', icon: Users },
      { name: 'Gestión de Vacaciones', href: '/dashboard/payroll/vacations', icon: CalendarIcon },
      { name: 'Contratos', href: '/dashboard/payroll/contracts', icon: ClipboardList },
      { name: 'Finiquitos', href: '/dashboard/payroll/terminations', icon: FileText },
      { name: 'Libro LRE', href: '/dashboard/payroll/lre', icon: FileSpreadsheet },
      { name: 'Config. Previsional', href: '/dashboard/payroll/settings', icon: Shield },
    ]
  },
  {
    title: "Activos Fijos",
    items: [
      { name: 'Inventario y Depreciación', href: '/dashboard/assets', icon: Box },
    ]
  },
  {
    title: "Administración B2B",
    items: [
      { name: 'Configuración de Empresa', href: '/dashboard/settings', icon: UserCog },
      { name: 'Consola Superadmin', href: '/dashboard/admin', icon: Shield },
    ]
  }
]

export const allNavigationHrefs = navigationGroups.flatMap(g => g.items.map(i => i.href))

export function isSidebarItemActive(itemHref: string, currentPathname: string, allHrefs: string[] = allNavigationHrefs): boolean {
  if (itemHref === '/') {
    return currentPathname === '/'
  }
  if (itemHref === '/dashboard') {
    return currentPathname === '/dashboard'
  }
  if (currentPathname === itemHref) {
    return true
  }
  if (currentPathname.startsWith(itemHref + '/')) {
    const hasMoreSpecificMatch = allHrefs.some(
      (otherHref) =>
        otherHref !== itemHref &&
        otherHref !== '/' &&
        otherHref !== '/dashboard' &&
        (currentPathname === otherHref || currentPathname.startsWith(otherHref + '/')) &&
        otherHref.length > itemHref.length
    )
    return !hasMoreSpecificMatch
  }
  return false
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sm shrink-0" suppressHydrationWarning>
      <div className="flex h-[108px] items-center px-6 border-b border-sidebar-border bg-white/50 backdrop-blur-sm" suppressHydrationWarning>
        <Link href="/dashboard" prefetch={true} className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105 active:scale-95">
          <div className="relative">
            <div className="absolute -inset-2 rounded-xl bg-gradient-to-tr from-primary/10 to-teal-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Image 
              src="/logo-contapyme.png" 
              alt="ContaPymePuq Logo" 
              width={160} 
              height={50} 
              priority
              className="relative drop-shadow-sm brightness-100 contrast-105 transition-all duration-300 group-hover:brightness-110"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/70 px-2 pb-1">
              {group.title}
            </h4>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = isSidebarItemActive(item.href, pathname)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={true}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ease-in-out group ${
                      isActive 
                        ? 'bg-primary text-primary-foreground font-black shadow-md shadow-primary/20 translate-x-1' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 transition-opacity ${isActive ? 'opacity-100 text-primary-foreground' : 'opacity-70 group-hover:opacity-100'}`} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
