'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Newspaper, Calculator, Cpu, Tag, Phone, Building2, Briefcase, Sparkles } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Diario Regional', icon: Newspaper },
  { href: '/empleos', label: 'Bolsa de Empleos', icon: Briefcase },
  { href: '/crear-empresa', label: 'Crea tu Empresa ($35.000)', icon: Building2 },
  { href: '/nosotros', label: 'Manifiesto & Misión', icon: Sparkles },
  { href: '/calculadora', label: 'Calculadora Sueldos', icon: Calculator },
  { href: '/software', label: 'Software ERP', icon: Cpu },
  { href: '/precios', label: 'Planes', icon: Tag },
  { href: '/contacto', label: 'Contacto', icon: Phone },
]

export function PublicNav() {
  const pathname = usePathname()
  const activeTabRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [pathname])

  return (
    <div className="relative w-full min-w-0 max-w-full">
      <nav 
        aria-label="Navegación Principal"
        className="flex items-center justify-start lg:justify-between gap-1 lg:gap-1 bg-muted/40 p-1 lg:p-1.5 rounded-full border border-border/60 backdrop-blur-xl overflow-x-auto lg:overflow-x-visible w-full max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden whitespace-nowrap shadow-xs max-lg:[mask-image:linear-gradient(to_right,black_92%,transparent_100%)]"
      >
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              ref={isActive ? activeTabRef : null}
              href={tab.href}
              prefetch={true}
              className={`relative flex items-center justify-center gap-1.5 lg:gap-1 xl:gap-1.5 text-[10px] lg:text-[9.5px] xl:text-[10px] font-black uppercase tracking-wider lg:tracking-wide xl:tracking-wider px-3.5 lg:px-2.5 xl:px-3.5 min-h-[40px] lg:min-h-[38px] rounded-full transition-all duration-300 shrink-0 lg:shrink select-none ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 lg:h-3 lg:w-3 xl:h-3.5 xl:w-3.5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
