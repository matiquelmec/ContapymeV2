import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UpdatePasswordClient } from './update-password-client'

export const metadata: Metadata = {
  title: 'Establecer Nueva Contraseña | Contapymepuq',
  description: 'Crea una contraseña segura para tu cuenta en Contapymepuq.',
}

export default function UpdatePasswordPage() {
  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-10 group transition-transform duration-300 hover:scale-105">
        <Link href="/" className="inline-block relative mb-2">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-primary/10 to-teal-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <Image 
            src="/logo-contapyme.png" 
            alt="ContaPymePuq Logo" 
            width={220} 
            height={70} 
            priority
            className="relative drop-shadow-md brightness-110 contrast-105 w-[220px] h-auto mx-auto"
          />
        </Link>
        <p className="text-muted-foreground mt-4 text-sm font-medium tracking-wide italic">
          SISTEMA CONTABLE PROFESIONAL PARA PYMES
        </p>
      </div>

      <Card className="bg-card/80 backdrop-blur-xl border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5">
        <CardHeader className="space-y-1 pb-4 pt-8 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Nueva Contraseña</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Ingresa tu nueva clave de acceso seguro
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <UpdatePasswordClient />

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-muted-foreground/40 text-[10px] font-semibold tracking-widest mt-12 uppercase">
        Contapymepuq · {new Date().getFullYear()} · PRECISION INSTITUCIONAL
      </p>
    </div>
  )
}
