'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Newspaper, Calculator, Cpu, Tag, Phone, Building2, Briefcase, Sparkles } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Diario Regional', icon: Newspaper },
  { href: '/empleos', label: 'Bolsa de Empleos', icon: Briefcase },
  { href: '/crear-empresa', label: 'Crea tu Empresa ()', icon: Building2 },
  { href: '/nosotros', label: 'Manifiesto & Misión', icon: Sparkles },
  { href: '/calculadora', label: 'Calculadora Sueldos', icon: Calculator },
  { href: '/software', label: 'Software ERP', icon: Cpu },
  { href: '/precios', label: 'Planes', icon: Tag },
  { href: '/contacto', label: 'Contacto', icon: Phone },
]

export function PublicNav() {
  const pathname = usePathname()

  return (
    <nav 
      aria-label="Navegación Principal"
      className="flex items-center gap-1 sm:gap-1.5 bg-muted/40 p-1 sm:p-1.5 rounded-full border border-border/60 backdrop-blur-xl overflow-x-auto max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden whitespace-nowrap shrink shadow-xs"
    >
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = tab.href === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={true}
            className={`relative flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-300 shrink-0 select-none ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.03]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95'
            }`}
          >
            <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
