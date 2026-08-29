import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Sparkles 
} from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "@/components/social-icons";
import { CompanyStepper } from "@/components/company/company-stepper";
import { AuroraBackground } from "@/components/ui/aurora-background";

export const metadata: Metadata = {
  title: "Creación de Empresas en Punta Arenas por $35.000 | Contapymepuq",
  description: "Formaliza tu negocio en Magallanes por solo $35.000 CLP. Redacción de estatutos, constitución en Empresa en un Día, inicio de actividades SII y 1 mes gratis de software.",
  keywords: [
    "crear empresa punta arenas",
    "constitucion de sociedad magallanes",
    "crear empresa en un dia chile",
    "formalizar pyme punta arenas",
    "crear spa eirl ltda magallanes",
    "inicio de actividades sii punta arenas"
  ],
  alternates: {
    canonical: "https://www.contapymepuq.cl/crear-empresa",
  },
  openGraph: {
    title: "Creación de Empresas en Punta Arenas por $35.000",
    description: "Formaliza tu empresa en Magallanes con asesoría legal y tributaria experta.",
    url: "https://contapymepuq.cl/crear-empresa",
  },
};

export default function CrearEmpresaPage() {
  const whatsappUrl = "https://wa.me/56944444565?text=" + encodeURIComponent("¡Hola! Me interesa formalizar mi empresa por $35.000 en Contapymepuq. Quisiera más información.");
  const instagramUrl = "https://www.instagram.com/contapyme.puq";

  return (
    <AuroraBackground className="min-h-screen">
      {/* HERO SECTION CON VIDEO PROMOCIONAL */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-black uppercase tracking-[0.3em] animate-in fade-in slide-in-from-top-4 duration-700">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Formalización Empresarial Magallanes
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700">
              Crea tu Empresa en Punta Arenas <br />
              por solo <span className="text-emerald-600 font-serif">$35.000 CLP</span>
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              Te acompañamos en todo el proceso legal: redacción de estatutos, constitución en Empresa en un Día, firma electrónica e inicio de actividades en el SII.
            </p>
          </div>

          {/* REPRODUCTOR DE VIDEO CON SMARTPHONE FRAME ESTILIZADO */}
          <div className="max-w-[360px] mx-auto space-y-6">
            <div className="relative rounded-[3rem] overflow-hidden border-4 border-slate-900 bg-slate-950 shadow-[0_30px_90px_rgba(0,0,0,0.25)] ring-1 ring-white/10 group">
              <video 
                controls 
                playsInline
                preload="metadata"
                className="w-full h-auto max-h-[600px] aspect-[9/16] object-cover mx-auto rounded-[2.6rem]"
              >
                <source src="/videos/crea-tu-empresa.mp4" type="video/mp4" />
                Tu navegador no soporta la reproducción de video HTML5.
              </video>
            </div>

            {/* BOTONES DE ACCIÓN RÁPIDA (WHATSAPP & INSTAGRAM) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto"
              >
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider shadow-lg shadow-emerald-600/20 gap-2 transition-all active:scale-95">
                  <WhatsAppIcon className="w-4 h-4 fill-current" /> Contactar por WhatsApp →
                </Button>
              </a>

              <a 
                href={instagramUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto"
              >
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 rounded-full border-border hover:bg-muted font-black uppercase text-xs tracking-wider gap-2 transition-all active:scale-95">
                  <InstagramIcon className="w-4 h-4 fill-current text-pink-600" /> Instagram
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STEPPER INTERACTIVO DE FORMALIZACIÓN */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 space-y-16">
          <CompanyStepper />

          {/* LO QUE INCLUYE EL SERVICIO DE $35.000 */}
          <div className="space-y-10 pt-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Servicio Integral Garantizado</span>
              <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
                Paquete Completo de Formalización
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Redacción de Estatutos", desc: "Asesoría para elegir entre SpA, EIRL o Sociedad de Resp. Ltda. adaptada a tu rubro." },
                { title: "Empresa en un Día", desc: "Inscripción oficial en el Registro de Empresas y Sociedades (RES) del Ministerio de Economía." },
                { title: "Obtención RUT & SII", desc: "Trámite de obtención de RUT corporativo e Inicio de Actividades en el Servicio de Impuestos Internos." },
                { title: "1 Mes Gratis Software", desc: "Regalo de 30 días en nuestro software contable con emisión de facturas y remuneraciones LRE." }
              ].map((item, idx) => (
                <div key={idx} className="p-8 rounded-[2rem] bg-white border border-border/80 shadow-md space-y-4 hover:border-primary/30 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="text-base font-black italic uppercase tracking-tight text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* BANNER DE CONTACTO DIRECTO */}
          <div className="p-8 sm:p-12 rounded-[3rem] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Atención Personalizada en Punta Arenas</span>
              <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase">¿Listo para formalizar tu negocio?</h3>
              <p className="text-xs text-slate-400 font-medium">Escríbenos directamente y un contador de nuestro equipo te guiará paso a paso.</p>
            </div>
            
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 w-full md:w-auto">
              <Button size="lg" className="w-full md:w-auto h-12 px-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase text-xs tracking-widest gap-2 shadow-xl">
                <WhatsAppIcon className="w-4 h-4 fill-current" /> Solicitar por $35.000 CLP
              </Button>
            </a>
          </div>
        </div>
      </section>
    </AuroraBackground>
  );
}
