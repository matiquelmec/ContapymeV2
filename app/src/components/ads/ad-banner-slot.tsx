'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Megaphone, Sparkles, Volume2, VolumeX, Play, Pause, ExternalLink } from 'lucide-react'
import { getActiveAdBanners, AdBanner } from '@/actions/ads'
import { SponsoredAdBanner } from '@/components/SponsoredAdBanner'

interface AdBannerSlotProps {
  position: 'calculator' | 'news_sidebar' | 'header_top'
  className?: string
  fallbackToSoyIndi?: boolean
}

export function AdBannerSlot({ position, className = '', fallbackToSoyIndi = false }: AdBannerSlotProps) {
  const [banners, setBanners] = useState<AdBanner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    getActiveAdBanners(position)
      .then(list => {
        setBanners(list || [])
        if (list && list.length > 1) {
          setCurrentIndex(Math.floor(Math.random() * list.length))
        }
      })
      .finally(() => setLoading(false))
  }, [position])

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [banners.length, isPaused])

  const nextBanner = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    setCurrentIndex(prev => (prev + 1) % banners.length)
  }

  const prevBanner = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const slotInfo = {
    calculator: {
      title: 'Espacio Publicitario Exclusivo',
      badge: 'Calculadora de Sueldos • Alto Tráfico',
      price: '$49.990/mes (~$1.666/día) • Anual 25% OFF',
      desc: 'Llega a miles de contadores, trabajadores y dueños de Pymes en la página #1 de Magallanes.',
      slotParam: 'calculator',
    },
    news_sidebar: {
      title: 'Tu Marca en el Diario Regional',
      badge: 'Diario Regional • Alta Frecuencia',
      price: '$39.990/mes (~$1.333/día) • Anual 25% OFF',
      desc: 'Banner lateral visible mientras los lectores revisan las noticias locales.',
      slotParam: 'sidebar',
    },
    header_top: {
      title: 'Mega Banner Cabecera',
      badge: '👑 Máxima Visibilidad • Portada',
      price: '$59.990/mes (~$1.999/día) • Anual 25% OFF',
      desc: 'Ubicación premium en la parte superior del portal para marcas destacadas de la Patagonia.',
      slotParam: 'header',
    },
  }[position]

  if (banners.length > 0) {
    const currentBanner = banners[currentIndex] || banners[0]
    const isVideo = currentBanner.media_type === 'video' || Boolean(currentBanner.video_url)

    return (
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={"rounded-3xl overflow-hidden border border-border shadow-md bg-white dark:bg-zinc-900 group relative transition-all duration-300 " + className}
      >
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
          {banners.length > 1 && (
            <div className="px-2 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-md text-amber-950 text-[8.5px] font-black uppercase tracking-wider shadow-sm">
              Patrocinado ({currentIndex + 1}/{banners.length})
            </div>
          )}
          <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider">
            Publicidad
          </div>
        </div>

        {isVideo ? (
          <div className="relative aspect-video w-full bg-black overflow-hidden">
            <video
              ref={videoRef}
              src={currentBanner.video_url || currentBanner.image_url}
              poster={currentBanner.poster_url}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all cursor-pointer"
                aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all cursor-pointer"
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
            <a
              href={currentBanner.target_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 z-20 inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105"
            >
              <span>Visitar</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <a
            href={currentBanner.target_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative overflow-hidden focus:outline-none"
          >
            <img
              key={currentBanner.id || currentIndex}
              src={currentBanner.image_url}
              alt={currentBanner.title || ('Anuncio ' + currentBanner.sponsor_name)}
              className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-[1.02] animate-in fade-in duration-500"
              loading="lazy"
            />
          </a>
        )}

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevBanner}
              aria-label="Banner anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={nextBanner}
              aria-label="Siguiente banner"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
              {banners.map((b, idx) => (
                <button
                  type="button"
                  key={b.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={'Ir al banner ' + (idx + 1)}
                  className={'h-1.5 rounded-full transition-all cursor-pointer ' + (currentIndex === idx ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/60 hover:bg-white')}
                />
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  if (fallbackToSoyIndi && position === 'header_top') {
    return <SponsoredAdBanner className={className} />
  }

  return (
    <div className={"p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-primary/10 border-2 border-dashed border-amber-500/30 text-center space-y-3 relative overflow-hidden group hover:border-amber-500/60 transition-all " + className}>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 text-[10px] font-black uppercase tracking-widest">
        <Megaphone className="w-3 h-3 text-amber-600" /> {slotInfo.badge}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-black uppercase text-foreground">
          {slotInfo.title}
        </h4>
        <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
          {slotInfo.desc}
        </p>
      </div>
      <div className="text-xs font-black text-amber-900">
        {slotInfo.price}
      </div>
      <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
        <Link
          href={'/anunciar?slot=' + slotInfo.slotParam}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider px-5 h-10 shadow-md shadow-amber-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <span>Reservar Espacio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <a
          href={'https://wa.me/56944444565?text=' + encodeURIComponent("¡Hola! Me gustaría que ustedes diseñen el banner y se encarguen de la publicidad con mi marca en ContaPymePUQ.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-900 font-black text-[11px] uppercase tracking-wider px-4 h-10 transition-all hover:scale-105"
        >
          <span>💬 Diseñar con mi Marca</span>
        </a>
      </div>
      <p className="text-[10px] text-muted-foreground font-medium">
        ¿No tienes diseñador? ¡Nosotros creamos tu banner y gestionamos tu campaña!
      </p>
    </div>
  )
}
