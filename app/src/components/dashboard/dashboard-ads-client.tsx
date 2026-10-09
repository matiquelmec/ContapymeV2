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
  LayoutTemplate,
  ShieldCheck,
  Play,
  Trash2,
  PauseCircle,
  PlayCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AdBanner, updateAdBannerStatusAction, deleteAdBannerAction, createManualAdBannerAction } from '@/actions/ads'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

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
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [manualForm, setManualForm] = useState({
    position: 'header_top' as 'calculator' | 'news_sidebar' | 'header_top',
    media_type: 'image' as 'image' | 'video',
    sponsor_name: '',
    title: '',
    image_url: '',
    video_url: '',
    poster_url: '',
    target_url: '',
    contact_whatsapp: '',
    duration_days: 30,
    amount_clp: 59990,
  })

  const activeBanners = banners.filter(b => b.status === 'active')
  const pendingBanners = banners.filter(b => b.status === 'pending' || b.status === 'pending_review')

  const filteredBanners = banners.filter(
    b =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.sponsor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleStatus = async (banner: AdBanner) => {
    const nextStatus = banner.status === 'active' ? 'paused' : 'active'
    toast.loading('Actualizando estado...')
    const res = await updateAdBannerStatusAction(banner.id, nextStatus)
    toast.dismiss()
    if (res.success) {
      toast.success('Estado actualizado a ' + (nextStatus === 'active' ? 'activo' : 'pausado'))
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, status: nextStatus } : b))
    } else {
      toast.error(res.error || 'No se pudo actualizar el estado.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este banner publicitario?')) return
    toast.loading('Eliminando banner...')
    const res = await deleteAdBannerAction(id)
    toast.dismiss()
    if (res.success) {
      toast.success('Banner eliminado.')
      setBanners(prev => prev.filter(b => b.id !== id))
    } else {
      toast.error(res.error || 'Error al eliminar.')
    }
  }

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualForm.sponsor_name || !manualForm.target_url) {
      toast.error('Por favor completa el anunciante y el enlace.')
      return
    }
    if (manualForm.media_type === 'image' && !manualForm.image_url) {
      toast.error('Por favor ingresa la URL de la imagen.')
      return
    }
    if (manualForm.media_type === 'video' && !manualForm.video_url) {
      toast.error('Por favor ingresa la URL del video MP4.')
      return
    }

    setIsSubmitting(true)
    toast.loading('Creando anuncio oficial...')
    const res = await createManualAdBannerAction(manualForm)
    setIsSubmitting(false)
    toast.dismiss()

    if (res.success && res.data) {
      toast.success('Anuncio publicado con exito.')
      setBanners(prev => [res.data, ...prev])
      setIsManualModalOpen(false)
      setManualForm({
        position: 'header_top',
        media_type: 'image',
        sponsor_name: '',
        title: '',
        image_url: '',
        video_url: '',
        poster_url: '',
        target_url: '',
        contact_whatsapp: '',
        duration_days: 30,
        amount_clp: 59990,
      })
    } else {
      toast.error(res.error || 'Error al crear anuncio.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-emerald-500/10 border border-amber-500/20 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span>Guia de Impacto Publicitario en ContaPymePUQ</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="p-3 rounded-2xl bg-white/80 border border-amber-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              1. Calculadora de Sueldos ($49.990)
            </strong>
            <p className="text-[11px] leading-relaxed">
              Herramienta viral de Magallanes con alta exposicion a profesionales y Pymes.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-amber-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              2. Barra Lateral Noticias ($39.990)
            </strong>
            <p className="text-[11px] leading-relaxed">
              Alta permanencia de lectura mientras el publico regional se informa con noticias locales.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-amber-500/10 space-y-1 shadow-2xs">
            <strong className="text-foreground font-black text-[11px] uppercase tracking-wide block">
              3. Cabecera Portada Diario ($59.990)
            </strong>
            <p className="text-[11px] leading-relaxed">
              Ubicacion de maxima visibilidad en portada con soporte para spot en video o imagen HD.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-border/80 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Total Banners Registrados
              </span>
              <span className="text-2xl sm:text-3xl font-black text-foreground">{banners.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Megaphone className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/80 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Activos en Difusion
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{activeBanners.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/80 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Pendientes de Revision / Pago
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600">{pendingBanners.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-border/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por marca, titulo o posicion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 rounded-2xl bg-zinc-50 border-zinc-200 text-xs font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsManualModalOpen(true)}
            variant="outline"
            className="rounded-2xl h-11 px-4 text-xs font-black uppercase tracking-wider border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2 shrink-0 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>+ Cargar Anuncio Manual</span>
          </Button>
          <Link href="/anunciar">
            <Button className="rounded-2xl h-11 px-5 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/20 shrink-0 cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>Ver Portal Comercial</span>
            </Button>
          </Link>
        </div>
      </div>

      {filteredBanners.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-border/60 space-y-4">
          <div className="p-4 rounded-full bg-primary/10 text-primary inline-block">
            <LayoutTemplate className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black uppercase tracking-tight text-foreground">
              No tienes banners publicitarios registrados
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Puedes cargar anuncios directamente con el boton superior o compartir el enlace de /anunciar a tus clientes.
            </p>
          </div>
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
                    className={'rounded-lg text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 ' + (banner.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800')}
                  >
                    {banner.status === 'active' ? 'Activo en Difusion' : 'Pendiente / Pausado'}
                  </Badge>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {POSITION_LABELS[banner.position] || banner.position}
                  </span>
                </div>

                {banner.video_url || banner.media_type === 'video' ? (
                  <div className="w-full aspect-video rounded-2xl bg-black border border-zinc-200 overflow-hidden relative">
                    <video
                      src={banner.video_url || banner.image_url}
                      poster={banner.poster_url}
                      className="w-full h-full object-cover"
                      muted
                      controls
                    />
                  </div>
                ) : banner.image_url ? (
                  <div className="w-full h-36 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden relative flex items-center justify-center">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}

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
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(banner)}
                    className="rounded-xl h-8 text-[11px] font-bold cursor-pointer"
                  >
                    {banner.status === 'active' ? (
                      <>
                        <PauseCircle className="w-3.5 h-3.5 mr-1 text-amber-600" /> Pausar
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Activar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(banner.id)}
                    className="rounded-xl h-8 text-[11px] text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <a
                  href={banner.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-black uppercase text-primary hover:text-primary/80 transition-colors"
                >
                  <span>Ver Destino</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Cargar Anuncio Manual (Superadmin)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Publica anuncios de marcas que pagaron por transferencia o convenio directo por WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateManual} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1">Nombre de la Empresa</label>
              <Input
                required
                value={manualForm.sponsor_name}
                onChange={e => setManualForm(p => ({ ...p, sponsor_name: e.target.value }))}
                placeholder="Ej. Austral Inversiones SpA"
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1">Titulo del Anuncio</label>
              <Input
                value={manualForm.title}
                onChange={e => setManualForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ej. Nueva Sucursal en Punta Arenas"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1">Ubicacion</label>
                <select
                  value={manualForm.position}
                  onChange={e => setManualForm(p => ({ ...p, position: e.target.value as any }))}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium"
                >
                  <option value="header_top">Cabecera Portada (Header)</option>
                  <option value="calculator">Calculadora de Sueldos</option>
                  <option value="news_sidebar">Barra Lateral Noticias</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1">Formato</label>
                <select
                  value={manualForm.media_type}
                  onChange={e => setManualForm(p => ({ ...p, media_type: e.target.value as any }))}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium"
                >
                  <option value="image">Imagen Grafica (WebP/JPG)</option>
                  <option value="video">Spot de Video (MP4)</option>
                </select>
              </div>
            </div>

            {manualForm.media_type === 'image' ? (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1">URL de la Imagen</label>
                <Input
                  required
                  value={manualForm.image_url}
                  onChange={e => setManualForm(p => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://ejemplo.com/banner.webp o /images/..."
                  className="rounded-xl"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1">URL del Video (MP4)</label>
                  <Input
                    required
                    value={manualForm.video_url}
                    onChange={e => setManualForm(p => ({ ...p, video_url: e.target.value }))}
                    placeholder="/Digital_business_card_advertisement_optimized.mp4"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1">URL Poster (Opcional)</label>
                  <Input
                    value={manualForm.poster_url}
                    onChange={e => setManualForm(p => ({ ...p, poster_url: e.target.value }))}
                    placeholder="/ad-business-card-poster.webp"
                    className="rounded-xl"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1">URL de Destino (Link)</label>
              <Input
                required
                value={manualForm.target_url}
                onChange={e => setManualForm(p => ({ ...p, target_url: e.target.value }))}
                placeholder="https://www.cliente.cl"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1">Duracion (Dias)</label>
                <Input
                  type="number"
                  value={manualForm.duration_days}
                  onChange={e => setManualForm(p => ({ ...p, duration_days: Number(e.target.value) || 30 }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1">Monto Cobrado (CLP)</label>
                <Input
                  type="number"
                  value={manualForm.amount_clp}
                  onChange={e => setManualForm(p => ({ ...p, amount_clp: Number(e.target.value) || 0 }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-primary text-white font-bold"
              >
                {isSubmitting ? 'Publicando...' : 'Publicar Anuncio al Aire'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
