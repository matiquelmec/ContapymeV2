'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Newspaper, 
  Building2, 
  Tag, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Phone, 
  Mail, 
  Sparkles, 
  Loader2,
  CheckCircle2,
  Send,
  ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const CATEGORIES = [
  { id: 'REGIONAL', label: 'Actualidad Regional & Pymes' },
  { id: 'FINANZAS', label: 'Economía, Finanzas & Comercio' },
  { id: 'INNOVACION', label: 'Innovación, Ciencia & Energía' },
  { id: 'GASTRONOMIA', label: 'Gastronomía, Turismo & Hotelería' },
]

export function NewsSelfServePublisher() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [category, setCategory] = useState('REGIONAL')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [tier, setTier] = useState<'standard' | 'featured' | 'campaign'>('featured')

  const tiers = [
    {
      id: 'standard',
      name: 'Nota de Prensa / Comunicado',
      price: 19990,
      priceLabel: '$19.990 CLP',
      badge: 'Permanente',
      desc: 'Publicación permanente en el Diario Regional e indexación oficial en Google News.',
    },
    {
      id: 'featured',
      name: 'Publirreportaje de Portada',
      price: 39990,
      priceLabel: '$39.990 CLP',
      badge: '⭐ Recomendado',
      desc: 'Posición destacada en la portada principal por 7 días + post en Instagram y Facebook.',
    },
    {
      id: 'campaign',
      name: 'Cobertura Comercial + Banner',
      price: 79990,
      priceLabel: '$79.990 CLP',
      badge: 'Impacto Total',
      desc: 'Publirreportaje de portada permanente + banner publicitario lateral activo por 15 días.',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !companyName.trim() || !content.trim()) {
      toast.error('Por favor completa el título, la empresa y el contenido de la noticia.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/checkout/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'press_release',
          itemTier: tier,
          contactEmail,
          contactPhone,
          newsData: {
            title,
            company_name: companyName,
            category,
            summary: summary || title,
            content,
            image_url: imageUrl || 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80',
          }
        })
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'Error al procesar la publicación.')
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
      toast.error('Ocurrió un error inesperado. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* COLUMNA IZQUIERDA: FORMULARIO DE NOTICIA (7/12) */}
      <div className="lg:col-span-7 space-y-6">
        
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-md space-y-5">
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-wider">
            <Newspaper className="h-4 w-4" />
            <span>1. Titular y Contenido Noticioso</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Titular de la Noticia o Lanzamiento *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Nueva pastelería artesanal abre sus puertas en el centro de Punta Arenas"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Nombre de la Empresa o Entidad *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Ej: Café Central Punta Arenas"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Categoría Editorial *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                URL de Imagen Destacada (Opcional - Formato HD)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/foto-noticia.jpg (Dejar vacío para usar foto representativa)"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Cuerpo del Reportaje / Noticia *
              </label>
              <textarea
                required
                rows={6}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Escribe el detalle de la noticia, horario de atención, productos destacados, historia del emprendimiento..."
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-md space-y-5">
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-wider">
            <Mail className="h-4 w-4" />
            <span>2. Datos de Contacto y Facturación</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                WhatsApp / Teléfono de Contacto
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+56912345678"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Email para Confirmación
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="prensa@tuempresa.cl"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

      </div>

      {/* COLUMNA DERECHA: SELECCIÓN DE PLAN Y CHECKOUT (5/12) */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        
        <div className="p-6 rounded-3xl bg-white border border-border shadow-xl space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
            Selecciona el Tipo de Cobertura
          </span>

          <div className="space-y-3">
            {tiers.map(t => {
              const isSelected = tier === t.id
              return (
                <label
                  key={t.id}
                  onClick={() => setTier(t.id as any)}
                  className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-zinc-300'}`}>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-black uppercase text-foreground">{t.name}</span>
                    </div>
                    <span className="text-xs font-black text-foreground">{t.priceLabel}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium pl-6 pt-1 leading-snug">
                    {t.desc}
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
              className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Pagar y Publicar con Mercado Pago ➔
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground font-medium pt-2">
              🔒 Indexación automática en Google News y Google Discover
            </p>
          </div>
        </div>

      </div>

    </form>
  )
}
