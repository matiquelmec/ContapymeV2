import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ShieldCheck,
  Flame,
  GitCompare,
  Lock,
  BookOpen,
  Users,
  Building,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { AISandbox } from "@/components/ai-sandbox";
import { TaxCalculator } from "@/components/tax-calculator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Software Contable, ERP & Remuneraciones en Punta Arenas",
  description: "Sistema de gestión contable IFRS, emisión de facturación electrónica SII, libro de remuneraciones LRE y conciliación bancaria para Pymes en Magallanes y Chile.",
  keywords: [
    "software contable chile",
    "software remuneraciones punta arenas",
    "erp contable magallanes",
    "facturacion electronica sii",
    "libro remuneraciones electronico dt",
    "contador punta arenas software"
  ],
  openGraph: {
    title: "Software Contable & Remuneraciones LRE - Contapymepuq",
    description: "Gestión contable IFRS, facturación SII y liquidaciones masivas en Punta Arenas.",
    url: "https://contapymepuq.cl/software",
  },
};

export default function SoftwarePage() {
  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-20 pb-20 overflow-hidden" suppressHydrationWarning>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10" suppressHydrationWarning />
        <div className="absolute top-20 right-[-10%] w-[550px] h-[550px] bg-primary/10 rounded-full blur-[130px] -z-10 pointer-events-none opacity-60 animate-pulse duration-[8000ms]" />

        <div className="container mx-auto px-6 lg:px-12 relative" suppressHydrationWarning>
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-in fade-in slide-in-from-top-4 duration-700" suppressHydrationWarning>
              <ShieldCheck className="h-3 w-3" /> Precisión Patagonia
            </div>
            <h1 className="text-[clamp(2.5rem,5.5vw,5.5rem)] font-black tracking-tighter uppercase leading-[0.95] italic animate-in fade-in slide-in-from-left-8 duration-700">
              Precisión <span className="text-primary italic font-serif">Institucional</span> <br />
              y Escalabilidad <span className="text-muted-foreground/35">Organizacional.</span>
            </h1>
            <p className="max-w-2xl text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground italic leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Diseñado para empresas, pymes y contadores en la Región de Magallanes. Integración total con facturación SII, remuneraciones LRE y noticias económicas en tiempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <Link href="/dashboard">
                <Button size="lg" className="text-xs font-black uppercase tracking-widest h-14 px-10 rounded-2xl bg-primary text-primary-foreground hover:shadow-2xl hover:shadow-primary/30 transition-all group">
                  Comenzar Ahora | 14 Días Gratis <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/precios">
                <Button variant="outline" size="lg" className="text-xs font-black uppercase tracking-widest h-14 px-10 rounded-2xl border-2 hover:bg-muted transition-all">
                  Ver Planes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION (Matriz de Poder Contable) ===== */}
      <section id="features" className="py-24 bg-background scroll-mt-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Tecnología Financiera Austral</h2>
            <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground">
              Matriz de Poder Contable <br /><span className="text-muted-foreground/30">e Integridad Operacional.</span>
            </h3>
            <p className="text-muted-foreground font-bold italic text-sm">
              Conoce el conjunto completo de herramientas contables, tributarias y criptográficas diseñadas para el sur de Chile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Flame, title: "Facturación SII Compliance", desc: "Emite Facturas, Boletas, Guías de Despacho y Notas de Crédito con timbrado electrónico inmediato. Firmado digitalmente y sincronizado automáticamente con el SII.", cta: "Emitir DTE" },
              { icon: GitCompare, title: "Conciliación Bancaria", desc: "Sube tus cartolas de cualquier banco chileno. Nuestro motor cruza automáticamente los movimientos con tus asientos contables y genera los ajustes correspondientes en segundos.", cta: "Conciliar Cuentas" },
              { icon: Lock, title: "Registro Criptográfico", desc: "Seguridad forense total. Cada transacción y movimiento contable es sellado y encadenado criptográficamente mediante algoritmo SHA-256 libre de alteraciones.", cta: "Auditar Hashes" },
              { icon: BookOpen, title: "Libro Diario Dinámico", desc: "Cada hecho económico genera automáticamente asientos contables en partida doble (Debe/Haber). Cumplimiento estricto con IFRS y normativas contables del SII.", cta: "Ver Libro Diario" },
              { icon: Users, title: "Remuneraciones LRE", desc: "Emite liquidaciones masivas de sueldo. Genera el Libro de Remuneraciones Electrónico listo para la Dirección del Trabajo (DT).", cta: "Gestionar Sueldos" },
              { icon: Building, title: "Control de Activos Fijos", desc: "Controla y calcula la depreciación lineal y acelerada de las maquinarias, vehículos e inmuebles de tu empresa, reflejando el impacto en tu balance general.", cta: "Revisar Activos" },
              { icon: AlertTriangle, title: "Auditoría F29 & RCV", desc: "Cruce predictivo mensual de IVA Débito e IVA Crédito. Compara tus libros físicos contra el Registro de Compras y Ventas (RCV) del SII de manera automática.", cta: "Auditar IVA" },
              { icon: FileCheck, title: "Balances Certificados", desc: "Genera Balances y Estados de Resultados sellados digitalmente con firma hash SHA-256 única y archivados de forma inmutable, listos para auditorías o bancos.", cta: "Validar Reportes" },
            ].map((card, i) => (
              <div key={i} className="space-y-6 group p-8 rounded-[2.5rem] bg-white border border-border/50 hover:border-primary/20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col justify-between min-h-[320px]">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                    <card.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">{card.title}</h3>
                  <p className="text-muted-foreground italic font-medium leading-relaxed text-xs">{card.desc}</p>
                </div>
                <Link href="/dashboard" className="block pt-4">
                  <Button variant="link" className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:no-underline gap-2">
                    {card.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INTERACTIVE DEMOS SECTION ===== */}
      <section id="demos" className="py-24 bg-gradient-to-b from-background to-neutral-50/50 scroll-mt-32">
        <div className="container mx-auto px-6 lg:px-12 space-y-24">
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Simulación Cripto-Contable</h2>
              <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-foreground">
                Experimenta el Motor de Inteligencia en Vivo
              </h3>
              <p className="text-muted-foreground font-bold italic text-xs">
                Interactúa directamente con la consola virtual contable y observa cómo procesamos exenciones, remunaciones e inmutabilidad.
              </p>
            </div>
            <AISandbox />
          </div>

          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Análisis Tributario</h2>
              <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-foreground">
                Calcula tu Beneficio en Zonas Extremas
              </h3>
              <p className="text-muted-foreground font-bold italic text-xs">
                Compara los ahorros fiscales entre Zona Franca, Ley Navarino y el Régimen General del resto de Chile de forma instantánea.
              </p>
            </div>
            <TaxCalculator />
          </div>
        </div>
      </section>
    </>
  );
}
