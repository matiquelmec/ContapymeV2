import { Metadata } from 'next'
import { NewsSelfServePublisher } from '@/components/news/news-self-serve-publisher'
import { Newspaper, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Publicar Nota de Prensa o Publirreportaje | Diario Regional Punta Arenas',
  description: 'Difunde noticias institucionales, aperturas y lanzamientos comerciales con cobertura en Google News y redes sociales de Magallanes.',
}

export default function PublicarComunicadoPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-12 selection:bg-indigo-500/20">
      <div className="container mx-auto max-w-5xl space-y-10">
        
        {/* Cabecera */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-600/20 bg-indigo-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" /> Diario Regional & Publirreportajes • Google News
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.92] text-foreground">
            Publica tu Noticia o Reportaje <br />
            <span className="text-indigo-600 font-serif">en el Diario de Magallanes.</span>
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Llega a miles de lectores en Punta Arenas, Puerto Natales y Tierra del Fuego. Tu publicación se indexa oficialmente en <strong>Google News</strong> y se difunde en nuestras plataformas.
          </p>
        </div>

        {/* Formulario Interactivo */}
        <NewsSelfServePublisher />

      </div>
    </div>
  )
}
