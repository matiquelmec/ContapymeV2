import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLatestIndicators } from "@/actions/indicators";
import { getRegionalNews } from "@/actions/news";
import { DiarioRegionalSection } from "@/components/diario-regional-section";
import { HeroBentoGrid } from "@/components/hero-bento";
import { GlobalMarketPanel } from "@/components/global-market-panel";
import { MacroCalendarWidget } from "@/components/macro-calendar-widget";

export const revalidate = 0;

export default async function HomePage() {
  const indicatorsRes = await getLatestIndicators();
  const indicators = indicatorsRes.success ? indicatorsRes.data : [];

  const newsRes = await getRegionalNews();
  const regionalNews = newsRes.success ? newsRes.data : [];

  return (
    <>
      {/* Malla Superior de Información en Tiempo Real (Local, Macro Global & Calendario Crítico) */}
      <section className="py-12 bg-background" suppressHydrationWarning>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div>
              <HeroBentoGrid indicators={indicators} news={regionalNews} />
            </div>
            <div>
              <GlobalMarketPanel indicators={indicators} />
            </div>
            <div>
              <MacroCalendarWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Diario Regional — LA ESTRELLA de la portada */}
      <DiarioRegionalSection initialNews={regionalNews} indicators={indicators} />

      {/* Mini CTA hacia el Software */}
      <section className="py-16 border-t border-border bg-background">
        <div className="container mx-auto px-6 lg:px-12 text-center space-y-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Plataforma Contable</p>
          <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-foreground">
            ¿Necesitas herramientas contables <br />de grado institucional?
          </h3>
          <p className="text-muted-foreground font-medium italic text-sm max-w-lg mx-auto">
            Facturación SII, conciliación bancaria, remuneraciones LRE, registros criptográficos y más — todo diseñado para Magallanes.
          </p>
          <Link href="/software">
            <Button size="lg" className="text-xs font-black uppercase tracking-widest h-14 px-10 rounded-2xl bg-primary text-primary-foreground hover:shadow-2xl hover:shadow-primary/30 transition-all group">
              Explorar Software <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
