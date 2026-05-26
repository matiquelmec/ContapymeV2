'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { User, Building2, BarChart3, Rocket, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Tu Perfil', icon: User, description: 'Información profesional' },
  { id: 2, title: 'Tu Empresa', icon: Building2, description: 'Datos fiscales' },
  { id: 3, title: 'Contabilidad', icon: BarChart3, description: 'Plan de cuentas' },
  { id: 4, title: '¡Listo!', icon: Rocket, description: 'Comienza a trabajar' },
]

export default function OnboardingWizard() {
  const router = useRouter()
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
  const [comuna, setComuna] = useState('')
  const [region, setRegion] = useState('')
  const [regimen, setRegimen] = useState('pro_pyme')
  const [repLegalNombre, setRepLegalNombre] = useState('')
  const [repLegalRut, setRepLegalRut] = useState('')

  // Step 3 data
  const [planType, setPlanType] = useState('standard')
  const [seeded, setSeeded] = useState(false)

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
        setError(res.message || 'Límite de empresas alcanzado en tu plan actual. Por favor actualiza tu suscripción.')
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

    // Seed del plan de cuentas (solo si eligió estándar)
    if (planType === 'standard' && !seeded) {
      const res = await seedChartOfAccounts(orgId)
      if (!res.success) { setLoading(false); setError(res.error || 'Error al crear plan de cuentas'); return }
      setSeeded(true)
    }

    // Seed de AFPs e Isapres + Rep Legal → SIEMPRE
    await seedPayrollSettings(orgId, repLegalNombre, repLegalRut)

    setLoading(false)
    setStep(4)
  }

  const handleFinish = async () => {
    setLoading(true)
    setError('')
    const res = await completeOnboarding(orgId)
    setLoading(false)
    if (!res.success) { setError(res.error || 'Error al finalizar'); return }
    router.push('/dashboard')
  }

  // --- RUT formatter ---
  const formatRut = (value: string) => {
    const clean = value.replace(/[^0-9kK]/g, '')
    if (clean.length <= 1) return clean
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1).toUpperCase()
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${formatted}-${dv}`
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s) => {
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
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <Card className="bg-card/80 backdrop-blur-xl border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5">
        <CardHeader className="pb-4 pt-8 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {STEPS[step - 1].description}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-5 animate-in fade-in slide-in-from-top-1">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          {/* ═══ STEP 1: PERFIL ═══ */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Nombre completo</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan Pérez González" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Teléfono</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+56 9 1234 5678" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Tu rol profesional</Label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="contador">Contador independiente</option>
                  <option value="owner">Dueño de empresa</option>
                  <option value="asistente">Asistente contable</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>
              <Button onClick={handleStep1} disabled={loading} className="w-full h-11 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ═══ STEP 2: EMPRESA ═══ */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">RUT Empresa</Label>
                  <Input 
                    value={rut} 
                    onChange={e => setRut(formatRut(e.target.value))} 
                    placeholder="76.XXX.XXX-X" 
                    className="h-11" 
                    maxLength={12}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Régimen</Label>
                  <select 
                    value={regimen} 
                    onChange={e => setRegimen(e.target.value)}
                    className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option value="pro_pyme">14 D N°3 - Pro Pyme General</option>
                    <option value="pro_pyme_transparente">14 D N°8 - Pro Pyme Transparente</option>
                    <option value="parcialmente_integrado">14 A - Parcialmente Integrado</option>
                    <option value="renta_presunta">Renta Presunta</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Razón Social</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Mi Empresa SpA" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Giro comercial</Label>
                <Input value={giro} onChange={e => setGiro(e.target.value)} placeholder="Servicios contables" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Dirección</Label>
                <Input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Av. España 1234" className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Comuna</Label>
                  <Input value={comuna} onChange={e => setComuna(e.target.value)} placeholder="Punta Arenas" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Región</Label>
                  <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="Magallanes" className="h-11" />
                </div>
              </div>

              {/* Sección Representante Legal */}
              <div className="pt-4 border-t border-border mt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Representante Legal (Para Firmas)</p>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 italic">Opcional</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">Nombre Completo</Label>
                    <Input value={repLegalNombre} onChange={e => setRepLegalNombre(e.target.value)} placeholder="Ej: Juan Pérez" className="h-11 bg-primary/5 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">RUT Personal</Label>
                    <Input 
                      value={repLegalRut} 
                      onChange={e => setRepLegalRut(formatRut(e.target.value))} 
                      placeholder="12.XXX.XXX-X" 
                      className="h-11 bg-primary/5 shadow-inner"
                      maxLength={12} 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => { setStep(1); setError('') }} className="h-11 flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
                <Button onClick={handleStep2} disabled={loading} className="h-11 flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: PLAN DE CUENTAS ═══ */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <p className="text-sm text-muted-foreground">
                El plan de cuentas es la estructura contable de tu empresa. 
                Selecciona el plan estándar para comenzar rápidamente.
              </p>

              <div className="space-y-3">
                <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${planType === 'standard' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'}`}>
                  <input type="radio" name="plan" value="standard" checked={planType === 'standard'} onChange={() => setPlanType('standard')} className="mt-1" />
                  <div>
                    <p className="font-bold text-foreground">Plan Estándar Chile (IFRS Pyme)</p>
                    <p className="text-sm text-muted-foreground mt-1">55 cuentas pre-configuradas con la estructura del SII. Incluye Activos, Pasivos, Patrimonio, Ingresos y Gastos.</p>
                    <span className="inline-block mt-2 text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">Recomendado</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${planType === 'custom' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'}`}>
                  <input type="radio" name="plan" value="custom" checked={planType === 'custom'} onChange={() => setPlanType('custom')} className="mt-1" />
                  <div>
                    <p className="font-bold text-foreground">Personalizado</p>
                    <p className="text-sm text-muted-foreground mt-1">Sin plan predefinido. Podrás crear tus cuentas manualmente desde Configuración.</p>
                  </div>
                </label>
              </div>

              {seeded && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-bold">Plan de cuentas creado exitosamente</span>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => { setStep(2); setError('') }} className="h-11 flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
                <Button onClick={handleStep3} disabled={loading} className="h-11 flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {planType === 'standard' && !seeded ? 'Crear Plan y Continuar' : 'Continuar'} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ═══ STEP 4: COMPLETADO ═══ */}
          {step === 4 && (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-700">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-primary flex items-center justify-center shadow-xl shadow-primary/20">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h3 className="text-xl font-black text-foreground mb-2">¡Tu empresa está lista!</h3>
                <p className="text-muted-foreground text-sm">
                  <strong className="text-foreground">{nombre}</strong> ha sido configurada exitosamente.
                  {seeded && ' Se creó un Plan de Cuentas estándar con 55 cuentas.'}
                </p>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 text-left space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Próximos pasos sugeridos</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">1.</span> Sincroniza los indicadores económicos (UF, UTM)</li>
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">2.</span> Importa tu primer Registro de Compras/Ventas</li>
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">3.</span> Sube tu primer Formulario F29</li>
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">4.</span> Registra tu primer empleado</li>
                </ul>
              </div>

              <Button onClick={handleFinish} disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Rocket className="w-5 h-5 mr-2" />}
                Ir al Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
