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

      {/* ===== FOOTER PREMIUM WORLD-CLASS ===== */}
      <footer className="border-t border-border/80 bg-gradient-to-b from-card to-background pt-16 pb-12 text-foreground">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Grid Principal Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-14 border-b border-border/60">
            {/* Columna 1 & 2: Branding & Misión Regional */}
            <div className="lg:col-span-2 space-y-6">
              <Link href="/" className="inline-block group">
                <Image
                  src="/logo-contapyme.png"
                  alt="Contapymepuq Logo"
                  width={200}
                  height={55}
                  priority
                  className="h-auto w-[160px] sm:w-[190px] drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
              <p className="text-xs font-medium leading-relaxed text-muted-foreground max-w-md">
                Ecosistema digital integral para Pymes de Chile y Magallanes. Gestión Contable IFRS, Nómina conforme a la Dirección del Trabajo (LRE), Facturación Electrónica SII y Diario Informativo Regional.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                  <Globe className="h-3.5 w-3.5 animate-pulse" />
                  <span>Punta Arenas • Magallanes</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Sello Certificado SHA-256
                </div>
              </div>
            </div>

            {/* Columna 3: Módulos & Soluciones */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Soluciones Pyme</h4>
              <ul className="space-y-2.5 text-xs font-bold text-muted-foreground">
                <li><Link href="/software" className="hover:text-primary transition-colors">ERP Contable & IFRS</Link></li>
                <li><Link href="/dashboard/payroll" className="hover:text-primary transition-colors">Nómina & Ley 40 Horas</Link></li>
                <li><Link href="/dashboard/payroll/lre" className="hover:text-primary transition-colors">Libro Remuneraciones (LRE)</Link></li>
                <li><Link href="/dashboard/accounting/rcv" className="hover:text-primary transition-colors">Registro RCV & F29 SII</Link></li>
                <li><Link href="/dashboard/treasury" className="hover:text-primary transition-colors">Tesorería & Flujo Caja</Link></li>
              </ul>
            </div>

            {/* Columna 4: Normativa & Herramientas */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Normativa & Servicios</h4>
              <ul className="space-y-2.5 text-xs font-bold text-muted-foreground">
                <li><Link href="/calculadora" className="hover:text-primary transition-colors">Calculadora de Sueldo Líquido</Link></li>
                <li><Link href="/noticias" className="hover:text-primary transition-colors">Diario Regional Magallanes</Link></li>
                <li><Link href="/precios" className="hover:text-primary transition-colors">Planes & Suscripciones</Link></li>
                <li><Link href="/contacto" className="hover:text-primary transition-colors">Soporte Técnico Especializado</Link></li>
              </ul>
            </div>

            {/* Columna 5: Transparencia & Legal */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Legal & Garantía</h4>
              <ul className="space-y-2.5 text-xs font-bold text-muted-foreground">
                <li><Link href="/privacidad" className="hover:text-primary transition-colors">Política de Privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-primary transition-colors">Términos de Servicio</Link></li>
                <li><Link href="/verify/check" className="hover:text-primary transition-colors">Portal de Verificación Pública</Link></li>
              </ul>
            </div>
          </div>

          {/* Sub-Footer Infobar */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
            <div>
              © {new Date().getFullYear()} CONTAPYMEPUQ. Punta Arenas, Región de Magallanes y Antártica Chilena. Todos los derechos reservados.
            </div>
            <div className="flex gap-6">
              <Link href="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
              <span>•</span>
              <Link href="/terminos" className="hover:text-primary transition-colors">Términos</Link>
              <span>•</span>
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
