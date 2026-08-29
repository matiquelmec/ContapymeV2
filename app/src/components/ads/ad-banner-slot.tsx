'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ArrowRight, ExternalLink, Megaphone } from 'lucide-react'
import { getActiveAdBanner, AdBanner } from '@/actions/ads'

interface AdBannerSlotProps {
  position: 'calculator' | 'news_sidebar' | 'header_top'
  className?: string
}

export function AdBannerSlot({ position, className = '' }: AdBannerSlotProps) {
  const [banner, setBanner] = useState<AdBanner | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveAdBanner(position)
      .then(b => setBanner(b))
      .finally(() => setLoading(false))
  }, [position])

  const slotInfo = {
    calculator: {
      title: 'Espacio Publicitario Exclusivo',
      badge: 'Calculadora de Sueldos • Alto Tráfico',
      price: '$49.990/mes (~$1.666/día)',
      desc: 'Llega a miles de contadores, trabajadores y dueños de Pymes en la página #1 de Magallanes.',
      slotParam: 'calculator',
    },
    news_sidebar: {
      title: 'Tu Marca en el Diario Regional',
      badge: 'Diario Regional • Alta Frecuencia',
      price: '$39.990/mes (~$1.333/día)',
      desc: 'Banner lateral visible mientras los lectores revisan las noticias locales.',
      slotParam: 'sidebar',
    },
    header_top: {
      title: 'Mega Banner Cabecera',
      badge: 'Máxima Visibilidad • Portada',
      price: '$59.990/mes (~$1.999/día)',
      desc: 'Ubicación premium en la parte superior del portal para marcas destacadas.',
      slotParam: 'header',
    },
  }[position]

  // Si hay un banner activo contratado por un cliente
  if (banner && banner.image_url) {
    return (
      <div className={`rounded-3xl overflow-hidden border border-border shadow-md bg-white group relative ${className}`}>
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider">
          Publicidad
        </div>
        <a
          href={banner.target_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative overflow-hidden"
        >
          <img
            src={banner.image_url}
            alt={banner.title || 'Anuncio Patrocinado'}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </a>
      </div>
    )
  }

  // Fallback: Banner de la Casa invitando a contratar el espacio
  return (
    <div className={`p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-primary/10 border-2 border-dashed border-amber-500/30 text-center space-y-3 relative overflow-hidden group hover:border-amber-500/60 transition-all ${className}`}>
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

      <div className="text-sm font-black text-amber-900">
        {slotInfo.price}
      </div>

      <div className="pt-1">
        <Link
          href={`/anunciar?slot=${slotInfo.slotParam}`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider px-5 h-10 shadow-md shadow-amber-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <span>Reservar Este Espacio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
