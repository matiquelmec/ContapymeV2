import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Newspaper, Calculator, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-primary/20 relative overflow-hidden">
      {/* Glow Auroras */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Header Minimalista */}
      <header className="p-6 sm:p-10 relative z-10">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-contapyme.png" alt="Contapymepuq Logo" width={160} height={45} className="h-auto w-[140px] drop-shadow-md brightness-110" />
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full">
            Error 404 • Página No Encontrada
          </span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto px-6 py-12 relative z-10 flex flex-col items-center text-center max-w-2xl space-y-8">
        <div className="space-y-4">
          <span className="text-8xl sm:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-400 to-emerald-400 drop-shadow-2xl">
            404
          </span>
          <h1 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tight leading-tight text-white">
            La ruta contable que buscas <br />
            <span className="text-slate-400 font-serif">no se encuentra disponible</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium italic leading-relaxed max-w-lg mx-auto">
            Es posible que la dirección web haya cambiado, la noticia haya sido archivada o el documento de verificación requiera un código de autenticación válido.
          </p>
        </div>

        {/* Accesos Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4">
          <Link href="/">
            <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-[10px] font-black uppercase tracking-widest gap-2">
              <Home className="w-4 h-4 text-primary" /> Inicio
            </Button>
          </Link>
          <Link href="/noticias">
            <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-[10px] font-black uppercase tracking-widest gap-2">
              <Newspaper className="w-4 h-4 text-sky-400" /> Diario Regional
            </Button>
          </Link>
          <Link href="/calculadora">
            <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-[10px] font-black uppercase tracking-widest gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" /> Calculadora
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="p-6 sm:p-10 text-center relative z-10 border-t border-slate-900">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">
          © 2026 Contapymepuq • Punta Arenas, Magallanes y Antártica Chilena
        </p>
      </footer>
    </div>
  );
}
