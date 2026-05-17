'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Globe, Calendar, MessageCircle, Share2, Instagram, Download, Loader2 } from 'lucide-react'
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

      {/* Featured Image */}
      <div className={cn(
        "relative w-full overflow-hidden border border-border shadow-2xl shadow-primary/10",
        isModal ? "aspect-video rounded-t-[2.5rem]" : "aspect-[16/9] rounded-[3rem]"
      )}>
        <Image
          src={news.image_url || "/news-placeholder.png"}
          alt={news.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
          <span className="text-[10px] font-black tracking-widest text-primary-foreground italic px-4 py-1.5 border border-primary/50 rounded-lg bg-primary/90 backdrop-blur-xl shadow-lg shadow-primary/20">
            {news.category}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "space-y-8",
        isModal ? "p-8" : "py-12 max-w-4xl mx-auto"
      )}>
        {/* Header Information */}
        <div className="space-y-6">
          <h1 className={cn(
            "font-black italic tracking-tighter leading-[0.9] uppercase text-foreground",
            isModal ? "text-3xl md:text-4xl" : "text-5xl md:text-7xl"
          )}>
            {news.title}
          </h1>
          
          <div className="flex items-center gap-6 text-[10px] md:text-[11px] font-black text-muted-foreground/50 uppercase tracking-widest italic border-y border-border/50 py-6" suppressHydrationWarning>
            <span className="flex items-center gap-2 text-primary" suppressHydrationWarning>
              <Globe className="h-3 w-3" /> Diario Punta Arenas
            </span>
            <span className="flex items-center gap-2" suppressHydrationWarning>
              <Calendar className="h-3 w-3" /> 
              <span suppressHydrationWarning>
                {new Date(news.published_at).toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </span>
          </div>
        </div>

        {/* Article Body */}
        <div className={cn(
          "leading-relaxed text-muted-foreground font-medium italic whitespace-pre-line border-l-4 border-primary/20",
          isModal ? "text-base pl-6" : "text-xl md:text-2xl pl-8"
        )}>
          {news.content}
        </div>

        {/* Interactivity Bar */}
        <div className="pt-8 border-t border-border/50 space-y-4">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">
            Compartir Noticia
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
