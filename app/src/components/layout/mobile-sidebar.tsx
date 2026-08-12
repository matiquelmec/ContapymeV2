'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { navigationGroups } from './sidebar'
import { Button } from '@/components/ui/button'

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden text-muted-foreground hover:text-primary transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Sidebar Panel */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[101] w-[280px] bg-sidebar border-r border-sidebar-border shadow-2xl lg:hidden flex flex-col"
            >
              <div className="flex h-20 items-center justify-between px-6 border-b border-sidebar-border bg-white/50 backdrop-blur-sm">
                <Image 
                  src="/logo-contapyme.png" 
                  alt="Logo" 
                  width={120} 
                  height={40} 
                  className="h-auto w-auto"
                />
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {navigationGroups.map((group) => (
                  <div key={group.title} className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/40 px-2">
                      {group.title}
                    </h4>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            prefetch={true}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all group ${
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-md' 
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            }`}
                          >
                            <item.icon className={`h-5 w-5 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} />
                            <span>{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
