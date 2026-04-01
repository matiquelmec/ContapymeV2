import type { Metadata } from 'next'

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
      {/* Elementos decorativos institucionales */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-400/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
      
      <div className="z-10 w-full flex justify-center">
        {children}
      </div>
    </div>
  )
}
