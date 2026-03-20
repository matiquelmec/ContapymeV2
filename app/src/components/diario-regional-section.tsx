import Link from "next/link";
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Globe, TrendingUp, ArrowRight, Sparkles } from "lucide-react"

interface DiarioRegionalSectionProps {
  initialNews: any[]
}

export function DiarioRegionalSection({ initialNews }: DiarioRegionalSectionProps) {
  // Lógica para el Héroe (Noticia Principal)
  const featuredArticle = initialNews.find((n: any) => n.is_featured)
  const heroNews = featuredArticle || (initialNews.length > 0 ? initialNews[0] : null)
  const secondaryNews = initialNews.filter((n: any) => n.id !== heroNews?.id)

  return (
    <section id="diario" className="py-32 bg-white text-foreground overflow-hidden relative" suppressHydrationWarning>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")'}} suppressHydrationWarning />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" suppressHydrationWarning />
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10" suppressHydrationWarning>
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8" suppressHydrationWarning>
            <div className="space-y-6 relative">
               <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary/80 mb-2 italic">
                 <span className="w-10 h-[1px] bg-primary/50" />
                 <Globe className="h-3 w-3 animate-pulse" /> Portal de Noticias Institucional
               </div>
               <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.9] italic text-foreground text-shadow-sm">
                 Diario <span className="text-primary italic font-serif">Punta Arenas</span> <br />
                 <span className="text-muted-foreground/30">& Cono Sur.</span>
               </h2>
               <p className="text-muted-foreground font-medium italic text-lg leading-relaxed max-w-lg">
                 Noticias regionales con enfoque en inversiones y clima. Ahora con links dinámicos para compartir.
               </p>
            </div>
           <div className="flex gap-4">
              <Button variant="outline" className="text-xs font-black uppercase tracking-widest border-border text-muted-foreground hover:bg-muted rounded-2xl h-12 px-8 transition-all">
                Anuarios
              </Button>
              <Button className="text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 transition-all active:scale-95">
                Ver todo
              </Button>
           </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Main News / Featured Article */}
           <div className="lg:col-span-8 group cursor-pointer space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700" suppressHydrationWarning>
              {heroNews ? (
                <Link href={`/noticias/${heroNews.slug}`} scroll={false}>
                  <div key={heroNews.id} className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl shadow-primary/10 hover:border-primary/40 transition-all duration-700">
                     <Image 
                        src={heroNews.image_url || "/news-placeholder.png"} 
                        alt={heroNews.title} 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                     <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                     <div className="absolute bottom-10 left-10 p-2 space-y-4 max-w-xl">
                        <span className="text-[10px] font-black tracking-widest text-primary-foreground italic px-4 py-1.5 border border-primary/50 rounded-lg bg-primary/90 backdrop-blur-xl shadow-lg shadow-primary/20">{heroNews.category}</span>
                        <h3 className="text-3xl md:text-5xl font-black leading-none italic drop-shadow-2xl text-white tracking-tighter uppercase">
                          {heroNews.title}
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-black text-white/70 uppercase tracking-widest italic" suppressHydrationWarning>
                          <span className="flex items-center gap-2" suppressHydrationWarning><span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Diario Punta Arenas</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span suppressHydrationWarning>{new Date(heroNews.published_at).toLocaleDateString('es-CL')}</span>
                        </div>
                     </div>
                  </div>
                </Link>
              ) : (
                <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl bg-muted/20 backdrop-blur-md animate-pulse flex items-center justify-center">
                   <p className="text-muted-foreground font-black italic tracking-widest uppercase text-xs opacity-50">Sincronizando con GPU Local...</p>
                </div>
              )}
           </div>

           {/* Side Content / Market & Ad */}
           <div className="lg:col-span-4 space-y-10">
              <div className="p-8 rounded-[2.5rem] bg-muted/40 backdrop-blur-md border border-border/50 space-y-6 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp className="h-20 w-20 text-primary" />
                 </div>
                 <div className="relative">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Market Pulse</p>
                    <h4 className="text-xl font-black italic mb-6 text-foreground">Resumen Económico</h4>
                    <div className="space-y-4">
                       {[
                         { label: "IPSA Chile", value: "+1.2%", color: "text-emerald-600" },
                         { label: "Petróleo WTI", value: "-0.5%", color: "text-rose-600" },
                         { label: "Cobre (lb)", value: "US$ 4.2", color: "text-emerald-600" }
                       ].map((m, i) => (
                         <div key={i} className="flex justify-between items-center py-3 border-b border-border last:border-none">
                            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{m.label}</span>
                            <span className={`text-xs font-black tabular-nums ${m.color}`}>{m.value}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden group cursor-pointer hover:border-primary/20 transition-colors">
                 <div className="relative space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                       <Sparkles className="h-3 w-3" /> Publicidad Regional
                    </div>
                    <div className="h-32 bg-white/80 backdrop-blur-lg rounded-2xl flex items-center justify-center p-6 border border-primary/10 shadow-sm">
                       <div className="text-center">
                          <p className="text-lg font-black italic leading-none text-foreground/80">CAFÉ CENTRAL</p>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">El mejor grano del sur</p>
                       </div>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground/60 italic text-center text-shadow-xs">Apoya lo local, vive Magallanes.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Grid of secondary news */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {secondaryNews.slice(0, 3).map((news: any) => (
             <Link key={news.id} href={`/noticias/${news.slug}`} scroll={false}>
               <div className="group cursor-pointer space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-border/50 shadow-xl shadow-primary/5 group-hover:border-primary/30 transition-all duration-500">
                     <Image 
                        src={news.image_url || "/news-placeholder.png"} 
                        alt={news.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                     />
                     <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                        <span className="text-[8px] font-black tracking-widest text-primary-foreground italic px-3 py-1 border border-primary/50 rounded-lg bg-primary/90 backdrop-blur-xl shadow-lg shadow-primary/10">{news.category}</span>
                     </div>
                  </div>
                  <div className="px-4 pb-4 space-y-4">
                     <h3 className="text-xl font-black leading-tight italic group-hover:text-primary transition-colors text-foreground tracking-tight drop-shadow-sm line-clamp-2 uppercase">{news.title}</h3>
                     <div className="flex items-center justify-between gap-3 pt-2">
                        <span className="text-[10px] font-black text-primary flex items-center gap-1 uppercase tracking-widest">
                          Leer más <ArrowRight className="h-3 w-3" />
                        </span>
                        <p className="text-[10px] font-black text-muted-foreground/40 italic uppercase tracking-[0.2em] whitespace-nowrap" suppressHydrationWarning>{new Date(news.published_at).toLocaleDateString('es-CL')}</p>
                     </div>
                  </div>
               </div>
             </Link>
           ))}
        </div>
      </div>
    </section>
  )
}
