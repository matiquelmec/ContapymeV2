import { Metadata } from "next";
import Image from "next/image";
import { MessageCircle, Instagram, Mail, MapPin, ShieldCheck, CheckCircle2, Sparkles, ArrowUpRight, Phone } from "lucide-react";
import { WhatsAppIcon, InstagramIcon } from "@/components/social-icons";

export const metadata: Metadata = {
  title: "Contapymepuq — Canales Oficiales & Asesoría Contable en Magallanes",
  description: "Canal oficial de atención para servicios contables, formalización de empresas y asesoría tributaria en Punta Arenas y Región de Magallanes.",
  alternates: {
    canonical: "https://www.contapymepuq.cl",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Contapymepuq — Canales Oficiales Magallanes",
    description: "Atención directa vía WhatsApp e Instagram para servicios contables y creación de empresas en Punta Arenas.",
    url: "https://www.contapymepuq.cl",
    siteName: "Contapymepuq",
    locale: "es_CL",
    type: "website",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AccountingService",
    name: "Contapyme Magallanes",
    url: "https://www.contapymepuq.cl",
    logo: "https://www.contapymepuq.cl/logo-contapyme.png",
    description: "Servicios contables, tributarios y de remuneraciones para empresas en Punta Arenas y Región de Magallanes.",
    telephone: "+56944444565",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Punta Arenas",
      addressRegion: "Magallanes y de la Antártica Chilena",
      addressCountry: "CL",
    },
    sameAs: [
      "https://www.instagram.com/contapyme.puq",
      "https://wa.me/56944444565",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl mx-auto space-y-8 text-center">
          
          {/* Header & Logo Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border/70 shadow-2xl space-y-6">
            
            {/* Logo */}
            <div className="flex justify-center">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md inline-block">
                <Image
                  src="/logo-contapyme.png"
                  alt="Contapymepuq Logo"
                  width={220}
                  height={60}
                  priority
                  className="h-auto w-[160px] sm:w-[200px]"
                />
              </div>
            </div>

            {/* Badges de Estado */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Atención Activa
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
                <MapPin className="w-3 h-3 text-primary" />
                Punta Arenas • Magallanes
              </span>
            </div>

            {/* Titular */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Canales Oficiales de Contacto
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Tu contabilidad, formalización de empresas y asesorías tributarias en Magallanes se atienden de manera directa y personalizada en nuestras redes.
              </p>
            </div>

            {/* Botones Principales de Redirección / Contacto */}
            <div className="space-y-3 pt-2">
              
              {/* WhatsApp Oficial */}
              <a
                href="https://wa.me/56944444565?text=Hola%2C%20me%20comunico%20desde%20contapymepuq.cl%20para%20consultas%20contables%20y%20servicios."
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2.5 rounded-xl bg-white/20 text-white">
                    <WhatsAppIcon className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider font-black text-emerald-100">WhatsApp Oficial</div>
                    <div className="text-base font-black">+56 9 4444 4565</div>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-emerald-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* Instagram Oficial */}
              <a
                href="https://www.instagram.com/contapyme.puq"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:opacity-95 text-white font-bold transition-all shadow-lg shadow-rose-600/20 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2.5 rounded-xl bg-white/20 text-white">
                    <InstagramIcon className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider font-black text-pink-100">Instagram Regional</div>
                    <div className="text-base font-black">@contapyme.puq</div>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-pink-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* Correo Electrónico */}
              <a
                href="mailto:contacto@contapymepuq.cl"
                className="group w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-foreground font-bold transition-all border border-border/60 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-foreground">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Correo Directo</div>
                    <div className="text-sm font-black">contacto@contapymepuq.cl</div>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            {/* Servicios Disponibles */}
            <div className="pt-4 border-t border-border/50 text-left space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block text-center">
                Servicios Contables y Tributarios Disponibles
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-foreground/90">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Creación de Empresas ($35.000)</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Contabilidad Mensual & F29</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Remuneraciones & Ley 40H</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Asesoría Tributaria SII</span>
                </div>
              </div>
            </div>

            {/* Aviso de Transición */}
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/60 text-xs text-muted-foreground text-center space-y-1">
              <p className="font-semibold text-foreground">
                Aviso de Actualización de Plataforma
              </p>
              <p className="leading-relaxed text-[11px]">
                Las secciones web de noticias y cartelera de empleos han finalizado su emisión pública. Todas las solicitudes comerciales y consultas contables continúan canalizándose directamente por WhatsApp e Instagram.
              </p>
            </div>

          </div>

          {/* Pie de Página Minimalista */}
          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} Contapymepuq • Punta Arenas, Magallanes y Antártica Chilena.
          </p>

        </div>
      </div>
    </>
  );
}
