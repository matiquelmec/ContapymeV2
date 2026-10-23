'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Maximize2, X, Film, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MediaItem {
  type: 'image' | 'video'
  url: string
  poster?: string
  caption?: string
  credit?: string
}

interface NewsMediaGalleryProps {
  media: MediaItem[]
  className?: string
}

export function NewsMediaGallery({ media, className }: NewsMediaGalleryProps) {
  const [activeImage, setActiveImage] = useState<MediaItem | null>(null)

  if (!media || media.length === 0) return null

  const videos = media.filter((m) => m.type === 'video')
  const images = media.filter((m) => m.type === 'image')

  return (
    <div className={cn("my-10 space-y-8", className)}>
      {/* 1. Módulo de Video (si existe) */}
      {videos.map((vid, idx) => (
        <figure
          key={idx}
          className="overflow-hidden rounded-3xl border border-border/80 bg-zinc-950/90 shadow-xl"
        >
          <div className="relative aspect-video w-full bg-black">
            <video
              controls
              playsInline
              preload="none"
              poster={vid.poster}
              className="h-full w-full object-contain"
            >
              <source src={vid.url} type="video/mp4" />
              Tu navegador no soporta reproducción de video HTML5.
            </video>
          </div>
          {(vid.caption || vid.credit) && (
            <figcaption className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/10 px-6 py-3.5 text-[11px] text-zinc-300">
              <span className="flex items-center gap-2 font-medium">
                <Film className="h-3.5 w-3.5 text-primary" />
                {vid.caption || 'Registro audiovisual adjunto'}
              </span>
              {vid.credit && (
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {vid.credit}
                </span>
              )}
            </figcaption>
          )}
        </figure>
      ))}

      {/* 2. Grilla de Galería Fotográfica */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/70">
            <Camera className="h-3.5 w-3.5 text-primary" />
            <span>Galería de imágenes del registro</span>
          </div>

          <div
            className={cn(
              "grid gap-4",
              images.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
            )}
          >
            {images.map((img, idx) => (
              <figure
                key={idx}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-muted/20 transition-all hover:border-primary/50 hover:shadow-lg"
                onClick={() => setActiveImage(img)}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                  <img
                    src={img.url}
                    alt={img.caption || `Fotografía de cobertura ${idx + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/70 p-2 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                    <Maximize2 className="h-4 w-4" />
                  </div>
                </div>
                {(img.caption || img.credit) && (
                  <figcaption className="p-3 text-[11px] leading-snug text-muted-foreground">
                    {img.caption && <span className="block font-medium text-foreground">{img.caption}</span>}
                    {img.credit && (
                      <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-muted-foreground/60">
                        {img.credit}
                      </span>
                    )}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* 3. Modal / Lightbox para ver fotografía en tamaño completo */}
      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveImage(null)}
        >
          <button
            type="button"
            onClick={() => setActiveImage(null)}
            className="absolute top-6 right-6 rounded-full bg-white/10 p-3 text-white backdrop-blur-md hover:bg-white/20 transition-colors"
            aria-label="Cerrar vista completa"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl bg-zinc-950 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeImage.url}
              alt={activeImage.caption || 'Fotografía en alta resolución'}
              className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
            {activeImage.caption && (
              <p className="mt-3 px-4 text-center text-xs text-zinc-300">
                {activeImage.caption} {activeImage.credit && <span className="text-zinc-500">({activeImage.credit})</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
