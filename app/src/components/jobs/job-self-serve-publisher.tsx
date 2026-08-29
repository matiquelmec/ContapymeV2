'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Clock, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  ShieldCheck,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const CITIES = ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Torres del Paine', 'Faena / Yacimiento', 'Todo Magallanes']
const SECTORS = ['Comercio & Retail', 'Gastronomía & Hotelería', 'Salmonicultura & Pesca', 'Logística & Transporte', 'Construcción & Minería', 'Administración & Finanzas', 'Salud & Servicios', 'Tecnología & Otros']
const SHIFTS = ['Lunes a Viernes (40 Horas)', 'Turno 7x7 Faena', 'Turno 14x14', 'Turno 4x4', 'Turno Rotativo 6x1', 'Part-Time Fin de Semana']

export function JobSelfServePublisher() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [location, setLocation] = useState('Punta Arenas')
  const [sector, setSector] = useState('Comercio & Retail')
  const [jobType, setJobType] = useState('Jornada Completa')
  const [workShift, setWorkShift] = useState('Lunes a Viernes (40 Horas)')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [tier, setTier] = useState<'free' | 'basic' | 'featured' | 'faena'>('free')

  const tiers = [
    {
      id: 'free',
      name: 'Básico Comunitario',
      price: 0,
      priceLabel: '$0 (GRATIS)',
      badge: '100% Libre',
      desc: 'Publicación activa por 30 días con postulación directa WhatsApp y Google for Jobs.',
      color: 'emerald',
    },
    {
      id: 'basic',
      name: 'Destacado con Pin',
      price: 2990,
      priceLabel: '$2.990 CLP',
      badge: 'Mayor Visibilidad',
      desc: 'Fijado en la primera posición de la bolsa durante todo el mes.',
      color: 'amber',
    },
    {
      id: 'featured',
      name: 'Destacado + Redes Sociales',
      price: 4990,
      priceLabel: '$4.990 CLP',
      badge: '⭐ Más Vendido',
      desc: 'Incluye flyer HD generado automáticamente en Instagram y Facebook de ContaPymePUQ.',
      color: 'primary',
    },
    {
      id: 'faena',
      name: 'Faena / Gran Empresa',
      price: 9990,
      priceLabel: '$9.990 CLP',
      badge: 'Urgente / Faena',
      desc: 'Para empresas con alta urgencia de contratación y turnos especiales.',
      color: 'indigo',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !companyName.trim() || !description.trim()) {
      toast.error('Por favor completa el cargo, la empresa y la descripción.')
      return
    }

    if (!contactWhatsapp.trim() && !contactEmail.trim()) {
      toast.error('Ingresa al menos un WhatsApp o Email para que los postulantes te contacten.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/checkout/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'job_post',
          itemTier: tier,
          contactEmail,
          contactPhone: contactWhatsapp,
          jobData: {
            title,
            company_name: companyName,
            location,
            sector,
            job_type: jobType,
            work_shift: workShift,
            salary_min: salaryMin ? parseInt(salaryMin) : null,
            salary_max: salaryMax ? parseInt(salaryMax) : null,
            description,
            requirements: requirements ? requirements.split('\n').filter(r => r.trim().length > 0) : [],
            contact_whatsapp: contactWhatsapp,
            contact_email: contactEmail,
          }
        })
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'Error al procesar la publicación.')
        setLoading(false)
        return
      }

      // Si es GRATIS ($0), redirigir directamente al éxito
      if (data.is_free) {
        toast.success('¡Aviso publicado con éxito!')
        router.push(`/checkout/success?slug=${data.job_slug}`)
        return
      }

      // Si es de PAGO, redirigir a la pasarela de Mercado Pago
      if (data.init_point) {
        toast.loading('Redirigiendo a Mercado Pago...')
        window.location.href = data.init_point
      } else {
        toast.error('No se pudo generar la URL de pago.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Ocurrió un error inesperado. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* COLUMNA IZQUIERDA: FORMULARIO (7/12) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Bloque 1: Datos Principales */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border/80 shadow-md space-y-5">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
            <Building2 className="h-4 w-4" />
            <span>1. Datos del Cargo y Empresa</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Título del Cargo o Puesto *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Vendedor de Mesón, Técnico Eléctrico, Cajero(a)"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Nombre de la Empresa o Local *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Ej: Distribuidora Austral, Café Central"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Ubicación / Ciudad *
                </label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Sector o Rubro
                </label>
                <select
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Jornada / Turno
                </label>
                <select
                  value={workShift}
                  onChange={e => setWorkShift(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque 2: Sueldo y Descripción */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border/80 shadow-md space-y-5">
          <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-wider">
            <DollarSign className="h-4 w-4" />
            <span>2. Remuneración y Descripción del Puesto</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Sueldo Líquido Ofrecido ($ CLP)
                </label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={e => setSalaryMin(e.target.value)}
                  placeholder="Ej: 650000 (Opcional)"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Sueldo Máximo (Banda salarial)
                </label>
                <input
                  type="number"
                  value={salaryMax}
                  onChange={e => setSalaryMax(e.target.value)}
                  placeholder="Ej: 800000 (Opcional)"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Descripción de Funciones *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe las tareas principales, horarios y ambiente de trabajo..."
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Requisitos (Uno por línea)
              </label>
              <textarea
                rows={3}
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                placeholder="Ej: Experiencia de 1 año en ventas&#10;Licencia de conducir clase B&#10;Manejo de sistema POS"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Bloque 3: Contacto Directo */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border/80 shadow-md space-y-5">
          <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider">
            <Phone className="h-4 w-4" />
            <span>3. Datos para Recepción de Postulaciones</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                WhatsApp de Postulación (Recomendado)
              </label>
              <input
                type="text"
                value={contactWhatsapp}
                onChange={e => setContactWhatsapp(e.target.value)}
                placeholder="+56912345678"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Email de Contacto
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="empleos@tuempresa.cl"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
          </div>
        </div>

      </div>

      {/* COLUMNA DERECHA: SELECCIÓN DE PLAN & PREVISUALIZACIÓN (5/12) */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        
        {/* Selector de Plan */}
        <div className="p-6 rounded-3xl bg-white border border-border shadow-xl space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
            Selecciona tu Nivel de Publicación
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
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-zinc-300'}`}>
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
              className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...
                </>
              ) : tier === 'free' ? (
                <>
                  <Send className="w-4 h-4 mr-2" /> Publicar Gratis Ahora ($0)
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Continuar a Mercado Pago ➔
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground font-medium pt-2">
              🔒 Cumplimiento estricto del Art. 2° del Código del Trabajo
            </p>
          </div>
        </div>

      </div>

    </form>
  )
}
