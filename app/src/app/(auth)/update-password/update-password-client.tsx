'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordStrength } from '@/components/ui/password-strength'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export function UpdatePasswordClient() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Error al actualizar la contraseña.')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login?success=' + encodeURIComponent('Contraseña actualizada con éxito. Inicia sesión con tus nuevas credenciales.'))
        }, 2000)
      }
    } catch (err: any) {
      setError('Fallo de conexión al actualizar contraseña: ' + (err?.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3 animate-in fade-in">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-emerald-800 font-bold text-base">¡Contraseña Actualizada!</h3>
        <p className="text-emerald-600 text-xs">Redirigiéndote al inicio de sesión...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">
          Nueva Contraseña
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">
          Confirmar Nueva Contraseña
        </Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Repite tu nueva contraseña"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-11 bg-background border-input focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-destructive text-xs font-medium">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98]"
      >
        {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
      </Button>
    </form>
  )
}
