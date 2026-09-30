'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Newspaper, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[News Section Error]:', error)
  }, [error])

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-6 bg-white/90 backdrop-blur-xl p-8 sm:p-12 rounded-[2.5rem] border border-border shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2">
          <Newspaper className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Hemeroteca Regional de Magallanes
          </span>
          <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-foreground uppercase">
            Actualizando Central de Noticias
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Estamos sincronizando los despachos informativos de Punta Arenas y la región. Por favor, reintenta en unos instantes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto rounded-xl font-black text-xs uppercase tracking-wider h-11 px-6 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl font-black text-xs uppercase tracking-wider h-11 px-6 gap-2 border-border/80"
            >
              <Home className="h-4 w-4" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
