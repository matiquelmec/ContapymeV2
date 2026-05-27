import { Newspaper, ChevronLeft, Calendar, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getRegionalNews } from "@/actions/news";
import { Card, CardContent } from "@/components/ui/card";
import { MarketTicker } from "@/components/market-ticker";
import { getLatestIndicators } from "@/actions/indicators";

export const revalidate = 600; // Refrescar noticias cada 10 min

export default async function NewsArchivePage() {
  const newsRes = await getRegionalNews();
  const news = newsRes.success ? newsRes.data : [];
  
  const indicatorsRes = await getLatestIndicators();
  const indicators = indicatorsRes.success ? indicatorsRes.data : [];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <MarketTicker indicators={indicators} />
      
      {/* ===== HEADER NAVEGABLE ===== */}
      <header className="sticky top-11 z-50 w-full border-b border-border bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-12">
          <Link href="/" className="flex items-center gap-2 group transition-transform duration-300">
            <Image src="/logo-contapyme.png" alt="Logo" width={140} height={40} className="h-auto w-[120px]" />
          </Link>
          <Link href="/">
             <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest gap-2">
                <ChevronLeft className="h-4 w-4" /> Volver al Inicio
             </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-20 px-6">
        <div className="container mx-auto">
          {/* TÍTULO INSTITUCIONAL */}
          <div className="max-w-4xl mb-20 space-y-4">
             <div className="inline-flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.4em]">
                <Newspaper className="h-3 w-3" /> Hemeroteca Regional & Financiera
             </div>
             <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.85] text-foreground">
                Archivo de Noticias <br />
                <span className="text-muted-foreground/30">Magallanes & Antártica.</span>
             </h1>
          </div>

          {/* GRILLA DE NOTICIAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {news.map((item: any, i: number) => (
              <Link key={i} href={`/noticias/${item.slug}`} className="group block">
                <Card className="h-full rounded-[2rem] border-border bg-white shadow-none hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all overflow-hidden flex flex-col">
                  <div className="relative h-56 overflow-hidden">
                    <div className="absolute inset-0 bg-zinc-900 group-hover:scale-105 transition-transform duration-700">
                       <img 
                          src={item.image_url || "/news-placeholder.jpg"} 
                          alt={item.title} 
                          className="object-cover opacity-80 w-full h-full absolute inset-0"
                       />
                    </div>
                    <div className="absolute top-6 left-6 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[8px] font-black text-white uppercase tracking-widest">
                       {item.category || "General"}
                    </div>
                  </div>
                  <CardContent className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                       <div className="flex items-center gap-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(item.published_at).toLocaleDateString('es-CL')}</span>
                          <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {item.category || "Finanzas"}</span>
                       </div>
                       <h2 className="text-xl font-black italic uppercase italic tracking-tight leading-tight group-hover:text-primary transition-colors">
                          {item.title}
                       </h2>
                       <p className="text-xs font-medium text-muted-foreground italic leading-relaxed line-clamp-3">
                          {item.summary || "Resumen no disponible para esta noticia institucional de la región."}
                       </p>
                    </div>
                    <div className="pt-6 border-t border-zinc-50">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 group-hover:gap-4 transition-all">
                          Leer noticia completa <ArrowRight className="h-3 w-3" />
                       </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-white py-12">
        <div className="container mx-auto px-6 lg:px-12 text-center space-y-4">
             <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
               © 2026 Contapymepuq. Magallanes, Chile. — Información es activo estratégico.
             </div>
        </div>
      </footer>
    </div>
  );
}
