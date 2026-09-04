'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface PasswordStrengthProps {
  password?: string
  className?: string
}

export function getPasswordStrength(password: string = '') {
  let score = 0
  if (!password) return { score: 0, label: 'Vacía', color: 'bg-muted' }

  // NIST SP 800-63B enfatiza longitud
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score += 1

  switch (score) {
    case 1:
      return { score: 1, label: 'Débil', color: 'bg-rose-500', textColor: 'text-rose-500' }
    case 2:
      return { score: 2, label: 'Aceptable', color: 'bg-amber-500', textColor: 'text-amber-500' }
    case 3:
      return { score: 3, label: 'Buena', color: 'bg-emerald-500', textColor: 'text-emerald-500' }
    case 4:
      return { score: 4, label: 'Excelente (Recomendada NIST)', color: 'bg-teal-500', textColor: 'text-teal-600' }
    default:
      return { score: 0, label: 'Muy corta', color: 'bg-rose-400', textColor: 'text-rose-400' }
  }
}

export function PasswordStrength({ password = '', className }: PasswordStrengthProps) {
  if (!password) return null

  const strength = getPasswordStrength(password)
  const isMinLength = password.length >= 8

  return (
    <div className={cn('space-y-2 pt-1 animate-in fade-in duration-200', className)}>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground font-medium">Seguridad de la clave:</span>
        <span className={cn('font-bold', strength.textColor)}>{strength.label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-muted/30 rounded-full overflow-hidden p-0.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              'h-full rounded-full transition-all duration-300',
              step <= strength.score ? strength.color : 'bg-transparent'
            )}
          />
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        {isMinLength ? (
          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        ) : (
          <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        )}
        <span>Mínimo 8 caracteres (recomendado 12+ o frase de contraseña)</span>
      </div>
    </div>
  )
}
