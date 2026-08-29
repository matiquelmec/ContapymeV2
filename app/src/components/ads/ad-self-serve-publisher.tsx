'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Megaphone, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Building2, 
  Phone, 
  Mail, 
  Sparkles, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function AdSelfServePublisher() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialSlot = searchParams.get('slot') || 'calculator'

  const [loading, setLoading] = useState(false)
  const [slot, setSlot] = useState<'sidebar' | 'calculator' | 'header'>(
    initialSlot === 'sidebar' || initialSlot === 'header' ? initialSlot : 'calculator'
  )
  const [sponsorName, setSponsorName] = useState('')
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const slots = [
    {
      id: 'sidebar',
      name: 'Banner Lateral en Noticias',
      price: 39990,
      priceLabel: '$39.990/mes (~$1.333/día)',
      desc: 'Formato vertical (300x250 o 300x600 px). Visible en todos los artículos del Diario Regional.',
      badge: 'Diario Regional',
    },
    {
      id: 'calculator',
      name: 'Banner Calculadora de Sueldos',
      price: 49990,
      priceLabel: '$49.990/mes (~$1.666/día)',
      desc: 'La página #1 de Magallanes en Google. Público de alta intención: contadores, Pymes y trabajadores.',
      badge: '⭐ Mayor Tráfico',
    },
    {
      id: 'header',
      name: 'Mega Banner Superior (Header)',
      price: 59990,
      priceLabel: '$59.990/mes (~$1.999/día)',
      desc: 'Formato horizontal (728x90 o 970x90 px). Ubicación de máxima presencia en la cabecera.',
      badge: 'Máxima Visibilidad',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sponsorName.trim() || !imageUrl.trim() || !targetUrl.trim()) {
      toast.error('Por favor completa el nombre de tu empresa, la imagen y el enlace de destino.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/checkout/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'ad_banner',
          itemTier: slot,
          contactEmail,
          contactPhone,
          adData: {
            sponsor_name: sponsorName,
            title: title || `Publicidad ${sponsorName}`,
            image_url: imageUrl,
            target_url: targetUrl,
            position: slot === 'sidebar' ? 'news_sidebar' : slot === 'header' ? 'header_top' : 'calculator',
          }
        })
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'Error al procesar la reserva.')
        setLoading(false)
        return
      }

      if (data.init_point) {
        toast.loading('Redirigiendo a Mercado Pago...')
        window.location.href = data.init_point
      } else {
        toast.error('No se pudo generar la orden de pago.')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error inesperado.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* COLUMNA IZQUIERDA: DATOS DEL ANUNCIO (7/12) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-md space-y-5">
          <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-wider">
            <Megaphone className="h-4 w-4" />
            <span>1. Datos de tu Marca y Anuncio</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Nombre de la Empresa / Marca *
                </label>
                <input
                  type="text"
                  required
                  value={sponsorName}
                  onChange={e => setSponsorName(e.target.value)}
                  placeholder="Ej: Automotora Austral, Inmobiliaria Sur"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Título de la Campaña (Opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Promoción Especial Invierno"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                URL de la Imagen / Flyer del Banner *
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://tuempresa.cl/banner-publicitario.jpg"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              <span className="text-[10px] text-muted-foreground pt-1 block">
                💡 Dimensiones recomendadas: 300x250 px (sidebar/calculadora) o 728x90 px (header).
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Enlace de Destino al hacer Clic (WhatsApp o Web) *
              </label>
              <input
                type="url"
                required
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://wa.me/56912345678 o https://tuempresa.cl"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Facturación y Contacto */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-md space-y-5">
          <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-wider">
            <Mail className="h-4 w-4" />
            <span>2. Contacto de Facturación</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                WhatsApp / Teléfono
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+56912345678"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Email para Reportes
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="marketing@tuempresa.cl"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA: SELECCIÓN DE SLOT Y PAGO (5/12) */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        <div className="p-6 rounded-3xl bg-white border border-border shadow-xl space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">
            Selecciona el Espacio a Contratar (30 Días)
          </span>

          <div className="space-y-3">
            {slots.map(s => {
              const isSelected = slot === s.id
              return (
                <label
                  key={s.id}
                  onClick={() => setSlot(s.id as any)}
                  className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/60 shadow-md'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-amber-600 bg-amber-600' : 'border-zinc-300'}`}>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-black uppercase text-foreground">{s.name}</span>
                    </div>
                    <span className="text-xs font-black text-foreground">{s.priceLabel}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium pl-6 pt-1 leading-snug">
                    {s.desc}
                  </p>
                </label>
              )
            })}
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Pagar Espacio con Mercado Pago ➔
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground font-medium pt-2">
              🔒 Publicación activa inmediatamente por 30 días continuos
            </p>
          </div>
        </div>
      </div>

    </form>
  )
}
