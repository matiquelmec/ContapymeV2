'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Megaphone, 
  Plus, 
  Search, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  Building2, 
  Clock, 
  ExternalLink,
  DollarSign,
  TrendingUp,
  LayoutTemplate
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AdBanner } from '@/actions/ads'

interface DashboardAdsClientProps {
  initialBanners: AdBanner[]
}

const POSITION_LABELS: Record<string, string> = {
  calculator: 'Calculadora de Sueldos (300x250)',
  news_sidebar: 'Barra Lateral Noticias (300x600)',
  header_top: 'Cabecera Portada Diario (728x90)',
}

export function DashboardAdsClient({ initialBanners }: DashboardAdsClientProps) {
  const [banners, setBanners] = useState<AdBanner[]>(initialBanners)
  const [searchTerm, setSearchTerm] = useState('')

  const activeBanners = banners.filter(b => b.status === 'active')
  const pendingBanners = banners.filter(b => b.status === 'pending')

  const filteredBanners = banners.filter(
    b =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.sponsor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      
      {/* 💡 GUÍA EDUCATIVA PUBLICITARIA */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-emerald-500/10 border border-amber-500/20 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span>Guía de Impacto Publicitario en ContaPymePUQ</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="p-3 rounded-2xl bg-white/80 border border-amber-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              1. Calculadora de Sueldos ($39.990)
            </strong>
            <p className="text-[11px] leading-relaxed">
              Es la herramienta más viral de Magallanes. Tu marca es vista por miles de trabajadores y empleadores que simulan contratos.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-amber-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              2. Barra Lateral Noticias ($49.990)
            </strong>
            <p className="text-[11px] leading-relaxed">
              Banner vertical de alto impacto fijo junto al contenido editorial y notas de prensa más leídas de la región.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-amber-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              3. Redirección Directa a WhatsApp
            </strong>
            <p className="text-[11px] leading-relaxed">
              Cada clic envía al cliente potencial directamente a tu WhatsApp comercial o sitio web sin intermediarios.
            </p>
          </div>
        </div>
      </div>

      {/* 📊 RESUMEN EJECUTIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-border/60 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                Total Espacios Contratados
              </span>
              <span className="text-2xl sm:text-3xl font-black text-foreground">{banners.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Megaphone className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 block">
                Banners Activos (En Difusión)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{activeBanners.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 block">
                Pendientes de Pago
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600">{pendingBanners.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🔍 BARRA DE BÚSQUEDA Y BOTÓN NUEVO BANNER */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-border/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por marca, título o posición..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 rounded-2xl bg-zinc-50 border-zinc-200 text-xs font-medium"
          />
        </div>
        <Link href="/anunciar">
          <Button className="rounded-2xl h-11 px-5 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/20 shrink-0 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Contratar Nuevo Banner</span>
          </Button>
        </Link>
      </div>

      {/* 📋 LISTADO DE BANNERS */}
      {filteredBanners.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-border/60 space-y-4">
          <div className="p-4 rounded-full bg-primary/10 text-primary inline-block">
            <LayoutTemplate className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black uppercase tracking-tight text-foreground">
              No tienes banners publicitarios activos
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Reserva tu espacio publicitario exclusivo en la Calculadora de Sueldos, Barra Lateral de Noticias o Portada desde $1.333/día.
            </p>
          </div>
          <Link href="/anunciar">
            <Button className="rounded-2xl text-xs font-black uppercase tracking-wider gap-2 cursor-pointer bg-primary text-white">
              <Plus className="h-4 w-4" /> Reservar Primer Espacio Publicitario
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className="p-5 rounded-3xl bg-white border border-border/80 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={banner.status === 'active' ? 'default' : 'secondary'}
                    className={`rounded-lg text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 ${
                      banner.status === 'active'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {banner.status === 'active' ? 'Activo en Difusión' : 'Pendiente de Pago'}
                  </Badge>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {POSITION_LABELS[banner.position] || banner.position}
                  </span>
                </div>

                {banner.image_url && (
                  <div className="w-full h-36 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden relative flex items-center justify-center">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="text-sm font-black text-foreground uppercase tracking-tight">
                    {banner.title}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Anunciante: {banner.sponsor_name}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <a
                  href={banner.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Enlace de Destino</span>
                </a>

                <Link
                  href={`/anunciar?slot=${banner.position}`}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-3 py-1.5 rounded-xl transition-all"
                >
                  Renovar / Modificar ➔
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
