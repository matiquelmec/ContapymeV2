'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordStrength } from '@/components/ui/password-strength'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { signUpWithEmail } from '@/actions/auth'

export function RegisterFormClient({ error }: { error?: string }) {
  const [password, setPassword] = React.useState('')

  return (
    <form action={signUpWithEmail} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">
          Nombre completo
        </Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Juan Pérez González"
          required
          autoComplete="name"
          className="h-11 bg-background border-input focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">
          Correo electrónico
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="contador@empresa.cl"
          required
          autoComplete="email"
          className="h-11 bg-background border-input focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">
          Contraseña
        </Label>
        <PasswordInput
          id="password"
          name="password"
          placeholder="Mínimo 8 caracteres"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 bg-background border-input focus:ring-primary focus:border-primary transition-all"
        />
        <PasswordStrength password={password} />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 animate-in fade-in slide-in-from-top-1">
          <p className="text-destructive text-sm font-medium">{decodeURIComponent(error)}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98]"
      >
        Crear Cuenta
      </Button>
    </form>
  )
}
