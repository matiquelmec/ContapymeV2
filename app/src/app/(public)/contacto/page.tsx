import Link from "next/link";
import { MapPin, Zap } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export default function ContactoPage() {
  return (
    <section className="py-24 bg-background scroll-mt-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="relative bg-gradient-to-br from-primary/[0.04] via-zinc-50/50 to-primary/[0.08] border border-primary/10 rounded-[3rem] p-8 sm:p-12 lg:p-20 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Auroras Patagónicas Decorativas */}
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-0 pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-500/8 rounded-full blur-[100px] -z-0 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-primary">
                <MapPin className="h-3 w-3" /> Soporte Local e Inmediato
              </div>
              <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground leading-[1.05]">
                ¿Necesitas <span className="text-primary italic">Soporte Regional</span> <br />en Magallanes?
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base font-bold italic leading-relaxed max-w-lg">
                Nuestro equipo técnico está basado en Punta Arenas para brindarte una respuesta instantánea y personalizada a la realidad fiscal y administrativa de tu empresa en el extremo sur.
              </p>

              <div className="flex flex-col gap-5 pt-4">
                <div className="flex items-center gap-4 transition-transform hover:translate-x-1 duration-300">
                  <div className="p-3.5 bg-primary/10 text-primary rounded-2xl border border-primary/20 shadow-sm shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Dirección Corporativa</span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">O&apos;Higgins 123, Punta Arenas.</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 transition-transform hover:translate-x-1 duration-300">
                  <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20 shadow-sm shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Correo Electrónico</span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-primary">contacto@contapymepuq.cl</span>
                  </div>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
