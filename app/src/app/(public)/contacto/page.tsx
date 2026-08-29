import { MapPin, Zap } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { WhatsAppIcon, InstagramIcon } from "@/components/social-icons";
import { LiveSupportBadge } from "@/components/contact/live-support-badge";
import { AuroraBackground } from "@/components/ui/aurora-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto & Soporte Contable en Punta Arenas | Contapymepuq",
  description: "Contáctanos para soporte técnico, formalización de empresas, software ERP y asesoría tributaria en Magallanes y Punta Arenas.",
  keywords: [
    "contacto contapyme punta arenas",
    "soporte contable magallanes",
    "contador punta arenas telefono",
  ],
  alternates: {
    canonical: "https://www.contapymepuq.cl/contacto",
  },
};

export default function ContactoPage() {
  return (
    <AuroraBackground className="py-16 sm:py-24 scroll-mt-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="relative bg-white/90 border border-border/80 rounded-[3rem] p-8 sm:p-12 lg:p-20 shadow-2xl overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-3">
                <LiveSupportBadge />
                <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground leading-[1.05]">
                  ¿Necesitas <span className="text-primary font-serif">Soporte Regional</span> <br />en Magallanes?
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base font-medium leading-relaxed max-w-lg">
                  Nuestro equipo técnico y contable está radicado en Punta Arenas para brindarte una respuesta instantánea y personalizada a la realidad fiscal y laboral de tu empresa en el extremo sur.
                </p>
              </div>

              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 border border-border/60 transition-all hover:bg-muted/60">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Dirección Corporativa</span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">Las Malvas 2775, Punta Arenas, Chile.</span>
                  </div>
                </div>

                <a 
                  href="https://wa.me/56944444565" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-4 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 transition-all hover:bg-emerald-500/10"
                >
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
                    <WhatsAppIcon className="h-5 w-5 fill-current" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">WhatsApp Directo</span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-600">+56 9 4444 4565</span>
                  </div>
                </a>

                <a 
                  href="https://www.instagram.com/contapyme.puq" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-4 p-3 rounded-2xl bg-pink-500/5 border border-pink-500/20 transition-all hover:bg-pink-500/10"
                >
                  <div className="p-3 bg-pink-500/10 text-pink-600 rounded-xl shrink-0">
                    <InstagramIcon className="h-5 w-5 fill-current" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Instagram Oficial</span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-pink-600">@contapyme.puq</span>
                  </div>
                </a>

                <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 border border-border/60 transition-all hover:bg-muted/60">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Correo Electrónico</span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-primary">contacto@contapymepuq.cl</span>
                  </div>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
