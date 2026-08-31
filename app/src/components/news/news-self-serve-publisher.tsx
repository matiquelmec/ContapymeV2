'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
  ShieldCheck,
  UploadCloud,
  X,
  FileCheck,
  Zap,
  MessageCircle,
  Wand2,
  Bot
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { compressImage } from '@/lib/media/image-compressor'
import { uploadNewsImageAction, generatePressReleaseAIAction } from '@/actions/news'

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

  // Image Upload & WebP Compressor State
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [compressionRatio, setCompressionRatio] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI Assistant State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

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

  const handleGenerateAI = async () => {
    const rawNotes = content.trim() || title.trim()
    if (!rawNotes || rawNotes.length < 5) {
      toast.info('Escribe una breve idea o borrador', {
        description: 'Ingresa al menos 1 o 2 frases en el cuerpo de la noticia o título para que la IA pueda redactar.'
      })
      return
    }

    setIsGeneratingAI(true)
    toast.loading('Asistente Editorial IA redactando tu reportaje...', { id: 'ai-news-gen' })

    try {
      const res = await generatePressReleaseAIAction({
        rawNotes,
        companyName: companyName.trim() || undefined,
        category
      })

      if (res.success) {
        if (res.title) setTitle(res.title)
        if (res.summary) setSummary(res.summary)
        if (res.content) setContent(res.content)
        if (res.category) setCategory(res.category)

        toast.success('¡Reportaje redactado con éxito!', {
          id: 'ai-news-gen',
          description: 'Hemos estructurado el titular, bajada periodística y cuerpo de la noticia conforme a Google News.'
        })
      } else {
        toast.error(res.error || 'Error al generar la noticia con IA', { id: 'ai-news-gen' })
      }
    } catch (err) {
      toast.error('Fallo en la conexión con el asistente editorial.', { id: 'ai-news-gen' })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).')
      return
    }

    setIsUploadingImage(true)
    setCompressionRatio(null)

    try {
      // 1. Compresión WebP en cliente (1600px max, 16:9 ratio)
      const compressed = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        format: 'image/webp'
      })

      setCompressionRatio(compressed.ratio)
      toast.info(`✨ Imagen comprimida a WebP (${compressed.ratio} menos peso)`, {
        description: `De ${(compressed.originalSize / 1024 / 1024).toFixed(2)} MB a ${(compressed.compressedSize / 1024).toFixed(0)} KB con máxima nitidez.`
      })

      // 2. Subida a Supabase Storage
      const formData = new FormData()
      formData.append('file', compressed.file)

      const res = await uploadNewsImageAction(formData)

      if (res.success && res.url) {
        setImageUrl(res.url)
        toast.success('¡Imagen de portada subida y optimizada exitosamente!')
      } else {
        toast.error(res.error || 'Error al subir la imagen')
      }
    } catch (err: any) {
      console.error('Error al procesar imagen:', err)
      toast.error('Error al comprimir o subir la imagen.')
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-wider">
              <Newspaper className="h-4 w-4" />
              <span>1. Titular y Contenido Noticioso</span>
            </div>

            {/* BOTÓN ASISTENTE EDITORIAL CON IA */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className="rounded-2xl border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-black text-[11px] uppercase tracking-wider gap-1.5 shadow-2xs transition-all hover:scale-105"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Redactando...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>✨ Redactar con IA</span>
                </>
              )}
            </Button>
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

            {/* SECCIÓN DE SUBIDA Y COMPRESIÓN DE IMAGEN DESTACADA */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Imagen Destacada / Portada (Compresor WebP Integrado)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                >
                  {showUrlInput ? '« Subir archivo desde PC/Móvil' : 'O pegar enlace URL »'}
                </button>
              </div>

              {showUrlInput ? (
                <div className="space-y-1.5">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/foto-noticia.jpg"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Pega el enlace directo a una imagen pública en formato HD.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/png, image/jpeg, image/webp, image/jpg" 
                    className="hidden" 
                  />

                  {imageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-indigo-200 bg-zinc-900 group">
                      <div className="relative h-48 w-full">
                        <Image 
                          src={imageUrl} 
                          alt="Vista previa de noticia" 
                          fill 
                          className="object-cover transition-transform group-hover:scale-105"
                          unoptimized
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="rounded-xl text-xs font-bold bg-white text-zinc-900 shadow-md"
                        >
                          Cambiar Foto
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => { setImageUrl(''); setCompressionRatio(null); }}
                          className="rounded-xl text-xs font-bold"
                        >
                          <X className="w-4 h-4 mr-1" /> Eliminar
                        </Button>
                      </div>

                      {compressionRatio && (
                        <div className="absolute bottom-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>Optimizada WebP ({compressionRatio} peso)</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        isUploadingImage 
                          ? 'border-indigo-400 bg-indigo-50/50' 
                          : 'border-zinc-300 hover:border-indigo-500 hover:bg-indigo-50/20 bg-zinc-50/50'
                      }`}
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-indigo-950 uppercase tracking-tight">
                              Comprimiendo y convirtiendo a WebP...
                            </p>
                            <p className="text-[10px] text-indigo-600 font-medium">
                              Reduciendo peso sin perder calidad fotográfica
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              Haz clic para subir o arrastra la foto del reportaje
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Formatos JPG, PNG o WebP. El compresor optimizará el peso automáticamente.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Asistencia de Diseño y Redacción Concierge WhatsApp */}
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex items-start gap-3 text-left">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-emerald-950">
                        ¿Prefieres que nosotros diseñemos la portada y redactemos el reportaje?
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                        Envíanos tus fotos y datos a nuestro equipo editorial por WhatsApp:{' '}
                        <a 
                          href="https://wa.me/56944444565?text=%C2%A1Hola!%20Me%20gustar%C3%ADa%20que%20ustedes%20dise%C3%B1en%20la%20portada%20y%20redacten%20el%20comunicado%20de%20mi%20empresa%20en%20ContaPymePUQ."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-black text-emerald-900 underline hover:text-emerald-700"
                        >
                          +56 9 4444 4565
                        </a>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Cuerpo del Reportaje / Noticia *
                </label>
                <span className="text-[10px] text-indigo-600 font-bold italic">
                  Tip: Puedes escribir ideas sueltas y pulsar "✨ Redactar con IA"
                </span>
              </div>
              <textarea
                required
                rows={7}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Escribe aquí las ideas principales, novedades, horarios o historia. Si deseas, haz clic arriba en '✨ Redactar con IA' para que el asistente editorial le dé formato periodístico profesional..."
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
                type="tel"
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
                required
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
        
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border shadow-md space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
              Selecciona el Tipo de Cobertura
            </span>
          </div>

          {/* Planes */}
          <div className="space-y-3">
            {tiers.map(t => {
              const isSelected = tier === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => setTier(t.id as any)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-md shadow-indigo-600/10' 
                      : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-zinc-400'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <strong className="text-xs font-black uppercase tracking-tight text-foreground">
                        {t.name}
                      </strong>
                    </div>
                    <span className="text-xs font-black text-indigo-600 font-mono">
                      {t.priceLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground font-medium pl-6 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Botón Pagar con Mercado Pago */}
          <Button
            type="submit"
            disabled={loading || isUploadingImage || isGeneratingAI}
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando Orden Segura...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Pagar y Publicar con Mercado Pago ➔
              </>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
            <span>🔒 Indexación automática en Google News y Google Discover</span>
          </p>
        </div>

      </div>

    </form>
  )
}
