import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { signUpWithEmail } from '@/actions/auth'

export const metadata: Metadata = {
  title: 'Crear Cuenta | Contapymepuq',
  description: 'Regístrate en Contapymepuq, el sistema contable profesional para PYMEs.',
}

interface RegisterPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams
  const error = params.error

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
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
        <p className="text-muted-foreground mt-4 text-sm font-medium tracking-wide italic">
          SISTEMA CONTABLE PROFESIONAL PARA PYMES
        </p>
      </div>

      <Card className="bg-card/80 backdrop-blur-xl border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5">
        <CardHeader className="space-y-1 pb-4 pt-8 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Crea tu cuenta</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Comienza a gestionar la contabilidad de tu empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
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
                className="h-11 bg-background border-input focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
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
              Crear Cuenta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-muted-foreground/40 text-[10px] font-semibold tracking-widest mt-12 uppercase">
        Contapymepuq · {new Date().getFullYear()} · PRECISION INSTITUCIONAL
      </p>
    </div>
  )
}
