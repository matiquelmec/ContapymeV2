'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Megaphone, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Building2, 
  Phone, 
  Mail, 
  Sparkles, 
  Loader2, 
  ShieldCheck,
  UserCheck,
  LogIn,
  UserPlus,
  Lock,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { getAdSlotsAvailabilityAction, SlotAvailability } from '@/actions/ads'
import { toast } from 'sonner'

export function AdSelfServePublisher() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialSlot = searchParams.get('slot') || 'calculator'

  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const [slot, setSlot] = useState<'sidebar' | 'calculator' | 'header'>(
    initialSlot === 'sidebar' || initialSlot === 'header' ? initialSlot : 'calculator'
  )
  const [duration, setDuration] = useState<'monthly' | 'semiannual' | 'annual'>('monthly')
  const [sponsorName, setSponsorName] = useState('')
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const [availability, setAvailability] = useState<Record<string, SlotAvailability>>({
    calculator: { position: 'calculator', count: 0, max: 5, available: 5, isFull: false },
    news_sidebar: { position: 'news_sidebar', count: 0, max: 5, available: 5, isFull: false },
    header_top: { position: 'header_top', count: 0, max: 5, available: 5, isFull: false },
  })

  useEffect(() => {
    // Cargar disponibilidad en tiempo real
    getAdSlotsAvailabilityAction().then(res => {
      if (res) setAvailability(res)
    })

    try {
      const saved = localStorage.getItem('draft_ad_banner')
      if (saved) {
        const d = JSON.parse(saved)
        if (d.sponsorName) setSponsorName(d.sponsorName)
        if (d.title) setTitle(d.title)
        if (d.imageUrl) setImageUrl(d.imageUrl)
        if (d.targetUrl) setTargetUrl(d.targetUrl)
        if (d.contactPhone) setContactPhone(d.contactPhone)
        if (d.contactEmail) setContactEmail(d.contactEmail)
        if (d.slot) setSlot(d.slot)
        if (d.duration) setDuration(d.duration)
      }
    } catch (e) {}

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        if (user.email && !contactEmail) {
          setContactEmail(user.email)
        }
      }
    })
  }, [])

  const saveDraft = () => {
    try {
      localStorage.setItem('draft_ad_banner', JSON.stringify({
        sponsorName, title, imageUrl, targetUrl, contactPhone, contactEmail, slot, duration
      }))
    } catch (e) {}
  }

  const basePrices = {
    sidebar: 39990,
    calculator: 49990,
    header: 59990,
  }

  const calculateTotal = (slotId: 'sidebar' | 'calculator' | 'header', cycle: 'monthly' | 'semiannual' | 'annual') => {
    const base = basePrices[slotId]
    if (cycle === 'monthly') return { total: base, monthlyEquivalent: base, discount: 0, days: 30 }
    if (cycle === 'semiannual') {
      const total = Math.round(base * 6 * 0.85) // 15% OFF
      return { total, monthlyEquivalent: Math.round(total / 6), discount: 15, days: 180 }
    }
    const total = Math.round(base * 12 * 0.75) // 25% OFF
    return { total, monthlyEquivalent: Math.round(total / 12), discount: 25, days: 365 }
  }

  const selectedPricing = calculateTotal(slot, duration)

  // Mapear id a la clave de disponibilidad
  const slotDbKey = slot === 'sidebar' ? 'news_sidebar' : slot === 'header' ? 'header_top' : 'calculator'
  const currentSlotAvail = availability[slotDbKey] || { isFull: false, available: 5, count: 0, max: 5 }

  const slots = [
    {
      id: 'sidebar',
      dbKey: 'news_sidebar',
      name: 'Banner Lateral en Noticias',
      basePrice: 39990,
      desc: 'Formato vertical (300x250 o 300x600 px). Visible en todos los artículos y portada del Diario Regional.',
      badge: 'Diario Regional',
    },
    {
      id: 'calculator',
      dbKey: 'calculator',
      name: 'Banner Calculadora de Sueldos',
      basePrice: 49990,
      desc: 'La página #1 de Magallanes en Google. Público de alta intención: contadores, Pymes y trabajadores.',
      badge: '⭐ Mayor Tráfico',
    },
    {
      id: 'header',
      dbKey: 'header_top',
      name: 'Mega Banner Superior (Header)',
      basePrice: 59990,
      desc: 'Formato horizontal (728x90 o 970x90 px). Ubicación de máxima presencia en la cabecera de todo el portal.',
      badge: '👑 Máxima Visibilidad',
    },
  ]

  const executeCheckout = async () => {
    if (currentSlotAvail.isFull) {
      toast.error('Esta ubicación publicitaria ya no tiene cupos disponibles.')
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
          duration,
          contactEmail: contactEmail || (user?.email || ''),
          contactPhone,
          adData: {
            sponsor_name: sponsorName,
            title: title || `Publicidad ${sponsorName}`,
            image_url: imageUrl,
            target_url: targetUrl,
            position: slot === 'sidebar' ? 'news_sidebar' : slot === 'header' ? 'header_top' : 'calculator',
            duration_cycle: duration,
            duration_days: selectedPricing.days,
            amount_clp: selectedPricing.total,
          }
        })
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'Error al procesar la reserva.')
        setLoading(false)
        return
      }

      try { localStorage.removeItem('draft_ad_banner') } catch (e) {}

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentSlotAvail.isFull) {
      toast.error('Esta ubicación está 100% ocupada. Por favor selecciona otra ubicación con cupos disponibles.')
      return
    }

    if (!sponsorName.trim() || !imageUrl.trim() || !targetUrl.trim()) {
      toast.error('Por favor completa el nombre de tu empresa, la imagen y el enlace de destino.')
      return
    }

    if (!user) {
      saveDraft()
      setIsAuthModalOpen(true)
      return
    }

    await executeCheckout()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: DATOS DEL ANUNCIO (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Banner de Estado de Autenticación */}
          {user ? (
            <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3 text-emerald-950">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <span className="font-black uppercase tracking-wider block text-emerald-900">
                    Sesión Iniciada ({user.email})
                  </span>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Tu banner quedará vinculado a tu panel para cambiar la imagen, link de WhatsApp o renovar mes a mes.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/publicidad" className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-3 py-1.5 rounded-xl shrink-0 hover:bg-emerald-700">
                Ver Panel ➔
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-amber-50/90 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <LogIn className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <strong className="font-black uppercase tracking-wider block text-amber-900">
                    ¿Quieres gestionar tu publicidad desde tu Dashboard?
                  </strong>
                  <p className="text-[11px] text-amber-800 font-medium">
                    Inicia sesión o crea tu cuenta para cambiar la creatividad o renovar tu banner cuando quieras.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link 
                  href="/login?next=/anunciar" 
                  onClick={saveDraft}
                  className="text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-3.5 py-2 rounded-xl hover:bg-amber-700 transition-all"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/register?next=/anunciar" 
                  onClick={saveDraft}
                  className="text-[10px] font-black uppercase tracking-wider bg-white border border-amber-300 text-amber-900 px-3.5 py-2 rounded-xl hover:bg-amber-100 transition-all"
                >
                  Crear Cuenta
                </Link>
              </div>
            </div>
          )}

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
                    Título o Campaña (Interno)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej: Ofertas Invierno 2026"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  URL de la Imagen del Banner (JPG/PNG/WebP) *
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/banner-magallanes.webp"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Recomendación: Header (728x90 o 970x90 px), Sidebar/Calculadora (300x250 o 300x600 px). Peso &lt; 150KB.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Enlace de Destino al hacer Clic (Web o WhatsApp) *
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="url"
                    required
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    placeholder="https://tuempresa.cl o https://wa.me/56912345678"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    WhatsApp de Contacto / Soporte
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
                    Email de Facturación / Envío Comprobante
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="contacto@tuempresa.cl"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: SELECCIÓN DE ESPACIO, DURACIÓN Y PAGO (5/12) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="p-6 rounded-3xl bg-white border border-border shadow-xl space-y-5">
            
            {/* Selector de Duración / Ciclo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                  2. Duración de la Campaña
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Hasta 25% OFF
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'monthly', label: '1 Mes', desc: '30 Días', badge: null },
                  { id: 'semiannual', label: '6 Meses', desc: '180 Días', badge: '-15%' },
                  { id: 'annual', label: '12 Meses', desc: '365 Días', badge: '3 Meses Gratis' },
                ].map(d => {
                  const isSel = duration === d.id
                  return (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => setDuration(d.id as any)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSel
                          ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-sm'
                          : 'border-zinc-200 hover:border-zinc-300 text-muted-foreground'
                      }`}
                    >
                      <div className="text-xs font-black uppercase leading-tight">{d.label}</div>
                      <div className="text-[10px] font-bold opacity-80">{d.desc}</div>
                      {d.badge && (
                        <div className="text-[8.5px] font-black uppercase text-emerald-700 bg-emerald-100 rounded mt-1 py-0.5">
                          {d.badge}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selector de Posición con Control de Capacidad */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">
                3. Ubicación del Banner
              </span>

              <div className="space-y-3">
                {slots.map(s => {
                  const isSelected = slot === s.id
                  const pricing = calculateTotal(s.id as any, duration)
                  const slotAvail = availability[s.dbKey] || { isFull: false, available: 5, count: 0, max: 5 }

                  return (
                    <label
                      key={s.id}
                      onClick={() => setSlot(s.id as any)}
                      className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                        slotAvail.isFull
                          ? 'border-zinc-200 bg-zinc-100/70 opacity-80 cursor-not-allowed'
                          : isSelected
                          ? 'border-amber-500 bg-amber-50/50 shadow-md'
                          : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected && !slotAvail.isFull
                              ? 'border-amber-600 bg-amber-600'
                              : 'border-zinc-300'
                          }`}>
                            {isSelected && !slotAvail.isFull && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-black uppercase text-foreground">{s.name}</span>
                        </div>
                        <span className="text-xs font-black text-foreground">
                          ${pricing.total.toLocaleString('es-CL')}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground font-medium pl-6 pt-1 leading-snug">
                        {s.desc}
                      </p>

                      {/* Badges Dinámicos de Disponibilidad / Escasez */}
                      <div className="pl-6 pt-2 flex items-center justify-between gap-2">
                        {slotAvail.isFull ? (
                          <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                            <Lock className="h-3 w-3" /> CUPOS AGOTADOS (5/5 Ocupados)
                          </div>
                        ) : slotAvail.available === 1 ? (
                          <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md animate-pulse">
                            <Flame className="h-3 w-3 text-amber-600" /> ¡Último Cupo Disponible!
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {slotAvail.available} de 5 Cupos Libres
                          </div>
                        )}

                        {duration !== 'monthly' && (
                          <span className="text-[9.5px] font-bold text-emerald-700">
                            ~${pricing.monthlyEquivalent.toLocaleString('es-CL')}/mes (-{pricing.discount}%)
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* ALERTA DE CUPOS AGOTADOS SI EL SLOT SELECCIONADO ESTÁ LLENO */}
            {currentSlotAvail.isFull && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-rose-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>Ubicación 100% Reservada</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800">
                  Esta posición alcanzó el límite de 5 marcas activas para garantizar máxima visibilidad. Por favor selecciona otra ubicación con cupos libres.
                  {currentSlotAvail.nextAvailableDate && (
                    <span className="block font-semibold pt-0.5">
                      Próxima liberación estimada: {new Date(currentSlotAvail.nextAvailableDate).toLocaleDateString('es-CL')}.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Total y Botón de Pago */}
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Total a Pagar:</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-foreground">
                    ${selectedPricing.total.toLocaleString('es-CL')} CLP
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    {duration === 'monthly' ? 'Por 30 días de difusión' : duration === 'semiannual' ? 'Por 180 días de difusión' : 'Por 365 días de difusión (1 año)'}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || currentSlotAvail.isFull}
                size="lg"
                className={`w-full h-14 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl ${
                  currentSlotAvail.isFull
                    ? 'bg-zinc-400 text-white cursor-not-allowed shadow-none'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25 hover:scale-[1.02] active:scale-95 cursor-pointer'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando Orden...
                  </>
                ) : currentSlotAvail.isFull ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" /> Ubicación Agotada (Selecciona Otra)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Pagar con Mercado Pago ➔
                  </>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-medium pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Activación automática e inmediata con Webpay / Débito / Crédito</span>
              </div>
            </div>
          </div>
        </div>

      </form>

      {/* 🔒 MODAL DE INVITACIÓN A REGISTRO / LOGIN */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-3xl bg-white p-6 sm:p-8 space-y-6 text-center">
          <div className="h-16 w-16 rounded-full bg-amber-50 text-amber-600 border-2 border-amber-200 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
              Gestiona tu Publicidad con tu Cuenta
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Al contratar con tu cuenta gratuita podrás <strong>cambiar la creatividad del banner</strong>, <strong>actualizar el enlace de WhatsApp</strong> o <strong>renovar mes a mes</strong> desde tu panel de control.
            </DialogDescription>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/register?next=/anunciar"
              onClick={saveDraft}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl h-12 text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span>Crear Cuenta Gratis (30 Segundos)</span>
            </Link>

            <Link
              href="/login?next=/anunciar"
              onClick={saveDraft}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl h-12 text-xs font-black uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 transition-all"
            >
              <LogIn className="h-4 w-4" />
              <span>Ya Tengo Cuenta • Iniciar Sesión</span>
            </Link>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(false)
                  executeCheckout()
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline font-medium cursor-pointer"
              >
                Continuar y pagar sin cuenta (Activación directa) ➔
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
