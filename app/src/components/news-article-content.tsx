'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Globe, Calendar, MessageCircle, Share2, Instagram, Download, Loader2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { StoryCard } from './story-card'

interface NewsArticleContentProps {
  news: any
  isModal?: boolean
}

export function NewsArticleContent({ news, isModal = false }: NewsArticleContentProps) {
  const storyCardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  if (!news) return null

  const getCanonicalUrl = () => {
    if (typeof window === 'undefined') return ''
    return `${window.location.protocol}//${window.location.host}/noticias/${news.slug}`
  }

  // Calcular el tiempo estimado de lectura dinámico
  const wordCount = news.content ? news.content.split(/\s+/).length : 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // Dividir el contenido de la noticia en párrafos para un renderizado editorial óptimo
  const paragraphs = news.content 
    ? news.content.split(/\n+/).map((p: string) => p.trim()).filter(Boolean)
    : []

  /**
   * Genera una imagen tipo Story Card (1080x1920) de la noticia
   * y retorna un File listo para compartir.
   */
  const generateStoryImage = async (): Promise<File | null> => {
    if (!storyCardRef.current) return null

    try {
      // Importar html2canvas dinámicamente para no afectar el bundle inicial
      const html2canvas = (await import('html2canvas-pro')).default

      const canvas = await html2canvas(storyCardRef.current, {
        width: 1080,
        height: 1920,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0a',
        logging: false,
      })

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], `noticia-contapyme-${news.slug || 'share'}.png`, { type: 'image/png' }))
          } else {
            resolve(null)
          }
        }, 'image/png', 1.0)
      })
    } catch (error) {
      console.error('Error generando imagen:', error)
      return null
    }
  }

  /**
   * Compartir como IMAGEN → Abre el menú nativo del celular con opciones:
   * Instagram Stories, Instagram Post, WhatsApp, etc.
   */
  const handleShareInstagram = async () => {
    setIsGenerating(true)
    try {
      const file = await generateStoryImage()

      if (!file) {
        // Fallback si no se pudo generar la imagen
        handleShareFallback()
        return
      }

      // Verificar si el navegador soporta compartir archivos
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: news.title,
          text: `📍 ${news.title} — Diario Regional Contapymepuq\n${getCanonicalUrl()}`,
        })
      } else {
        // Si no soporta share con archivos, descargar la imagen
        downloadImage(file)
      }
    } catch (error: any) {
      // Si el usuario canceló el share, no es un error
      if (error?.name !== 'AbortError') {
        console.error('Error al compartir:', error)
        handleShareFallback()
      }
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Descarga la imagen generada al dispositivo del usuario.
   */
  const downloadImage = (file: File) => {
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Descarga directa de la Story Card como imagen.
   */
  const handleDownloadStory = async () => {
    setIsGenerating(true)
    try {
      const file = await generateStoryImage()
      if (file) {
        downloadImage(file)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Fallback: compartir solo con texto/URL
   */
  const handleShareFallback = async () => {
    const shareData = {
      title: news.title,
      text: `📍 NOTICIA REGIONAL — ${news.title}`,
      url: getCanonicalUrl(),
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("Error sharing", err)
      }
    } else {
      navigator.clipboard.writeText(getCanonicalUrl())
      alert("Enlace copiado al portapapeles")
    }
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`📍 *NOTICIA REGIONAL* - ${news.title}\n\nLee más en el portal oficial:\n${getCanonicalUrl()}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <article className={cn(
      "w-full bg-background text-foreground",
      isModal ? "p-0" : "animate-in fade-in duration-1000"
    )}>
      {/* Story Card Invisible (para generación de imagen) */}
      <StoryCard
        ref={storyCardRef}
        title={news.title}
        category={news.category || 'Regional'}
        imageUrl={news.image_url || '/news-placeholder.png'}
        date={news.published_at}
      />

      {/* Imagen Principal Inmersiva */}
      <div className={cn(
        "relative w-full overflow-hidden border border-border/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] group",
        isModal ? "aspect-video rounded-t-[2.5rem]" : "aspect-[21/9] rounded-[3rem]"
      )}>
        <Image
          src={news.image_url || "/news-placeholder.png"}
          alt={news.title}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-102"
          priority
        />
        {/* Degradado inmersivo */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent opacity-90" />
        
        {/* Badge de Categoría flotante de alta fidelidad */}
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
          <span className="text-[10px] font-black tracking-[0.3em] text-primary-foreground italic px-5 py-2.5 border border-primary/50 rounded-xl bg-primary/95 backdrop-blur-xl shadow-2xl uppercase">
            {news.category}
          </span>
        </div>
      </div>

      {/* Contenedor del Artículo con Maquetación de Prensa */}
      <div className={cn(
        "space-y-10",
        isModal ? "p-8" : "py-16 max-w-3xl mx-auto"
      )}>
        
        {/* Encabezado y Metadatos */}
        <div className="space-y-6">
          <h1 className={cn(
            "font-black italic tracking-tighter leading-[0.95] uppercase text-foreground font-serif",
            isModal ? "text-3xl md:text-4xl" : "text-4xl sm:text-5xl md:text-6xl"
          )}>
            {news.title}
          </h1>
          
          {/* Metadatos Editorial Premium con Tiempo de Lectura en Vivo */}
          <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-[10px] md:text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] italic border-y border-border/50 py-6" suppressHydrationWarning>
            <span className="flex items-center gap-2.5 text-primary" suppressHydrationWarning>
              <Globe className="h-4 w-4 animate-spin" style={{ animationDuration: '12s' }} /> Diario Punta Arenas
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
            <span className="flex items-center gap-2.5" suppressHydrationWarning>
              <Calendar className="h-4 w-4 text-sky-500" /> 
              <span suppressHydrationWarning>
                {new Date(news.published_at).toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
            <span className="flex items-center gap-2.5 text-emerald-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Lectura: {readingTime} {readingTime === 1 ? 'minuto' : 'minutos'}
            </span>
          </div>
        </div>

        {/* Bajada de Título / Copete de la Noticia */}
        {news.summary && (
          <div 
            className={cn(
              "leading-relaxed text-foreground font-black italic border-l-4 border-primary pl-6 py-3 bg-primary/5 rounded-r-2xl pr-6 text-justify tracking-wide",
              isModal ? "text-base" : "text-lg md:text-xl"
            )}
            style={{ textAlign: 'justify' }}
          >
            {news.summary}
          </div>
        )}

        {/* Cuerpo de la Noticia Justificado con Estilo Editorial */}
        <div className="space-y-6">
          {paragraphs.map((para: string, idx: number) => {
            // Primer párrafo con Letra Capital (Drop Cap) elegante
            if (idx === 0) {
              return (
                <p 
                  key={idx}
                  className={cn(
                    "text-justify leading-relaxed text-foreground/80 font-medium",
                    "first-letter:text-5xl first-letter:font-black first-letter:text-primary first-letter:mr-3.5 first-letter:float-left first-letter:leading-[0.85] first-letter:mt-1",
                    isModal ? "text-base" : "text-lg md:text-xl"
                  )}
                  style={{ textAlign: 'justify' }}
                >
                  {para}
                </p>
              )
            }
            // Párrafos secundarios perfectamente justificados
            return (
              <p 
                key={idx}
                className={cn(
                  "text-justify leading-relaxed text-muted-foreground font-normal",
                  isModal ? "text-sm" : "text-base md:text-lg"
                )}
                style={{ textAlign: 'justify' }}
              >
                {para}
              </p>
            )
          })}
        </div>

        {/* Barra de Interacción y Compartir */}
        <div className="pt-8 border-t border-border/50 space-y-4">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">
            Compartir Noticia en Redes
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {/* Botón principal: Compartir con Imagen (Stories/Post/etc) */}
            <Button
              variant="outline"
              onClick={handleShareInstagram}
              disabled={isGenerating}
              className="rounded-xl h-12 px-6 text-[10px] font-black uppercase tracking-widest border-[#E1306C]/30 text-[#E1306C] hover:bg-[#E1306C]/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Instagram className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? 'Generando...' : 'Historia / Post'}
            </Button>

            {/* WhatsApp */}
            <Button
              variant="outline"
              onClick={handleWhatsApp}
              className="rounded-xl h-12 px-6 text-[10px] font-black uppercase tracking-widest border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </Button>

            {/* Compartir Link (genérico) */}
            <Button
              variant="outline"
              onClick={handleShareFallback}
              className="rounded-xl h-12 px-6 text-[10px] font-black uppercase tracking-widest border-primary/30 text-primary hover:bg-primary/10 transition-all hover:scale-105 active:scale-95"
            >
              <Share2 className="mr-2 h-4 w-4" /> Compartir Link
            </Button>
          </div>
        </div>

      </div>
    </article>
  )
}
