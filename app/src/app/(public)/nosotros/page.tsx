import { Metadata } from "next";
import Link from "next/link";
import { 
  Sparkles, 
  Target, 
  Eye, 
  Building2, 
  Briefcase, 
  Newspaper, 
  CheckCircle2, 
  ArrowRight, 
  Compass, 
  TrendingUp, 
  Zap, 
  Scale, 
  Users, 
  Globe 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Manifiesto Institucional: Misión y Visión | ContaPymePUQ",
  description: "Conoce el propósito central, la misión y la visión 2035 de ContaPymePUQ y ContaEmpleos: el sistema operativo económico, laboral e informativo de Magallanes.",
  keywords: [
    "mision contapyme",
    "vision contapyme",
    "manifiesto contapymepuq",
    "contaempleos magallanes",
    "diario regional punta arenas",
    "software contable patagonia",
    "crear empresa punta arenas"
  ],
  alternates: {
    canonical: "https://www.contapymepuq.cl/nosotros",
  },
  openGraph: {
    title: "Manifiesto Estratégico | ContaPymePUQ y ContaEmpleos",
    description: "Tú haz crecer tu negocio. Nosotros nos encargamos de los números. Conoce nuestra visión para la economía de Magallanes.",
    url: "https://www.contapymepuq.cl/nosotros",
    siteName: "ContaPymePUQ",
    locale: "es_CL",
    type: "website",
  },
};

