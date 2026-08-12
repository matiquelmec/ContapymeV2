import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  FileText, 
  HelpCircle,
  PhoneCall,
  Clock,
  Award
} from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "@/components/social-icons";

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
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* HERO SECTION CON VIDEO PROMOCIONAL */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-border/40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-primary/10 rounded-full blur-[150px] pointer-events-none -z-10" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Formalización Empresarial Magallanes
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.95] text-foreground">
              Crea tu Empresa en Punta Arenas <br />
              por solo <span className="text-emerald-600 italic font-serif">$35.000 CLP</span>
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base md:text-lg font-bold italic leading-relaxed max-w-2xl mx-auto">
              Te acompañamos en todo el proceso legal: redacción de estatutos, constitución en Empresa en un Día, firma electrónica e inicio de actividades en el SII.
            </p>
          </div>

          {/* REPRODUCTOR DE VIDEO PROMOCIONAL (FORMATO VERTICAL 9:16 REEL/SMARTPHONE) */}
          <div className="max-w-[380px] mx-auto space-y-8">
            <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-slate-900 bg-slate-950 shadow-[0_30px_90px_rgba(0,0,0,0.3)] ring-1 ring-white/10 group">
              <video 
                controls 
                playsInline
                preload="metadata"
                className="w-full h-auto max-h-[650px] aspect-[9/16] object-cover mx-auto rounded-[2.2rem]"
              >
                <source src="/videos/crea-tu-empresa.mp4" type="video/mp4" />
                Tu navegador no soporta la reproducción de video HTML5.
              </video>
            </div>

            {/* BOTONES DE ACCIÓN RÁPIDA (WHATSAPP & INSTAGRAM) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto"
              >
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 gap-3 transition-all">
                  <WhatsAppIcon className="w-5 h-5 fill-current" /> Contactar por WhatsApp →
                </Button>
              </a>

              <a 
                href={instagramUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto"
              >
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-10 rounded-2xl border-2 border-slate-300 hover:bg-slate-100 text-slate-800 font-black uppercase text-xs tracking-widest gap-3 transition-all">
                  <InstagramIcon className="w-5 h-5 fill-current" /> Síguenos en Instagram
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LO QUE INCLUYE EL SERVICIO DE $35.000 */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-6 lg:px-12 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Servicio Integral Garantizado</span>
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-foreground">
              ¿Qué incluye el paquete de $35.000?
            </h2>
            <p className="text-muted-foreground font-bold italic text-xs">
              Sin costos ocultos. Dejamos tu empresa 100% constituida y habilitada para facturar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Redacción de Estatutos", desc: "Asesoría para elegir entre SpA, EIRL o Sociedad de Resp. Ltda. adaptada a tu rubro." },
              { title: "Empresa en un Día", desc: "Inscripción oficial en el Registro de Empresas y Sociedades (RES) del Ministerio de Economía." },
              { title: "Obtención RUT & SII", desc: "Trámite de obtención de RUT corporativo e Inicio de Actividades en el Servicio de Impuestos Internos." },
              { title: "1 Mes Gratis Software", desc: "Regalo de 30 días en nuestro software contable con emisión de facturas y remuneraciones LRE." }
            ].map((item, idx) => (
              <div key={idx} className="p-8 rounded-[2rem] bg-background border border-border/60 shadow-sm space-y-4 hover:border-primary/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tight text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground font-medium italic leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* BANNER DE CONTACTO DIRECTO */}
          <div className="p-10 rounded-[3rem] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Atención Personalizada en Punta Arenas</span>
              <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase">¿Listo para formalizar tu negocio?</h3>
              <p className="text-xs text-slate-400 font-medium italic">Escríbenos directamente y un contador de nuestro equipo te guiará paso a paso.</p>
            </div>
            
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <Button size="lg" className="h-14 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase text-xs tracking-widest gap-2 shadow-xl">
                <WhatsAppIcon className="w-4 h-4 fill-current" /> Solicitar por $35.000 CLP
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
