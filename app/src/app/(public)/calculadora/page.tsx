import { Metadata } from "next";
import Link from "next/link";
import { PublicSalaryCalculator } from "@/components/public-salary-calculator";
import { 
  Calculator, 
  ShieldCheck, 
  HelpCircle, 
  TrendingUp, 
  Percent, 
  Building2, 
  Briefcase, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Info,
  Scale,
  DollarSign
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";

export const metadata: Metadata = {
  title: "Calculadora de Sueldo Líquido y Bruto Chile 2026 (Gratis) | ContaPymePUQ",
  description: "Calcula de forma exacta tu sueldo líquido, bruto y costo empleador en Chile (2026). Incluye descuentos AFP, Fonasa/Isapre (7%), Seguro de Cesantía AFC, Impuesto Único de Segunda Categoría, Gratificación Legal y beneficios de Zona Extrema (Magallanes DL 889).",
  keywords: [
    "calculadora de sueldo",
    "calculadora sueldo liquido chile",
    "calcular sueldo bruto chile",
    "sueldo liquido a bruto chile 2026",
    "simulador liquidacion de sueldo",
    "descuentos afp fonasa isapre chile",
    "impuesto unico segunda categoria 2026",
    "tabla tramos impuesto unico sii",
    "comisiones afp chile 2026",
    "ley 40 horas remuneraciones",
    "gratificacion legal articulo 50",
    "costo empresa trabajador chile",
    "sueldo liquido magallanes dl 889"
  ],
  alternates: {
    canonical: "https://www.contapymepuq.cl/calculadora",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
  openGraph: {
    title: "Calculadora de Sueldo Líquido, Bruto y Costo Empleador Chile 2026",
    description: "Simulador de liquidación de sueldo gratuito bajo la normativa vigente de la Dirección del Trabajo (DT) y SII. Cálculo exacto con Ley 40 Horas y Zona Austral.",
    url: "https://www.contapymepuq.cl/calculadora",
    siteName: "ContaPymePUQ",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calculadora de Sueldo Líquido y Bruto Chile 2026",
    description: "Calcula tu sueldo líquido, retenciones de AFP, Salud, AFC e Impuestos en segundos.",
  }
};

export default async function CalculadoraPublicaPage() {
  const jsonLdWebApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Calculadora de Sueldo Líquido y Bruto Chile 2026",
    "url": "https://www.contapymepuq.cl/calculadora",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Herramienta gratuita para calcular sueldos líquidos, brutos, retenciones previsionales (AFP, Salud, AFC), impuesto único de segunda categoría y costo empresa en Chile.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CLP"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ContaPymePUQ",
      "url": "https://www.contapymepuq.cl"
    }
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cómo se calcula el sueldo líquido a partir del sueldo bruto en Chile?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El sueldo líquido se obtiene restando del total de haberes imponibles (sueldo base, gratificación legal, horas extras, comisiones) y no imponibles (colación, movilización) los descuentos legales obligatorios: cotización de AFP (10% + comisión de la administradora), salud (7% Fonasa o Isapre), seguro de cesantía AFC (0.6% en contrato indefinido) y el Impuesto Único de Segunda Categoría del SII si la base tributable supera las 13.5 UTM."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuáles son los descuentos previsionales obligatorios para el trabajador?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Los descuentos legales obligatorios a cargo del trabajador son: 1) AFP: 10% obligatorio más la comisión de la administradora (entre 0.49% en AFP Uno y 1.45% en AFP ProVida). 2) Salud: 7% legal para Fonasa o la cotización pactada en UF para Isapre. 3) Seguro de Cesantía (AFC): 0.6% de la remuneración imponible en contratos a plazo indefinido (en contratos a plazo fijo el trabajador no aporta y el empleador asume el 3%)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo se calcula la Gratificación Legal según el Artículo 50 del Código del Trabajo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La gratificación legal mensual bajo la modalidad del Artículo 50 corresponde al 25% del sueldo base devengado en el mes, con un tope máximo mensual equivalente al 4.75 sueldos mínimos anuales dividido por 12 meses. Con un sueldo mínimo de $500.000+, el tope de gratificación legal mensual ronda los $197.917 a $213.354 CLP."
        }
      },
      {
        "@type": "Question",
        "name": "¿A partir de qué monto se paga Impuesto Único de Segunda Categoría en 2026?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El Impuesto Único de Segunda Categoría es progresivo. Toda renta líquida imponible inferior o igual a 13.5 UTM mensuales está 100% exenta de impuesto ($0 CLP). A partir de 13.5 UTM (aproximadamente $943.000 líquidos imponibles), se aplica el tramo del 4% con rebaja fiscal, incrementándose progresivamente hasta el 40% para rentas superiores a 310 UTM."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué beneficios tributarios aplican para Magallanes y Zonas Extremas (DL 889)?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "En la Región de Magallanes y de la Antártica Chilena, los trabajadores y empleadores cuentan con beneficios especiales como la Bonificación a la Contratación de Mano de Obra (DL 889) equivalente a un porcentaje del sueldo imponible, además de exenciones y rebajas proporcionales en la retención del Impuesto Único por concepto de asignación de zona no imponible."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo impacta la Ley de 40 Horas en las remuneraciones y horas extras?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La Ley 21.561 (40 Horas) reduce la jornada ordinaria laboral sin ninguna disminución en las remuneraciones pactadas. Además, al reducirse el divisor de horas semanales en la fórmula de cálculo, el valor de la hora ordinaria y de la hora extraordinaria (con recargo del 50%) aumenta automáticamente, beneficiando el ingreso de los trabajadores que realizan sobretiempo."
        }
      }
    ]
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "ContaPymePUQ",
        "item": "https://www.contapymepuq.cl"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Calculadora de Sueldo Líquido Chile",
        "item": "https://www.contapymepuq.cl/calculadora"
      }
    ]
  };

  return (
    <AuroraBackground className="min-h-screen flex flex-col selection:bg-primary/20">
      {/* 🤖 SCHEMA.ORG STRUCTURED DATA: WebApplication, FAQPage & BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-6xl space-y-12 sm:space-y-16">
          
          {/* ===== HEADER HERO PRINCIPAL ===== */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              <Calculator className="h-3.5 w-3.5" /> Simulador de Remuneraciones Oficial 2026
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] text-foreground">
              Calculadora de Sueldo <br />
              <span className="text-primary font-serif">Líquido & Bruto Chile.</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm sm:text-lg leading-relaxed max-w-2xl">
              Calcula con precisión matemática tus haberes, retenciones de AFP, Salud (7%), AFC, Impuesto Único del SII y costo empresa bajo la Ley 40 Horas y los beneficios de Zona Austral (DL 889).
            </p>
          </div>

          {/* ===== COMPONENTE CENTRAL: CALCULADORA INTERACTIVA ===== */}
          <PublicSalaryCalculator />

          {/* ===== GUÍA TÉCNICA Y EDUCATIVA DE REMUNERACIONES (E-E-A-T) ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMNA IZQUIERDA: GUÍA CONCEPTUAL Y TABLAS (8/12) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Sección 1: Cómo se compone tu sueldo */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border/80 shadow-md space-y-5">
                <div className="flex items-center gap-2.5 text-primary font-black text-xs uppercase tracking-widest">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Estructura de la Liquidación de Sueldo</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                  ¿Cómo se calcula el Sueldo Líquido a partir del Sueldo Bruto?
                </h2>
                <div className="text-xs sm:text-sm text-foreground/80 leading-relaxed space-y-3">
                  <p>
                    En la legislación laboral chilena (Código del Trabajo), la remuneración de un trabajador se divide en dos grandes grupos: <strong>Haberes Imponibles y Tributables</strong> (sueldo base, gratificación legal, comisiones, bonos de producción y horas extras) y <strong>Haberes No Imponibles</strong> (asignación de colación, movilización, viáticos y asignación familiar).
                  </p>
                  <p>
                    La fórmula general para obtener el sueldo que efectivamente recibes en tu cuenta bancaria es:
                  </p>
                  <div className="p-4 rounded-2xl bg-zinc-900 text-white font-mono text-xs sm:text-sm space-y-1.5 border border-zinc-800">
                    <p className="text-emerald-400 font-bold">Sueldo Líquido = Total Haberes - Descuentos Previsionales - Impuesto Único SII</p>
                    <p className="text-zinc-400 text-[11px]">Donde Descuentos Previsionales = AFP (10% + comisión) + Salud (7%) + AFC (0.6%)</p>
                  </div>
                </div>
              </div>

              {/* Sección 2: Tabla de Comisiones de AFPs 2026 */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border/80 shadow-md space-y-5">
                <div className="flex items-center gap-2.5 text-emerald-600 font-black text-xs uppercase tracking-widest">
                  <Percent className="h-4 w-4 text-emerald-600" />
                  <span>Comisiones de AFP en Chile (Vigentes 2026)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                  Porcentaje de Descuento por Administradora de Fondos de Pensiones
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Todo trabajador dependiente cotiza obligatoriamente un <strong>10% para su fondo de pensiones</strong>, más la comisión porcentual que cobra su respectiva AFP:
                </p>
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 text-foreground font-black uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">AFP</th>
                        <th className="p-3">Comisión (%)</th>
                        <th className="p-3">Descuento Total Trabajador (%)</th>
                        <th className="p-3">Tipo de Afiliado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-muted-foreground">
                      <tr className="bg-emerald-50/50 text-emerald-950 font-bold">
                        <td className="p-3">AFP Uno</td>
                        <td className="p-3">0.49%</td>
                        <td className="p-3 text-emerald-600 font-black">10.49%</td>
                        <td className="p-3">Comisión más baja (Licitación)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-foreground">AFP Modelo</td>
                        <td className="p-3">0.58%</td>
                        <td className="p-3 text-foreground font-bold">10.58%</td>
                        <td className="p-3">Afiliados antiguos y nuevos</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-foreground">AFP Planvital</td>
                        <td className="p-3">1.16%</td>
                        <td className="p-3 text-foreground font-bold">11.16%</td>
                        <td className="p-3">Estándar mercado</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-foreground">AFP Habitat</td>
                        <td className="p-3">1.27%</td>
                        <td className="p-3 text-foreground font-bold">11.27%</td>
                        <td className="p-3">Estándar mercado</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-foreground">AFP Capital</td>
                        <td className="p-3">1.44%</td>
                        <td className="p-3 text-foreground font-bold">11.44%</td>
                        <td className="p-3">Estándar mercado</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-foreground">AFP Cuprum</td>
                        <td className="p-3">1.44%</td>
                        <td className="p-3 text-foreground font-bold">11.44%</td>
                        <td className="p-3">Estándar mercado</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-foreground">AFP ProVida</td>
                        <td className="p-3">1.45%</td>
                        <td className="p-3 text-foreground font-bold">11.45%</td>
                        <td className="p-3">Estándar mercado</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sección 3: Tabla de Tramos del Impuesto Único de Segunda Categoría (SII) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border/80 shadow-md space-y-5">
                <div className="flex items-center gap-2.5 text-indigo-600 font-black text-xs uppercase tracking-widest">
                  <Scale className="h-4 w-4 text-indigo-600" />
                  <span>Impuesto Único de Segunda Categoría (SII 2026)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                  Escala Progresiva de Impuestos Mensuales
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El impuesto se aplica sobre la <strong>Renta Líquida Imponible</strong> (después de descontar AFP, Salud y AFC). Si tu sueldo tributable no supera las <strong>13.5 UTM</strong>, tu impuesto es <strong>$0 CLP</strong>:
                </p>
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 text-foreground font-black uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Tramo Renta Imponible (UTM)</th>
                        <th className="p-3">Factor / Tasa</th>
                        <th className="p-3">Cantidad a Rebajar (UTM)</th>
                        <th className="p-3">Tasa Efectiva Máxima</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-muted-foreground">
                      <tr className="bg-emerald-50/50 font-bold text-emerald-950">
                        <td className="p-3">0 a 13.5 UTM (Hasta ~$943.000)</td>
                        <td className="p-3 text-emerald-600 font-black">EXENTO (0%)</td>
                        <td className="p-3">0.00</td>
                        <td className="p-3">0.0%</td>
                      </tr>
                      <tr>
                        <td className="p-3">13.5 a 30.0 UTM</td>
                        <td className="p-3 font-bold text-foreground">4% (0.04)</td>
                        <td className="p-3">0.540</td>
                        <td className="p-3">2.2%</td>
                      </tr>
                      <tr>
                        <td className="p-3">30.0 a 50.0 UTM</td>
                        <td className="p-3 font-bold text-foreground">8% (0.08)</td>
                        <td className="p-3">1.740</td>
                        <td className="p-3">4.5%</td>
                      </tr>
                      <tr>
                        <td className="p-3">50.0 a 70.0 UTM</td>
                        <td className="p-3 font-bold text-foreground">13.5% (0.135)</td>
                        <td className="p-3">4.490</td>
                        <td className="p-3">7.1%</td>
                      </tr>
                      <tr>
                        <td className="p-3">70.0 a 90.0 UTM</td>
                        <td className="p-3 font-bold text-foreground">23% (0.23)</td>
                        <td className="p-3">11.140</td>
                        <td className="p-3">10.6%</td>
                      </tr>
                      <tr>
                        <td className="p-3">90.0 a 120.0 UTM</td>
                        <td className="p-3 font-bold text-foreground">30.4% (0.304)</td>
                        <td className="p-3">17.800</td>
                        <td className="p-3">15.6%</td>
                      </tr>
                      <tr>
                        <td className="p-3">120.0 a 310.0 UTM</td>
                        <td className="p-3 font-bold text-foreground">35% (0.35)</td>
                        <td className="p-3">23.320</td>
                        <td className="p-3">27.5%</td>
                      </tr>
                      <tr className="bg-rose-50/50 text-rose-950 font-bold">
                        <td className="p-3">Más de 310.0 UTM</td>
                        <td className="p-3 text-rose-600 font-black">40% (0.40)</td>
                        <td className="p-3">38.820</td>
                        <td className="p-3">Hasta 40.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sección 4: Preguntas Frecuentes (FAQ) en formato Accordion */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border/80 shadow-md space-y-6">
                <div className="flex items-center gap-2.5 text-primary font-black text-xs uppercase tracking-widest">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span>Preguntas Frecuentes de Remuneraciones</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                  Dudas Clave sobre Sueldos y Contratos en Chile
                </h3>

                <div className="space-y-4">
                  {jsonLdFaq.mainEntity.map((faq, idx) => (
                    <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                      <h4 className="text-sm font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        {faq.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-4">
                        {faq.acceptedAnswer.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* COLUMNA DERECHA: APORTES PATRONALES, MAGALLANES & INTERLINKING (4/12) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Costo Empresa / Aportes Patronales */}
              <div className="p-6 rounded-3xl bg-white border border-border/80 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider">
                  <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Aportes Patronales (Costo Empresa)</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Además del sueldo pactado, el empleador financia mensualmente los siguientes seguros y aportes obligatorios:
                </p>
                <ul className="space-y-2.5 text-xs text-foreground font-semibold">
                  <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span>Seguro Invalidez (SIS):</span>
                    <span className="font-mono font-black text-primary">1.49%</span>
                  </li>
                  <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span>Accidentes Trabajo (Mutual):</span>
                    <span className="font-mono font-black text-primary">0.93% + cot. adic.</span>
                  </li>
                  <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span>AFC Empleador (Indefinido):</span>
                    <span className="font-mono font-black text-primary">2.40%</span>
                  </li>
                  <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span>AFC Empleador (Plazo Fijo):</span>
                    <span className="font-mono font-black text-primary">3.00%</span>
                  </li>
                </ul>
              </div>

              {/* Beneficio Zona Extrema (Magallanes DL 889) */}
              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Beneficio Magallanes (DL 889)</span>
                </div>
                <p className="text-xs text-emerald-950/85 leading-relaxed font-medium">
                  Las empresas radicadas en la Región de Magallanes cuentan con la bonificación fiscal a la contratación (DL 889) equivalente al <strong>17% de la remuneración imponible</strong> con tope en Grado 1A.
                </p>
              </div>

              {/* CTA 1: Interlinking con ContaEmpleos */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-blue-500/10 border border-primary/20 shadow-md space-y-3">
                <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                  <Briefcase className="h-4 w-4 text-primary shrink-0" />
                  <span>¿Buscas Trabajo con este Sueldo?</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Explora las ofertas laborales verificadas en Punta Arenas, Natales y faenas de Magallanes con postulación directa por WhatsApp.
                </p>
                <Link href="/empleos" className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider py-3 shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  <span>Ver Ofertas de Empleo ➔</span>
                </Link>
              </div>

              {/* CTA 2: Interlinking con Software ERP y Creación de Empresa */}
              <div className="p-6 rounded-3xl bg-white border border-border shadow-md space-y-3">
                <div className="flex items-center gap-2 text-foreground font-black text-xs uppercase tracking-wider">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span>¿Eres Empleador o Pyme?</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Genera automáticamente contratos de trabajo, liquidaciones con firma digital y el Libro de Remuneraciones Electrónico (LRE) para la Dirección del Trabajo.
                </p>
                <Link href="/dashboard/payroll" className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-zinc-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider py-3 shadow-md transition-all hover:scale-105 active:scale-95">
                  <span>Probar Módulo de Nómina ➔</span>
                </Link>
              </div>

            </div>

          </div>

        </div>
      </main>
    </AuroraBackground>
  );
}
