import { Metadata } from "next";
import { PricingTable } from "@/components/pricing/pricing-table";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Planes y Precios Software Contable & ERP | Contapymepuq",
  description: "Conoce nuestros planes para empresas y contadores en Punta Arenas y Magallanes. Facturación SII ilimitada, Libro LRE, Conciliación Bancaria y 14 días gratis.",
  keywords: [
    "precios software contable chile",
    "planes erp punta arenas",
    "software remuneraciones lre precio",
    "contabilidad pyme magallanes",
  ],
  alternates: {
    canonical: "https://www.contapymepuq.cl/precios",
  },
};

export default function PreciosPage() {
  return (
    <AuroraBackground className="py-16 sm:py-24 scroll-mt-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] animate-in fade-in slide-in-from-top-4 duration-700">
            <ShieldCheck className="w-3.5 h-3.5" /> Inversión Estratégica Transparente
          </div>
          <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase text-foreground leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700">
            Planes Diseñados <br />
            <span className="text-primary font-serif">para la Empresa Austral.</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            Sin costos ocultos ni contratos forzados. Elige el plan que se adapte al tamaño de tu negocio y escala cuando lo necesites.
          </p>
        </div>

        <PricingTable />
      </div>
    </AuroraBackground>
  );
}
