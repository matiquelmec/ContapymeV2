'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  updateProfileOnboarding, 
  createOrganization, 
  seedChartOfAccounts, 
  seedPayrollSettings,
  completeOnboarding 
} from '@/actions/onboarding'
import { 
  User, 
  Building2, 
  BarChart3, 
  Rocket, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Briefcase, 
  Newspaper, 
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'

type OnboardingIntent = 'jobs' | 'news' | 'accounting' | 'general'

const STEPS_ACCOUNTING = [
  { id: 1, title: 'Tu Perfil', icon: User, description: 'Información profesional' },
  { id: 2, title: 'Tu Empresa', icon: Building2, description: 'Datos fiscales' },
  { id: 3, title: 'Contabilidad', icon: BarChart3, description: 'Plan de cuentas' },
  { id: 4, title: '¡Listo!', icon: Rocket, description: 'Comienza a trabajar' },
]

export default function OnboardingWizard() {
  const router = useRouter()
  const [intent, setIntent] = useState<OnboardingIntent | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState('')

  // Step 1 data
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('contador')

  // Step 2 data
  const [rut, setRut] = useState('')
  const [nombre, setNombre] = useState('')
  const [giro, setGiro] = useState('')
  const [direccion, setDireccion] = useState('')
  const [comuna, setComuna] = useState('Punta Arenas')
  const [region, setRegion] = useState('Magallanes y de la Antártica Chilena')
  const [regimen, setRegimen] = useState('pro_pyme')
  const [repLegalNombre, setRepLegalNombre] = useState('')
  const [repLegalRut, setRepLegalRut] = useState('')

  // Step 3 data
  const [planType, setPlanType] = useState('standard')
  const [seeded, setSeeded] = useState(false)

  // --- RUT formatter ---
  const formatRut = (value: string) => {
    const clean = value.replace(/[^0-9kK]/g, '')
    if (clean.length <= 1) return clean
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1).toUpperCase()
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${formatted}-${dv}`
  }

  // --- Manejador de Ruta Rápida de Empleos ---
  const handleQuickJobsOnboarding = async () => {
    if (!fullName.trim() || !nombre.trim()) {
      setError('Por favor ingresa tu nombre y el nombre de tu empresa')
      return
    }
    setLoading(true)
    setError('')
    try {
      await updateProfileOnboarding({ fullName, phone, role: 'empresa' })
      const res = await createOrganization({
        rut: rut || '76.000.000-1',
        nombre,
        giro: giro || 'Comercio y Servicios',
        direccion: direccion || 'Punta Arenas',
        comuna: comuna || 'Punta Arenas',
        region: 'Magallanes y de la Antártica Chilena',
        regimen: 'pro_pyme'
      })
      if (res.success && res.organizationId) {
        await completeOnboarding(res.organizationId)
        router.push('/dashboard/empleos')
      } else {
        router.push('/dashboard/empleos')
      }
    } catch (err: any) {
      setError('Error al configurar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- Manejador de Ruta Rápida de Noticias ---
  const handleQuickNewsOnboarding = async () => {
    if (!fullName.trim()) {
      setError('Por favor ingresa tu nombre')
      return
    }
    setLoading(true)
    setError('')
    try {
      await updateProfileOnboarding({ fullName, phone, role: 'editor' })
      router.push('/dashboard/noticias')
    } catch (err: any) {
      setError('Error al configurar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- Flujo Completo Contable ---
  const handleStep1 = async () => {
    if (!fullName.trim()) { setError('Ingresa tu nombre completo'); return }
    setLoading(true)
    setError('')
    const res = await updateProfileOnboarding({ fullName, phone, role })
    setLoading(false)
    if (!res.success) { setError(res.error || 'Error al guardar perfil'); return }
    setStep(2)
  }

  const handleStep2 = async () => {
    if (!rut.trim() || !nombre.trim()) { setError('RUT y Razón Social son obligatorios'); return }
    setLoading(true)
    setError('')
    const res = await createOrganization({ rut, nombre, giro, direccion, comuna, region, regimen })
    setLoading(false)
    if (!res.success) {
      if (res.error === 'LIMIT_REACHED') {
        setError(res.message || 'Límite de empresas alcanzado en tu plan actual.')
      } else {
        setError(res.error || 'Error al crear empresa')
      }
      return
    }
    setOrgId(res.organizationId!)
    setStep(3)
  }

  const handleStep3 = async () => {
    setLoading(true)
    setError('')
    if (planType === 'standard' && !seeded) {
      const res = await seedChartOfAccounts(orgId)
      if (!res.success) { setLoading(false); setError(res.error || 'Error al crear plan de cuentas'); return }
      setSeeded(true)
    }
    await seedPayrollSettings(orgId, repLegalNombre, repLegalRut)
    setLoading(false)
    setStep(4)
  }

  const handleFinishAccounting = async () => {
    setLoading(true)
    setError('')
    const res = await completeOnboarding(orgId)
    setLoading(false)
    if (!res.success) { setError(res.error || 'Error al finalizar'); return }
    router.push('/dashboard')
  }

  // ==========================================
  // PANTALLA 0: SELECTOR DE INTENCIÓN VISUAL
  // ==========================================
  if (!intent) {
    return (
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Bienvenido a ContaPymePUQ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
            ¿Cuál es tu objetivo principal hoy?
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Configuraremos tu espacio de trabajo en segundos según lo que necesites realizar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Opción 1: Empleos */}
          <button
            type="button"
            onClick={() => setIntent('jobs')}
            className="p-5 rounded-3xl bg-white border-2 border-zinc-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 text-left transition-all group flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit group-hover:scale-110 transition-transform">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-foreground uppercase tracking-tight">
                Publicar Ofertas de Empleo
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Difunde vacantes en Punta Arenas y faenas con auditoría Art. 2° DT y banners para Instagram.
              </p>
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
              Configurar en 2 minutos <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </button>

          {/* Opción 2: Noticias & Prensa */}
          <button
            type="button"
            onClick={() => setIntent('news')}
            className="p-5 rounded-3xl bg-white border-2 border-zinc-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 text-left transition-all group flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 w-fit group-hover:scale-110 transition-transform">
                <Newspaper className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-foreground uppercase tracking-tight">
                Publicar Noticias & Prensa
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Difunde comunicados corporativos y publirreportajes en el Diario Regional con Asistente IA.
              </p>
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1">
              Redactar Comunicado <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </button>

          {/* Opción 3: Contabilidad ERP */}
          <button
            type="button"
            onClick={() => setIntent('accounting')}
            className="p-5 rounded-3xl bg-white border-2 border-zinc-200 hover:border-primary hover:shadow-lg hover:shadow-primary/10 text-left transition-all group flex flex-col justify-between space-y-4 cursor-pointer sm:col-span-2"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight">
                    Software Contable & Facturación (ERP)
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                  Facturación Electrónica DTE ante el SII, Registro RCV, Nómina con Ley 40 Horas / Ley Karin y Conciliación Bancaria.
                </p>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1 shrink-0">
                Configuración Completa <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // RUTA 1: ONBOARDING RÁPIDO DE EMPLEOS
  // ==========================================
  if (intent === 'jobs') {
    return (
      <div className="w-full max-w-lg space-y-6">
        <button
          type="button"
          onClick={() => { setIntent(null); setError(''); }}
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Cambiar objetivo
        </button>

        <Card className="rounded-3xl border-border/60 shadow-xl bg-white">
          <CardHeader className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-black uppercase tracking-wider">
              <Briefcase className="h-4 w-4" />
              <span>Paso Rápido: Perfil de Empresa Empleadora</span>
            </div>
            <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">
              Datos para Publicar Empleos
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Tu nombre y empresa aparecerán en tus ofertas laborales y en los banners para Instagram.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl">{error}</p>}

            <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Tu Nombre Completo *
              </Label>
              <Input
                placeholder="Ej. Matías Riquelme"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl h-10 text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Nombre de la Empresa o Razón Social *
              </Label>
              <Input
                placeholder="Ej. Recasur, Australis Seafoods, Frigorífico PUQ"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="rounded-xl h-10 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  RUT Empresa (Opcional)
                </Label>
                <Input
                  placeholder="76.123.456-7"
                  value={rut}
                  onChange={(e) => setRut(formatRut(e.target.value))}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Comuna *
                </Label>
                <Input
                  placeholder="Punta Arenas"
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Teléfono o WhatsApp de Contacto
              </Label>
              <Input
                placeholder="+56 9 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl h-10 text-xs font-medium"
              />
            </div>

            <Button
              onClick={handleQuickJobsOnboarding}
              disabled={loading}
              className="w-full rounded-2xl h-11 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              <span>Continuar a Bolsa de Empleos</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==========================================
  // RUTA 2: ONBOARDING RÁPIDO DE NOTICIAS
  // ==========================================
  if (intent === 'news') {
    return (
      <div className="w-full max-w-lg space-y-6">
        <button
          type="button"
          onClick={() => { setIntent(null); setError(''); }}
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Cambiar objetivo
        </button>

        <Card className="rounded-3xl border-border/60 shadow-xl bg-white">
          <CardHeader className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-black uppercase tracking-wider">
              <Newspaper className="h-4 w-4" />
              <span>Paso Rápido: Emisor de Comunicados</span>
            </div>
            <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">
              Datos para Publicar Prensa
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Configura tu firma corporativa o perfil de autor para el Diario Regional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl">{error}</p>}

            <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Tu Nombre o Firma de Empresa *
              </Label>
              <Input
                placeholder="Ej. Comunicaciones Recasur / Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl h-10 text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Teléfono de Contacto Prensa
              </Label>
              <Input
                placeholder="+56 9 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl h-10 text-xs font-medium"
              />
            </div>

            <Button
              onClick={handleQuickNewsOnboarding}
              disabled={loading}
              className="w-full rounded-2xl h-11 text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              <span>Ir a Redactar Comunicados</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==========================================
  // RUTA 3: WIZARD CONTABLE / ERP COMPLETO
  // ==========================================
  return (
    <div className="w-full max-w-lg">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => { setIntent(null); setStep(1); setError(''); }}
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Cambiar objetivo
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS_ACCOUNTING.map((s) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                  ${isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : ''}
                  ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : ''}
                  ${!isDone && !isActive ? 'bg-muted text-muted-foreground' : ''}
                `}>
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((step - 1) / (STEPS_ACCOUNTING.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      {/* Step 1: Tu Perfil */}
      {step === 1 && (
        <Card className="rounded-3xl border-border/60 shadow-xl bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-black uppercase tracking-tight">Información de Perfil</CardTitle>
            <CardDescription className="text-xs">Cuéntanos sobre ti para personalizar tu experiencia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Nombre Completo *</Label>
              <Input 
                placeholder="Ej. Matías Riquelme"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Teléfono</Label>
              <Input 
                placeholder="+56 9 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Tu Rol</Label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 rounded-xl bg-background border border-input px-3 text-sm font-medium"
              >
                <option value="contador">Contador / Asesor Tributario</option>
                <option value="empresa">Dueño de Empresa / Gerente</option>
                <option value="rrhh">Recursos Humanos / Nómina</option>
                <option value="administrador">Administrador General</option>
              </select>
            </div>
            <Button 
              onClick={handleStep1} 
              disabled={loading}
              className="w-full rounded-xl h-11 font-black uppercase tracking-wider gap-2 mt-4 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Siguiente <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Tu Empresa */}
      {step === 2 && (
        <Card className="rounded-3xl border-border/60 shadow-xl bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-black uppercase tracking-tight">Datos de tu Empresa</CardTitle>
            <CardDescription className="text-xs">Información tributaria para facturación y reportes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">RUT Empresa *</Label>
                <Input 
                  placeholder="76.123.456-7"
                  value={rut}
                  onChange={(e) => setRut(formatRut(e.target.value))}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Razón Social *</Label>
                <Input 
                  placeholder="Mi Empresa SpA"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">Giro Comercial</Label>
              <Input 
                placeholder="Servicios Contables y Asesorías"
                value={giro}
                onChange={(e) => setGiro(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Comuna</Label>
                <Input 
                  placeholder="Punta Arenas"
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Régimen</Label>
                <select 
                  value={regimen}
                  onChange={(e) => setRegimen(e.target.value)}
                  className="w-full h-10 rounded-xl bg-background border border-input px-2 text-xs"
                >
                  <option value="pro_pyme">Pro Pyme General (14-D3)</option>
                  <option value="pro_pyme_transparente">Pro Pyme Transparente (14-D8)</option>
                  <option value="general">Régimen General (14-A)</option>
                  <option value="renta_presunta">Renta Presunta</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-3">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="rounded-xl h-11 px-4 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button 
                onClick={handleStep2} 
                disabled={loading}
                className="flex-1 rounded-xl h-11 font-black uppercase tracking-wider gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Siguiente <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Contabilidad */}
      {step === 3 && (
        <Card className="rounded-3xl border-border/60 shadow-xl bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-black uppercase tracking-tight">Configuración Contable</CardTitle>
            <CardDescription className="text-xs">Inicializaremos tu plan de cuentas y parámetros laborales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Plan de Cuentas Estándar Chileno</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Se configurarán automáticamente las cuentas de Activo, Pasivo, Patrimonio, Ingresos y Gastos según la normativa del SII.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Parámetros de Remuneraciones Ley 40h</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cálculo de AFPs, Fonasa, Isapres, Seguro de Cesantía y factores de zona extrema Magallanes.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(2)}
                className="rounded-xl h-11 px-4 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button 
                onClick={handleStep3} 
                disabled={loading}
                className="flex-1 rounded-xl h-11 font-black uppercase tracking-wider gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Inicializar Sistema <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Listo */}
      {step === 4 && (
        <Card className="rounded-3xl border-border/60 shadow-xl bg-white text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Rocket className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">¡Todo Listo!</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tu empresa ha sido configurada. Ya puedes comenzar a emitir facturas, gestionar sueldos y publicar empleos.
              </p>
            </div>
            <Button 
              onClick={handleFinishAccounting} 
              disabled={loading}
              className="w-full rounded-2xl h-12 text-xs font-black uppercase tracking-wider gap-2 shadow-lg shadow-primary/25 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Ingresar al Dashboard <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
