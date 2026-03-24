import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, DollarSign, Building2, BarChart3, Clock, AlertCircle, FileText, Users, Rocket, CheckCircle2 } from 'lucide-react'
import { UpdateIndicatorsButton } from './components/update-indicators-button'
import { ExecutiveDashboardClient } from './executive-dashboard-client'

const INDICATOR_CONFIG: Record<string, {
  label: string
  icon: React.ElementType
  color: string
  borderColor: string
  prefix: string
  decimals: number
}> = {
  uf:    { label: 'UF', icon: TrendingUp,  color: 'text-blue-700',   borderColor: 'border-l-blue-600',   prefix: '$', decimals: 2 },
  utm:   { label: 'UTM',      icon: Building2,  color: 'text-purple-700', borderColor: 'border-l-purple-600', prefix: '$', decimals: 0 },
  dolar: { label: 'USD',      icon: DollarSign, color: 'text-emerald-700',borderColor: 'border-l-emerald-600',prefix: '$', decimals: 2 },
  euro:  { label: 'EUR',      icon: BarChart3,  color: 'text-amber-700',  borderColor: 'border-l-amber-600',  prefix: '$', decimals: 2 },
  ipc:   { label: 'IPC',      icon: TrendingUp, color: 'text-rose-700',   borderColor: 'border-l-rose-600',   prefix: '',  decimals: 2 },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { getActiveOrganizationId } = await import('@/actions/organizations')
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return (
      <div className="p-8 text-center text-muted-foreground font-bold italic">
        Seleccione una empresa en el encabezado para ver sus estadísticas.
      </div>
    )
  }

  const { data: org } = await supabase.from('organizations').select('id, nombre, giro').eq('id', activeOrgId).single()

  const { data: indicators } = await supabase
    .from('economic_indicators')
    .select('*')
    .order('codigo', { ascending: true })

  const { count: totalEmpleados } = await supabase
    .from('employees').select('*', { count: 'exact', head: true })
    .eq('organization_id', org?.id || '').eq('activo', true)

  const { count: totalActivos } = await supabase
    .from('fixed_assets').select('*', { count: 'exact', head: true })
    .eq('organization_id', org?.id || '').eq('condicion', 'activo')

  const { count: totalF29 } = await supabase
    .from('f29_forms').select('*', { count: 'exact', head: true })
    .eq('organization_id', org?.id || '')

  const fechaActualizacion = indicators?.[0]?.updated_at
    ? new Date(indicators[0].updated_at).toLocaleDateString('es-CL', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : null

  // Onboarding metrics
  const hasIndicators = (indicators || []).length > 0;
  const hasEmployees = (totalEmpleados || 0) > 0;
  const hasF29 = (totalF29 || 0) > 0;
  const showOnboardingChecklist = !hasIndicators || !hasEmployees || !hasF29;

  return (
    <div className="space-y-12 animate-in fade-in zoom-in duration-700">

      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-2">
            Panel <span className="text-primary italic">Ejecutivo</span>
          </h1>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary opacity-50" />
            {org ? (
              <><strong className="text-foreground not-italic">{org.nombre}</strong> — {org.giro || 'Sin giro registrado'}</>
            ) : 'Bienvenido a Contapyme V2.'}
          </p>
        </div>
        <UpdateIndicatorsButton />
      </div>

      {/* ===== CHECKLIST DE ONBOARDING ===== */}
      {showOnboardingChecklist && (
        <section className="bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent border border-primary/20 rounded-3xl p-8 shadow-inner shadow-primary/5">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-primary/20 p-3 rounded-2xl text-primary">
              <Rocket className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">¡Bienvenido a Contapyme V2! 🚀</h2>
              <p className="text-muted-foreground text-sm font-medium">Te recomendamos completar estos primeros pasos para dejar tu empresa 100% operativa:</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border-2 transition-colors ${hasIndicators ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-dashed border-border'}`}>
              <div className="flex items-center gap-3 mb-2">
                {hasIndicators ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />}
                <h3 className={`font-bold ${hasIndicators ? 'text-emerald-800' : 'text-foreground'}`}>Sincroniza Indicadores</h3>
              </div>
              <p className={`text-xs ${hasIndicators ? 'text-emerald-600/80' : 'text-muted-foreground'}`}>Haz clic en "Sincronizar Indicadores" arriba para descargar la UF y UTM del día.</p>
            </div>

            <div className={`p-5 rounded-2xl border-2 transition-colors ${hasF29 ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-dashed border-border'}`}>
              <div className="flex items-center gap-3 mb-2">
                {hasF29 ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />}
                <h3 className={`font-bold ${hasF29 ? 'text-emerald-800' : 'text-foreground'}`}>Sube tu F29</h3>
              </div>
              <p className={`text-xs ${hasF29 ? 'text-emerald-600/80' : 'text-muted-foreground'}`}>Sube tu primer Formulario 29 en PDF y nuestro motor Python extraerá los datos y asientos.</p>
            </div>

            <div className={`p-5 rounded-2xl border-2 transition-colors ${hasEmployees ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-dashed border-border'}`}>
              <div className="flex items-center gap-3 mb-2">
                {hasEmployees ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />}
                <h3 className={`font-bold ${hasEmployees ? 'text-emerald-800' : 'text-foreground'}`}>Registra Empleados</h3>
              </div>
              <p className={`text-xs ${hasEmployees ? 'text-emerald-600/80' : 'text-muted-foreground'}`}>Visita el módulo de Remuneraciones para dar de alta a tu equipo.</p>
            </div>
          </div>
        </section>
      )}

      {/* ===== INDICADORES ECONÓMICOS ===== */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">INDICADORES ECONÓMICOS — CHILE</h2>
          </div>
          {fechaActualizacion && (
            <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1.5 font-black uppercase tracking-widest italic">
              <Clock className="w-3 h-3" /> Actualizado: {fechaActualizacion}
            </p>
          )}
        </div>

        {indicators && indicators.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
            {indicators.map((ind) => {
              const config = INDICATOR_CONFIG[ind.codigo]
              if (!config) return null
              const Icon = config.icon
              const formatted = Number(ind.valor).toLocaleString('es-CL', {
                minimumFractionDigits: config.decimals,
                maximumFractionDigits: config.decimals,
              })
              return (
                <Card key={ind.codigo} className={`bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 ${config.borderColor} hover:scale-[1.02] transition-all group`}>
                  <CardContent className="p-7">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">{config.label}</span>
                      <Icon className={`w-5 h-5 ${config.color} opacity-30 group-hover:opacity-100 transition-opacity`} />
                    </div>
                    <p className={`text-2xl font-black tracking-tighter ${config.color}`}>
                      {config.prefix}{formatted}{ind.codigo === 'ipc' && '%'}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-2 font-bold uppercase italic">
                      {new Date(ind.fecha).toLocaleDateString('es-CL')}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-4 p-6 border-2 border-dashed border-border/50 rounded-3xl text-muted-foreground bg-muted/5">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
            <p className="text-sm font-bold">
              No hay indicadores cargados aún. Presiona{' '}
              <span className="text-primary font-black underline">"Sincronizar Indicadores"</span>{' '}
              para consultar la UF, UTM y Dólar del día desde el SIP.
            </p>
          </div>
        )}
      </section>

      {/* ===== MOTOR EJECUTIVO PYTHON ===== */}
      <section>
        <ExecutiveDashboardClient activeOrgId={activeOrgId} />
      </section>

      {/* ===== RESUMEN MÓDULOS ===== */}
      <section className="space-y-5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">RESUMEN DE LA EMPRESA</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 border-l-blue-600 hover:scale-[1.02] transition-all group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] leading-none mb-2">Formularios F29</p>
                  <p className="text-4xl font-black text-blue-700 tracking-tighter">{totalF29 ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">IVA / Retenciones declarados</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border border-border group-hover:bg-white transition-colors">
                  <FileText className="w-8 h-8 text-blue-600 opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 border-l-emerald-600 hover:scale-[1.02] transition-all group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] leading-none mb-2">Empleados Activos</p>
                  <p className="text-4xl font-black text-emerald-700 tracking-tighter">{totalEmpleados ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">Dotación vigente en nómina</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border border-border group-hover:bg-white transition-colors">
                  <Users className="w-8 h-8 text-emerald-600 opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden border-l-8 border-l-amber-600 hover:scale-[1.02] transition-all group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] leading-none mb-2">Activos Fijos</p>
                  <p className="text-4xl font-black text-amber-700 tracking-tighter">{totalActivos ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground/60 font-bold italic mt-2">Bienes de capital en uso</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border border-border group-hover:bg-white transition-colors">
                  <TrendingUp className="w-8 h-8 text-amber-600 opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
