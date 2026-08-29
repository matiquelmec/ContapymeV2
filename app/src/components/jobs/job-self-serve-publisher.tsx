'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  Send,
  UserCheck,
  LogIn,
  UserPlus,
  Lock
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
import { toast } from 'sonner'

const CITIES = ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Torres del Paine', 'Faena / Yacimiento', 'Todo Magallanes']
const SECTORS = ['Comercio & Retail', 'Gastronomía & Hotelería', 'Salmonicultura & Pesca', 'Logística & Transporte', 'Construcción & Minería', 'Administración & Finanzas', 'Salud & Servicios', 'Tecnología & Otros']
const SHIFTS = ['Lunes a Viernes (40 Horas)', 'Turno 7x7 Faena', 'Turno 14x14', 'Turno 4x4', 'Turno Rotativo 6x1', 'Part-Time Fin de Semana']

export function JobSelfServePublisher() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  
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

  useEffect(() => {
    // Restaurar borrador de localStorage si existe
    try {
      const saved = localStorage.getItem('draft_job_post')
      if (saved) {
        const d = JSON.parse(saved)
        if (d.title) setTitle(d.title)
        if (d.companyName) setCompanyName(d.companyName)
        if (d.location) setLocation(d.location)
        if (d.sector) setSector(d.sector)
        if (d.workShift) setWorkShift(d.workShift)
        if (d.salaryMin) setSalaryMin(d.salaryMin)
        if (d.salaryMax) setSalaryMax(d.salaryMax)
        if (d.description) setDescription(d.description)
        if (d.requirements) setRequirements(d.requirements)
        if (d.contactWhatsapp) setContactWhatsapp(d.contactWhatsapp)
        if (d.contactEmail) setContactEmail(d.contactEmail)
        if (d.tier) setTier(d.tier)
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
      localStorage.setItem('draft_job_post', JSON.stringify({
        title, companyName, location, sector, workShift, salaryMin, salaryMax,
        description, requirements, contactWhatsapp, contactEmail, tier
      }))
    } catch (e) {}
  }

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
      desc: 'Fijado en la primera posición de la bolsa durante todo el mes para máxima atención.',
      color: 'blue',
    },
    {
      id: 'featured',
      name: 'Destacado + Redes',
      price: 4990,
      priceLabel: '$4.990 CLP',
      badge: '⭐ Más Recomendado',
      desc: 'Incluye diseño automático de flyer publicitario HD para Instagram y Facebook.',
      color: 'emerald',
    },
    {
      id: 'faena',
      name: 'Faena / Gran Empresa',
      price: 9990,
      priceLabel: '$9.990 CLP',
      badge: 'Faena & Gran Pyme',
      desc: 'Para empresas con turnos 7x7/14x14, salmoneras, constructoras y alta urgencia.',
      color: 'indigo',
    },
  ]

  // Validación preventiva Art. 2° Código del Trabajo
  const checkDiscrimination = (text: string) => {
    const forbidden = [
      { regex: /\b(edad|a[ñn]os)\b/i, reason: 'Edad (Art. 2° DT)' },
      { regex: /\b(buena presencia)\b/i, reason: 'Apariencia física (Art. 2° DT)' },
      { regex: /\b(foto|fotograf[ií]a)\b/i, reason: 'Exigencia de fotografía' },
      { regex: /\b(dicom|deudas)\b/i, reason: 'Antecedentes comerciales' },
    ]
    for (const f of forbidden) {
      if (f.regex.test(text)) return f.reason
    }
    return null
  }

  const executePublish = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/checkout/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'job_post',
          itemTier: tier,
          contactEmail: contactEmail || (user?.email || ''),
          jobData: {
            title,
            company_name: companyName,
            location,
            sector,
            job_type: jobType,
            work_shift: workShift,
            salary_min: salaryMin ? Number(salaryMin) : null,
            salary_max: salaryMax ? Number(salaryMax) : null,
            description,
            requirements: requirements ? requirements.split('\n').filter(Boolean) : [],
            benefits: [],
            contact_whatsapp: contactWhatsapp,
            contact_email: contactEmail || (user?.email || ''),
          }
        })
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'Error al procesar el aviso.')
        setLoading(false)
        return
      }

      // Limpiar borrador de localStorage
      try { localStorage.removeItem('draft_job_post') } catch (e) {}

      // Si es GRATIS ($0), redirigir directamente al dashboard si está autenticado o al éxito
      if (data.is_free) {
        toast.success('¡Aviso publicado con éxito!')
        if (user) {
          router.push('/dashboard/empleos')
        } else {
          router.push(`/checkout/success?slug=${data.job_slug}`)
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const discIssue = checkDiscrimination(`${title} ${description} ${requirements}`)
    if (discIssue) {
      toast.error(`Aviso no cumple normativa laboral: Se detectó discriminación por ${discIssue}. Por favor corrígelo antes de continuar.`)
      return
    }

    if (!title.trim() || !companyName.trim() || !description.trim()) {
      toast.error('Por favor completa el título, empresa y descripción.')
      return
    }

    // Si el usuario no ha iniciado sesión, abrimos el modal invitándolo a registrarse
    if (!user) {
      saveDraft()
      setIsAuthModalOpen(true)
      return
    }

    await executePublish()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO (7/12) */}
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
                    Tu aviso quedará vinculado a tu panel para que puedas editarlo, pausarlo o darlo de baja cuando contrates.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/empleos" className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-3 py-1.5 rounded-xl shrink-0 hover:bg-emerald-700">
                Ver Panel ➔
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-indigo-50/80 border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-indigo-950">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <LogIn className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <strong className="font-black uppercase tracking-wider block text-indigo-900">
                    ¿Quieres poder editar o pausar tu vacante después?
                  </strong>
                  <p className="text-[11px] text-indigo-700 font-medium">
                    Inicia sesión o crea tu cuenta gratuita para gestionar tus avisos cuando ya hayas contratado.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link 
                  href="/login?next=/publicar-empleo" 
                  onClick={saveDraft}
                  className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-3.5 py-2 rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/register?next=/publicar-empleo" 
                  onClick={saveDraft}
                  className="text-[10px] font-black uppercase tracking-wider bg-white border border-indigo-200 text-indigo-900 px-3.5 py-2 rounded-xl hover:bg-indigo-50 transition-all"
                >
                  Crear Cuenta
                </Link>
              </div>
            </div>
          )}

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
                    Nombre de la Empresa o Empleador *
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
                    Comuna o Ubicación *
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
                    Sector o Rubro *
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
                    Jornada o Turno *
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
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
              <DollarSign className="h-4 w-4" />
              <span>2. Renta y Detalle de la Oferta</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Sueldo Líquido Estimado ($CLP)
                  </label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={e => setSalaryMin(e.target.value)}
                    placeholder="Ej: 650000"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Sueldo Máximo / Bonos (Opcional)
                  </label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={e => setSalaryMax(e.target.value)}
                    placeholder="Ej: 800000"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Descripción del Trabajo y Funciones *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe las tareas diarias, horario exacto, lugar de trabajo y ambiente..."
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
                  placeholder="Ej: Experiencia de 1 año en ventas\nLicencia clase B vigente\nResidencia en Punta Arenas"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Bloque 3: Canales de Postulación Directa */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border/80 shadow-md space-y-5">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
              <Phone className="h-4 w-4" />
              <span>3. Canales de Postulación Directa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  WhatsApp para Recibir CVs *
                </label>
                <input
                  type="text"
                  required
                  value={contactWhatsapp}
                  onChange={e => setContactWhatsapp(e.target.value)}
                  placeholder="+56912345678"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Email de Contacto / Facturación
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="rrhh@tuempresa.cl"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: SELECCIÓN DE PLAN Y BOTÓN DE PAGO (5/12) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="p-6 rounded-3xl bg-white border border-border shadow-xl space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
              Selecciona el Tipo de Publicación
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

            <div className="pt-4 border-t border-zinc-100 space-y-2">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...
                  </>
                ) : tier === 'free' ? (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Publicar Aviso Gratis ($0) ➔
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Pagar con Mercado Pago ➔
                  </>
                )}
              </Button>
              
              <p className="text-[10px] text-center text-muted-foreground font-medium">
                🔒 Cumplimiento estricto Art. 2° Código del Trabajo
              </p>
            </div>
          </div>

        </div>

      </form>

      {/* 🔒 MODAL DE INVITACIÓN A REGISTRO / LOGIN ANTES DE PUBLICAR */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-3xl bg-white p-6 sm:p-8 space-y-6 text-center">
          <div className="h-16 w-16 rounded-full bg-indigo-50 text-indigo-600 border-2 border-indigo-200 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
              Gestiona tu Vacante con tu Cuenta
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Al publicar con tu cuenta gratuita podrás <strong>editar el sueldo</strong>, <strong>pausar</strong> o <strong>dar de baja el aviso</strong> cuando ya hayas contratado para que no sigan llegándote WhatsApps.
            </DialogDescription>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/register?next=/publicar-empleo"
              onClick={saveDraft}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl h-12 text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span>Crear Cuenta Gratis (30 Segundos)</span>
            </Link>

            <Link
              href="/login?next=/publicar-empleo"
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
                  executePublish()
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline font-medium cursor-pointer"
              >
                Continuar y publicar sin cuenta (No podrás editarlo después) ➔
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
