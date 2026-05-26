import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PublicNav } from "@/components/public-nav";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-primary/20" suppressHydrationWarning>
      {/* ===== HEADER / NAVBAR CON TABS ===== */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl" suppressHydrationWarning>
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

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border bg-white py-12">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 group cursor-default">
              <Globe className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform duration-500" />
              <span className="text-[10px] font-black italic uppercase tracking-widest text-foreground/60">Contapymepuq — Magallanes, Chile</span>
            </div>
            <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              <Link href="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
              <Link href="/terminos" className="hover:text-primary transition-colors">Términos</Link>
              <Link href="/contacto" className="hover:text-primary transition-colors">Contacto</Link>
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
              © 2026 Contapymepuq. Magallanes, Chile.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
