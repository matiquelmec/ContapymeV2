'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Newspaper, Brain, ChevronRight } from 'lucide-react'
import { RegionalNews } from '@/lib/types/dashboard'

interface RegionalNewsFeedProps {
  news: RegionalNews[]
  onSelectNews: (news: RegionalNews) => void
}

export function RegionalNewsFeed({ news, onSelectNews }: RegionalNewsFeedProps) {
  return (
    <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-500/10 flex flex-col h-full">
      <CardHeader className="bg-muted/5 border-b border-border p-5 sm:p-8 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 shrink-0">
            <Newspaper className="w-5 h-5 text-blue-600 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-foreground uppercase tracking-tight">Magallanes News</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">INTELIGENCIA ARTIFICIAL EN TIEMPO REAL</CardDescription>
          </div>
        </div>
        {news.length > 0 && (
          <span className="flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-[450px] scrollbar-thin scrollbar-thumb-muted">
        {news.length === 0 ? (
           <div className="text-center py-20 px-8">
             <div className="w-16 h-16 rounded-full border border-dashed border-border mx-auto mb-4 flex items-center justify-center bg-muted/20">
                <Brain className="w-6 h-6 text-muted-foreground/50" />
             </div>
             <p className="font-bold text-muted-foreground text-sm max-w-[250px] mx-auto">
               El motor de IA está rastreando las últimas noticias económicas de la región.
             </p>
           </div>
        ) : (
           <div className="divide-y divide-border/50">
             {news.map((item) => (
               <div 
                  key={item.id} 
                  onClick={() => onSelectNews(item)}
                  className="group flex gap-4 sm:gap-5 p-4 sm:p-6 hover:bg-muted/30 transition-all cursor-pointer items-start"
               >
                 <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted overflow-hidden border border-border shrink-0 shadow-sm relative group-hover:shadow-md transition-shadow">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <Newspaper className="w-8 h-8 text-primary/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[8px] font-black text-white/90 uppercase tracking-widest flex items-center gap-1"><Brain className="w-2.5 h-2.5"/> AI SUMMARY</span>
                    </div>
                 </div>
                 
                 <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20`}>
                        {item.category}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-bold tracking-wider">
                        {new Date(item.published_at).toLocaleDateString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-black text-foreground text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground font-bold text-xs line-clamp-2 leading-relaxed">
                      {item.summary || item.content?.substring(0, 100) + '...'}
                    </p>
                 </div>
                 <ChevronRight className="w-5 h-5 text-muted-foreground/30 mt-6 group-hover:text-primary group-hover:translate-x-1 transition-all" />
               </div>
             ))}
           </div>
        )}
      </CardContent>
    </Card>
  )
}
