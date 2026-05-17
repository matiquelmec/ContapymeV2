import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Contapymepuq',
  description: 'Accede a tu panel de gestión contable institucional.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Botón flotante para regresar al inicio (fijo para que no se pierda al hacer scroll) */}
      <Link 
        href="/" 
        className="fixed top-4 left-4 sm:top-6 sm:left-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200/80 bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.15em] text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50 shadow-md transition-all duration-300 z-50 group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" /> Volver al Inicio
      </Link>

      {/* Elementos decorativos institucionales */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-400/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
      
      <div className="z-10 w-full flex justify-center pt-12 sm:pt-0">
        {children}
      </div>
    </div>
  )
}
