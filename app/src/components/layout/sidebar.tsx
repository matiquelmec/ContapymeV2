import Link from 'next/link'
import Image from 'next/image'
import { FileText, Users, Briefcase, TrendingUp, Settings, BookOpen, Layers, Scale, Landmark, Shield, ClipboardList, FileSpreadsheet, Settings2, BarChart3, Calculator, Box, UserCog } from 'lucide-react'

const navigationGroups = [
  {
    title: "Visión General",
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: TrendingUp },
    ]
  },
  {
    title: "Tributario & RCV",
    items: [
      { name: 'Registro RCV', href: '/dashboard/accounting/rcv', icon: FileText },
      { name: 'Contabilidad (F29)', href: '/dashboard/accounting', icon: Calculator },
      { name: 'Análisis F29', href: '/dashboard/accounting/f29-comparative', icon: BarChart3 },
    ]
  },
  {
    title: "Contabilidad Financiera",
    items: [
      { name: 'Plan de Cuentas', href: '/dashboard/accounting/chart-of-accounts', icon: Settings2 },
      { name: 'Libro Diario', href: '/dashboard/accounting/journal', icon: BookOpen },
      { name: 'Libro Mayor', href: '/dashboard/accounting/ledger', icon: Layers },
      { name: 'Balance de Comprobación', href: '/dashboard/accounting/trial-balance', icon: Scale },
      { name: 'Conciliación Bancaria', href: '/dashboard/reconciliation', icon: Landmark },
      { name: 'Reportes Financieros', href: '/dashboard/accounting/reports', icon: BarChart3 },
      { name: 'Config. de Cuentas', href: '/dashboard/accounting/config', icon: Settings },
    ]
  },
  {
    title: "Recursos Humanos (RRHH)",
    items: [
      { name: 'Remuneraciones', href: '/dashboard/payroll', icon: Users },
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
    ]
  }
]

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sm" suppressHydrationWarning>
      <div className="flex h-[108px] items-center px-6 border-b border-sidebar-border bg-white/50 backdrop-blur-sm" suppressHydrationWarning>
        <Link href="/dashboard" className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105 active:scale-95">
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
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 ease-in-out group"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
