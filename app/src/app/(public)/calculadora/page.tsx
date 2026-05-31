import { PublicSalaryCalculator } from "@/components/public-salary-calculator";
import { getLatestIndicators } from "@/actions/indicators";
import { MarketTicker } from "@/components/market-ticker";
import { Calculator, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 600; // Refrescar indicadores cada 10 min

export const metadata: Metadata = {
  title: "Calculadora de Sueldo Líquido a Base y Costo Empleador",
  description: "Simula el sueldo base imponible, retenciones de leyes sociales chilenas y costo real de contratación para Magallanes y zonas extremas.",
  keywords: ["calculadora de sueldo", "sueldo liquido a base", "costo contratacion chile", "leyes sociales punta arenas", "zona franca beneficio tributario", "dl 889"],
};

export default async function CalculadoraPublicaPage() {
  const indicatorsRes = await getLatestIndicators();
  const indicators = indicatorsRes.success ? indicatorsRes.data : [];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <MarketTicker indicators={indicators} />
      
      <main className="flex-1 py-16 px-6 sm:px-12">
        <div className="container mx-auto max-w-6xl space-y-12">
          
          {/* Cabecera contextual */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.4em]">
              <Calculator className="h-3 w-3" /> Herramientas Institucionales
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.9] text-foreground">
              Simulador Contable <br />
              <span className="text-muted-foreground/30">Magallanes & Zonas Extremas.</span>
            </h1>
            <p className="text-muted-foreground font-medium italic text-sm sm:text-base max-w-xl">
              Calcula con precisión de centavos tus remuneraciones brutas, retenciones de AFP/Isapre/AFC e impuestos de segunda categoría, aplicando los beneficios exclusivos de la región.
            </p>
          </div>

          {/* Componente Central */}
          <PublicSalaryCalculator />

          {/* Información legal al pie */}
          <div className="bg-white/80 border border-neutral-200/50 rounded-3xl p-6 sm:p-8 space-y-4 max-w-4xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Notas de Cumplimiento Normativo (Leyes 2026)
            </h4>
            <div className="text-[10px] text-muted-foreground/80 leading-relaxed space-y-2">
              <p>
                * Esta herramienta calcula de forma exacta el sueldo base a partir del líquido deseado usando el método de bisección matemática. Los cálculos incluyen el tope imponible actualizado para el año en curso (84.3 UF para AFP/Salud y 126.6 UF para AFC).
              </p>
              <p>
                * Para Magallanes y zonas extremas (DL 889), se aplica automáticamente la rebaja proporcional del impuesto único de segunda categoría según los parámetros establecidos por el SII y la Tesorería General de la República.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
