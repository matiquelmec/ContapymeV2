import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { requestPasswordReset } from '@/actions/auth'

export const metadata: Metadata = {
  title: 'Recuperar Contraseña | Contapymepuq',
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ error?: string; success?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams
  const error = params.error
  const success = params.success

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10 group transition-transform duration-300 hover:scale-105">
        <div className="relative inline-block mb-2">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-primary/10 to-teal-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <Image 
            src="/logo-contapyme.png" 
            alt="ContaPymePuq Logo" 
            width={220} 
            height={70} 
            priority
            className="relative drop-shadow-md brightness-110 contrast-105 w-[220px] h-auto mx-auto"
          />
        </div>
      </div>

      <Card className="bg-card/80 backdrop-blur-xl border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5">
        <CardHeader className="space-y-1 pb-4 pt-8 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Recuperar contraseña</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Te enviaremos un enlace a tu correo para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-5 text-center animate-in fade-in">
              <p className="text-emerald-700 text-sm font-bold mb-2">✓ ¡Correo enviado!</p>
              <p className="text-emerald-600 text-sm">{decodeURIComponent(success)}</p>
              <Link href="/login" className="inline-block mt-4 text-primary font-bold text-sm hover:underline">
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form action={requestPasswordReset} className="space-y-5">
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
                  className="h-11 bg-background border-input focus:ring-primary focus:border-primary transition-all"
                />
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
                Enviar enlace de recuperación
              </Button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Volver al inicio de sesión
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
