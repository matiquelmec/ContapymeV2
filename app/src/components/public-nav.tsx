'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const tabs = [
  { href: '/', label: 'Diario' },
  { href: '/calculadora', label: 'Calculadora' },
  { href: '/software', label: 'Software' },
  { href: '/precios', label: 'Precios' },
  { href: '/contacto', label: 'Contacto' },
]

export function PublicNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:flex items-center gap-10">
      {tabs.map(tab => {
        const isActive = tab.href === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors relative pb-1 ${
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
