import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PublicNav } from "@/components/public-nav";
import { MarketTicker } from "@/components/market-ticker";
import { getLatestIndicators } from "@/actions/indicators";
import { FacturinChat } from "@/components/facturin-chat";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const indicatorsRes = await getLatestIndicators();
  const indicators = indicatorsRes.success ? indicatorsRes.data : [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-primary/20" suppressHydrationWarning>
      {/* ===== TICKER SUPERIOR DE INDICADORES ===== */}
      <MarketTicker indicators={indicators} />

      {/* ===== HEADER / NAVBAR CON TABS ===== */}
      <header className="sticky top-11 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl" suppressHydrationWarning>
        <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12" suppressHydrationWarning>
          <Link href="/" className="flex items-center gap-4 group transition-transform duration-300">
            <Image
              src="/logo-contapyme.png"
              alt="Contapymepuq Logo"
              width={180}
              height={50}
              priority
              className="h-auto w-[120px] sm:w-[160px] md:w-[200px] drop-shadow-sm"
            />
          </Link>
          <PublicNav />
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard">
                <Button className="text-[11px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all px-8 rounded-full h-11">
                  <LayoutDashboard className="mr-2 h-3 w-3" /> Panel de Control
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all px-6 sm:px-10 rounded-full h-9 sm:h-11">
                  Acceso Clientes
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* ===== FOOTER ULTRA-PREMIUM SLATE DARK ===== */}
      <footer className="border-t border-slate-800 bg-slate-950 pt-16 pb-12 text-slate-300">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Grid Principal Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
            {/* Columna 1 & 2: Branding & Misión Regional */}
            <div className="lg:col-span-2 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <Link href="/" className="inline-block group">
                  <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-800 inline-block group-hover:border-primary/50 transition-colors">
                    <Image
                      src="/logo-contapyme.png"
                      alt="Contapymepuq Logo"
                      width={180}
                      height={48}
                      priority
                      className="h-auto w-[140px] sm:w-[170px] drop-shadow-md brightness-110 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                <p className="text-xs font-medium leading-relaxed text-slate-400 max-w-sm">
                  Ecosistema digital integral para Pymes de Chile y Magallanes. Gestión Contable IFRS, Nómina LRE (Dirección del Trabajo), Facturación Electrónica SII y Diario Informativo Regional.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest text-blue-400 shadow-sm">
                  <Globe className="h-3 w-3 animate-pulse text-blue-400" />
                  <span>Punta Arenas • Magallanes</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-400 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Sello Certificado SHA-256</span>
                </div>
              </div>
            </div>

            {/* Columna 3: Módulos & Soluciones */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-primary pl-2.5">Soluciones Pyme</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li><Link href="/software" className="hover:text-primary transition-colors">ERP Contable & IFRS</Link></li>
                <li><Link href="/dashboard/payroll" className="hover:text-primary transition-colors">Nómina & Ley 40 Horas</Link></li>
                <li><Link href="/dashboard/payroll/lre" className="hover:text-primary transition-colors">Libro Remuneraciones (LRE)</Link></li>
                <li><Link href="/dashboard/accounting/rcv" className="hover:text-primary transition-colors">Registro RCV & F29 SII</Link></li>
                <li><Link href="/dashboard/treasury" className="hover:text-primary transition-colors">Tesorería & Flujo Caja</Link></li>
              </ul>
            </div>

            {/* Columna 4: Normativa & Herramientas */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-emerald-500 pl-2.5">Normativa & Servicios</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li><Link href="/calculadora" className="hover:text-primary transition-colors">Calculadora de Sueldo Líquido</Link></li>
                <li><Link href="/noticias" className="hover:text-primary transition-colors">Diario Regional Magallanes</Link></li>
                <li><Link href="/precios" className="hover:text-primary transition-colors">Planes & Suscripciones</Link></li>
                <li><Link href="/contacto" className="hover:text-primary transition-colors">Soporte Técnico Especializado</Link></li>
              </ul>
            </div>

            {/* Columna 5: Transparencia & Legal */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-indigo-500 pl-2.5">Legal & Garantía</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li><Link href="/privacidad" className="hover:text-primary transition-colors">Política de Privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-primary transition-colors">Términos de Servicio</Link></li>
                <li><Link href="/verify/check" className="hover:text-primary transition-colors">Portal de Verificación Pública</Link></li>
              </ul>
            </div>
          </div>

          {/* Sub-Footer Infobar */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            <div>
              © {new Date().getFullYear()} CONTAPYMEPUQ. Punta Arenas, Región de Magallanes y Antártica Chilena.
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <Link href="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
              <span className="text-slate-700">•</span>
              <Link href="/terminos" className="hover:text-primary transition-colors">Términos</Link>
              <span className="text-slate-700">•</span>
              <Link href="/contacto" className="hover:text-primary transition-colors">Contacto</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== CHAT WIDGET INTERACTIVO DE FACTURÍN ===== */}
      <FacturinChat />
    </div>
  );
}
