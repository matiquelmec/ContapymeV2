'use client'

import React from 'react'

interface AuroraBackgroundProps {
  children?: React.ReactNode
  className?: string
}

export function AuroraBackground({ children, className = '' }: AuroraBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-primary/15 via-sky-500/10 to-transparent blur-[140px] -z-10 rounded-full animate-pulse-slow will-change-transform" 
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-1/3 -right-20 w-[450px] h-[450px] bg-gradient-to-br from-blue-600/10 to-emerald-500/10 blur-[130px] -z-10 rounded-full animate-pulse-slow delay-1000 will-change-transform" 
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -bottom-20 -left-20 w-[500px] h-[450px] bg-gradient-to-tr from-emerald-500/10 to-primary/10 blur-[130px] -z-10 rounded-full animate-pulse-slow delay-2000 will-change-transform" 
      />
      {children}
    </div>
  )
}
