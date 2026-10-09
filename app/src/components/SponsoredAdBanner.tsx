'use client'

import React, { useRef, useState } from 'react'
import { ExternalLink, Volume2, VolumeX, Sparkles, ShieldCheck, ArrowRight, Play, Pause } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SponsoredAdBannerProps {
  className?: string
}

export function SponsoredAdBanner({ className = '' }: SponsoredAdBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)

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

  return (
    <section className={`py-12 px-4 relative overflow-hidden ${className}`}>
      <div className="max-w-6xl mx-auto">
        {/* Encabezado sutil de la sección patrocinada */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-gray-500">
              Espacio Promocional • Red ContaPyme
            </span>
          </div>
          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-xs border-indigo-200 text-indigo-700 font-medium">
            <Sparkles className="w-3 h-3 mr-1 text-indigo-500" />
            Proyecto Aliado
          </Badge>
        </div>

        {/* Tarjeta Banner Principal */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-2xl text-white">
          {/* Halos y luces decorativas de fondo */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 lg:p-10 relative z-10">
            {/* Lado izquierdo: Contenido & Propuesta de valor */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Ecosistema Punta Arenas
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Tarjetas de Presentación Digital
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Moderniza tu marca con tu{' '}
                  <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                    Tarjeta de Presentación Digital
                  </span>
                </h3>
                <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                  Lleva tu negocio o profesión al siguiente nivel con una presencia web instantánea: perfiles interactivos, código QR, enlaces directos a WhatsApp y catálogo integrado con la tecnología de <strong>SoyIndi.cl</strong>.
                </p>
              </div>

              {/* Puntos destacados */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  <span>Código QR activo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span>Conexión directa WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                  <span>100% Móvil & Dinámica</span>
                </div>
              </div>

              {/* Botón de llamada a la acción hacia www.soyindi.cl */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="https://www.soyindi.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold px-7 py-3.5 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 rounded-xl group"
                  >
                    <span>Conocer SoyIndi.cl</span>
                    <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </a>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-emerald-400">●</span>
                  <span>Acceso directo sin costo de intermediación</span>
                </div>
              </div>
            </div>

            {/* Lado derecho: Video Player Optimizado */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md aspect-video sm:aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/60 group">
                <video
                  ref={videoRef}
                  src="/Digital_business_card_advertisement_optimized.mp4"
                  poster="/ad-business-card-poster.webp"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {/* Overlay sutil para controles */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Botón de Play/Pause */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
                    className="p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white transition-all transform hover:scale-105 border border-white/20 cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    )}
                  </button>
                  <span className="text-[11px] font-medium text-slate-300 drop-shadow">
                    HD 1080p
                  </span>
                </div>

                {/* Botón de Mute / Unmute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white transition-all transform hover:scale-105 border border-white/20 cursor-pointer"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-slate-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                {/* Badge de estado en la esquina superior */}
                <div className="absolute top-3 left-3 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10 uppercase tracking-wider">
                    Demo Spot
                  </span>
                </div>

                {/* Enlace directo flotante en esquina superior derecha */}
                <a
                  href="https://www.soyindi.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-600/90 hover:bg-indigo-600 text-white backdrop-blur-md transition-colors shadow-sm"
                >
                  <span>soyindi.cl</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
