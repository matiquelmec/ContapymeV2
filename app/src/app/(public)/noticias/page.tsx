import { Newspaper, Calendar, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getRegionalNews } from "@/actions/news";
import { Card, CardContent } from "@/components/ui/card";
import { AuroraBackground } from "@/components/ui/aurora-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diario Regional de Noticias de Punta Arenas y Magallanes | Contapymepuq",
  description: "Noticias de última hora, economía, finanzas, inversión y actualidad de la Región de Magallanes y la Antártica Chilena. Prensa local independiente.",
  keywords: [
    "diario punta arenas",
    "noticias punta arenas magallanes",
    "diario regional magallanes",
    "prensa punta arenas",
    "economia magallanes",
    "inversion punta arenas"
  ],
  alternates: {
    canonical: "https://www.contapymepuq.cl/noticias",
  },
  openGraph: {
    title: "Diario Regional Magallanes | Contapymepuq Noticias",
    description: "Información económica, empresarial y noticias de última hora en Punta Arenas.",
    url: "https://contapymepuq.cl/noticias",
  },
};

export const revalidate = 300;

export default async function NewsArchivePage() {
  const newsRes = await getRegionalNews();
  const news = newsRes.success ? newsRes.data : [];

  return (
    <AuroraBackground className="min-h-screen py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        {/* Título Institucional y CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-in fade-in slide-in-from-top-4 duration-700">
              <Newspaper className="h-3 w-3" /> Hemeroteca Regional & Diario de Magallanes
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.88] text-foreground animate-in fade-in slide-in-from-left-6 duration-700">
              Diario Regional <br />
              <span className="text-primary font-serif">de Magallanes</span> <span className="text-muted-foreground/35">& Finanzas Australes.</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm sm:text-base max-w-xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              Información económica, inversiones, convenios y actualidad de las empresas y la comunidad de la región austral.
            </p>
          </div>

          <Link
            href="/dashboard/noticias"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-primary/20 hover:border-primary text-primary hover:bg-primary/5 font-black text-xs uppercase tracking-wider px-6 h-12 shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Newspaper className="h-4 w-4 text-primary" />
            <span>+ Publicar Noticia / Comunicado</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>

        {/* Grilla de Noticias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item: any, i: number) => (
            <Link key={i} href={`/noticias/${item.slug}`} className="group block h-full">
              <Card className="h-full rounded-[2.5rem] border-border/80 bg-white/90 shadow-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-500 overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative h-56 overflow-hidden bg-zinc-950">
                    <img 
                      src={item.image_url || "/news-placeholder.jpg"} 
                      alt={item.title} 
                      className="object-cover opacity-90 w-full h-full group-hover:scale-105 transition-transform duration-700 absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-[8px] font-black text-white uppercase tracking-widest">
                      {item.category || "General"}
                    </div>
                  </div>
                  <CardContent className="p-6 sm:p-8 space-y-3">
                    <div className="flex items-center gap-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(item.published_at).toLocaleDateString('es-CL')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {item.category || "Finanzas"}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h2>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-3">
                      {item.summary || "Resumen no disponible para esta noticia institucional de la región."}
                    </p>
                  </CardContent>
                </div>
                <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 group-hover:gap-3 transition-all">
                    Leer noticia completa <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AuroraBackground>
  );
}