export default function NosotrosPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "ContaPymePUQ",
      "url": "https://www.contapymepuq.cl",
      "logo": "https://www.contapymepuq.cl/logo-contapyme.png",
      "slogan": "Tú haz crecer tu negocio. Nosotros nos encargamos de los números.",
      "description": "Ecosistema digital integral para la formalización, gestión contable, reclutamiento laboral e inteligencia económica en Magallanes y la Patagonia.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Punta Arenas",
        "addressRegion": "Magallanes y de la Antártica Chilena",
        "addressCountry": "CL"
      }
    }
  };

  return (
    <div className="relative py-12 sm:py-20 overflow-hidden selection:bg-primary/20">
      {/* Schema.org AboutPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Fondos de luz ambiental */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none -z-10 blur-3xl" />
      <div className="absolute top-1/3 right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[140px] -z-10 pointer-events-none opacity-50" />
      <div className="absolute bottom-1/4 left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] -z-10 pointer-events-none opacity-40" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-6xl space-y-16 sm:space-y-24">
        
        {/* ===== HERO: MANIFIESTO Y PROPÓSITO ===== */}
        <div className="space-y-6 sm:space-y-8 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Arquitectura Estratégica & Manifiesto
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.92] text-foreground">
              Tú haz crecer tu negocio. <br />
              <span className="text-primary font-serif">Nosotros nos encargamos de los números.</span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
              ContaPymePUQ nació para derribar las barreras burocráticas y conectar el motor productivo de Magallanes: desde la formalización legal de una empresa, hasta la gestión contable, la contratación de talento y la información económica regional.
            </p>
          </div>

          {/* Pastilla del Propósito Central */}
          <div className="p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-background to-blue-500/10 border-2 border-primary/20 shadow-2xl shadow-primary/10 text-left space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
              <Compass className="h-4 w-4 text-primary" />
              <span>Nuestro Propósito Central (Core Purpose)</span>
            </div>
            <blockquote className="text-lg sm:text-2xl font-black italic uppercase tracking-tight text-foreground leading-snug">
              «Liberar el potencial productivo de las personas y empresas, derribando las barreras burocráticas y operativas para construir una economía formal, próspera y conectada desde el fin del mundo.»
            </blockquote>
          </div>
        </div>

        {/* ===== MISIÓN Y VISIÓN 2035 (GRID DUAL) ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* Tarjeta de Misión */}
          <div className="p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] bg-white border border-border/80 shadow-xl space-y-6 flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20 shadow-xs">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary block">
                  Tiempo Presente Continuo
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic text-foreground">
                  Misión Estratégica
                </h2>
              </div>
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-normal">
                Impulsar el crecimiento sostenible de las micro, pequeñas y medianas empresas mediante un ecosistema digital integral que automatiza su ciclo de vida: desde la formalización legal y la gestión contable-tributaria, hasta la atracción de talento humano con procesos de selección ágiles y transparentes. Democratizamos la tecnología y la inteligencia económica regional para que los emprendedores se enfoquen exclusivamente en crear valor, mientras nosotros blindamos sus números y conectamos a la comunidad con empleo digno.
              </p>
            </div>

            <div className="pt-4 border-t border-border/50 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Eficiencia Operativa • Blindaje SII • Ley 40H</span>
            </div>
          </div>

          {/* Tarjeta de Visión */}
          <div className="p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] bg-slate-950 text-white border-2 border-slate-800 shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 text-cyan-400 flex items-center justify-center font-black text-xl border border-primary/40 shadow-xs">
                <Eye className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 block">
                  Horizonte Estratégico 2026 – 2035
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic text-white">
                  Visión y Meta Audaz (BHAG)
                </h2>
              </div>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Consolidarnos al 2035 como el <strong>Sistema Operativo Económico y Laboral definitivo de la Patagonia y el sur de Chile</strong>: la plataforma donde más del 70% de las nuevas empresas se constituyen, gestionan su contabilidad y reclutan a sus equipos, reconocidos como el estándar indiscutido de eficiencia operativa para las pymes, el canal de empleo más transparente del territorio austral y la fuente de referencia informativa para el desarrollo regional.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span>Liderazgo Digital en el Territorio Austral</span>
            </div>
          </div>
        </div>

        {/* ===== LOS TRES PILARES DEL ECOSISTEMA (THE ECONOMIC FLYWHEEL) ===== */}
        <div className="space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" /> El Volante de Inercia Económico
            </div>
            <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tight text-foreground">
              Un Ecosistema Conectado en 3 Dimensiones
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              No somos un software aislado ni un portal estático: integramos las tres etapas críticas de la actividad económica regional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Pilar 1: Gestión y Formalización */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-md space-y-4 flex flex-col justify-between hover:shadow-xl transition-all">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 w-fit">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
                  1. Formalización & Gestión ERP
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Creación de empresas en 24h ($35.000), facturación electrónica DTE ilimitada, contabilidad IFRS y liquidaciones de sueldo automáticas bajo la Ley 40 Horas.
                </p>
              </div>
              <Link href="/software" className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline uppercase tracking-wider pt-2">
                <span>Explorar Software ERP</span> <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Pilar 2: Empleabilidad y Selección */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-md space-y-4 flex flex-col justify-between hover:shadow-xl transition-all">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 w-fit">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
                  2. ContaEmpleos Magallanes
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Bolsa de trabajo hiperlocal de fricción cero. Postulación directa por WhatsApp, estimador de sueldo líquido en vivo y certificación de legalidad bajo el Art. 2° DT.
                </p>
              </div>
              <Link href="/empleos" className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:underline uppercase tracking-wider pt-2">
                <span>Ver Bolsa de Empleos</span> <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Pilar 3: Información y Trascendencia */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-md space-y-4 flex flex-col justify-between hover:shadow-xl transition-all">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 w-fit">
                  <Newspaper className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
                  3. Diario Regional & Indicadores
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Periodismo de inteligencia económica: cobertura en tiempo real de salmonicultura, hidrógeno verde, logística antártica, comercio y cotizaciones de divisas.
                </p>
              </div>
              <Link href="/noticias" className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:underline uppercase tracking-wider pt-2">
                <span>Leer Diario Regional</span> <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ===== VALORES NUCLEARES (ASHRIDGE FIT) ===== */}
        <div className="p-8 sm:p-12 rounded-3xl sm:rounded-[3rem] bg-zinc-900 text-white space-y-8">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary block">
              Principios Innegociables
            </span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight italic">
              Nuestros Valores Nucleares
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              No son declaraciones decorativas en una pared: son estándares que gobiernan cada línea de código, cada cálculo tributario y cada interacción con nuestros usuarios.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700">
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                <Zap className="h-4 w-4" /> 1. Simplicidad Radical
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Cero burocracia. Cualquier trámite o gestión debe resolverse en menos de 3 clics y en un lenguaje claro y accesible.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                <Scale className="h-4 w-4" /> 2. Rigor y Legalidad
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Blindaje normativo total: cumplimiento estricto del SII, Previred, Art. 10 y Art. 2° del Código del Trabajo.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700">
              <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-wider">
                <Globe className="h-4 w-4" /> 3. Arraigo Austral
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Diseñado para la realidad logística, climática y fiscal de Magallanes: Zona Franca, leyes de excepción y turnos de faena.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                <Users className="h-4 w-4" /> 4. Utilidad Medible
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Cada funcionalidad debe generar un impacto concreto: horas de trabajo ahorradas, multas evitadas o un nuevo empleo conseguido.
              </p>
            </div>
          </div>
        </div>

        {/* ===== BANNER FINAL DE LLAMADO A LA ACCIÓN ===== */}
        <div className="p-8 sm:p-12 rounded-3xl sm:rounded-[3rem] bg-gradient-to-r from-primary via-primary/90 to-blue-600 text-white text-center space-y-6 shadow-2xl shadow-primary/30">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight leading-tight">
              Súmate al Futuro Productivo de Magallanes
            </h2>
            <p className="text-xs sm:text-base text-white/90 leading-relaxed font-medium">
              Ya sea que busques constituir tu primera empresa, ordenar tus cuentas o encontrar a tu próximo colaborador, estamos aquí para respaldarte.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3.5 pt-2">
            <Link href="/crear-empresa">
              <Button size="lg" className="rounded-full h-12 sm:h-14 px-8 text-xs font-black uppercase tracking-widest bg-white text-primary hover:bg-zinc-100 shadow-xl transition-all hover:scale-105 active:scale-95 border-none">
                <Building2 className="mr-2 h-4 w-4" /> Iniciar Mi Empresa ($35K)
              </Button>
            </Link>
            <Link href="/empleos">
              <Button size="lg" variant="outline" className="rounded-full h-12 sm:h-14 px-8 text-xs font-black uppercase tracking-widest bg-primary-foreground/10 hover:bg-white/20 text-white border-white/40 transition-all hover:scale-105 active:scale-95">
                <Briefcase className="mr-2 h-4 w-4" /> Ver Bolsa de Empleos
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
