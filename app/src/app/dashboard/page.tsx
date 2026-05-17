import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, DollarSign, Building2, BarChart3, Clock, AlertCircle, FileText, Users, Rocket, CheckCircle2, Package, Activity, Zap, Shield } from 'lucide-react'
import { ExecutiveDashboardClient } from './executive-dashboard-client'

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

  const { count: totalDTEs } = await supabase
    .from('dte_issued').select('*', { count: 'exact', head: true })
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
  const hasDTE = (totalDTEs || 0) > 0;
  const showOnboardingChecklist = !hasIndicators || !hasEmployees || !hasF29 || !hasDTE;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-700">

      {/* ===== CABECERA PREMIUM ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase mb-2">
              Panel <span className="text-primary italic">Ejecutivo</span>
            </h1>
            <p className="text-muted-foreground font-bold italic flex items-center gap-2 text-xs sm:text-sm">
              <Building2 className="w-4 h-4 text-primary opacity-50 shrink-0" />
              <span className="truncate max-w-full">
                {org ? (
                  <><strong className="text-foreground not-italic">{org.nombre}</strong> — {org.giro || 'Sin giro registrado'}</>
                ) : 'Bienvenido a Contapymepuq.'}
              </span>
            </p>
          </div>
        </div>

      {/* ===== MONITOR DE IMPLEMENTACIÓN ORGANIZACIONAL ===== */}
      {showOnboardingChecklist && (
        <section className="bg-gradient-to-br from-primary/[0.08] via-background to-transparent border border-primary/20 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-xl shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -z-10" />
          <div className="flex items-start gap-6 mb-10">
            <div className="bg-primary/10 p-4 rounded-2xl text-primary border border-primary/20">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase italic">Integridad de Configuración ⚓</h2>
              <p className="text-muted-foreground text-sm font-bold italic">Estado actual de la infraestructura organizacional para su empresa en Contapymepuq.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`p-6 rounded-3xl border-2 transition-all duration-500 ${hasIndicators ? 'bg-emerald-50/40 border-emerald-200/50 shadow-inner' : 'bg-card border-dashed border-border group hover:border-primary/40'}`}>
              <div className="flex items-center gap-4 mb-4">
                {hasIndicators ? (
                  <div className="bg-emerald-100 p-1.5 rounded-full"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                ) : (
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                  </div>
                )}
                <h3 className={`text-sm font-black uppercase tracking-tight ${hasIndicators ? 'text-emerald-900' : 'text-foreground'}`}>
                  {hasIndicators ? 'Sincronización Activa' : 'Sincronización en Proceso'}
                </h3>
              </div>
              <p className={`text-[11px] font-medium leading-relaxed italic ${hasIndicators ? 'text-emerald-800/70' : 'text-muted-foreground'}`}>
                {hasIndicators ? 'Indicadores económicos (UF, USD, UTM) verificados y sincronizados por el motor central.' : 'El motor Python está estableciendo conexión con el Banco Central / SIP (Tiempo estimado: 2 min).'}
              </p>
            </div>

            <div className={`p-6 rounded-3xl border-2 transition-all duration-500 ${hasF29 ? 'bg-emerald-50/40 border-emerald-200/50' : 'bg-card border-dashed border-border hover:border-primary/40'}`}>
              <div className="flex items-center gap-4 mb-4">
                {hasF29 ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20" />}
                <h3 className={`text-sm font-black uppercase tracking-tight ${hasF29 ? 'text-emerald-900' : 'text-foreground'}`}>Auditoría Tributaria (F29)</h3>
              </div>
              <p className={`text-[11px] font-medium leading-relaxed italic ${hasF29 ? 'text-emerald-800/70' : 'text-muted-foreground'}`}>Carga de registros F29 procesados por el motor de inteligencia tributaria Python.</p>
            </div>

            <div className={`p-6 rounded-3xl border-2 transition-all duration-500 ${hasEmployees ? 'bg-emerald-50/40 border-emerald-200/50' : 'bg-card border-dashed border-border hover:border-primary/40'}`}>
              <div className="flex items-center gap-4 mb-4">
                {hasEmployees ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20" />}
                <h3 className={`text-sm font-black uppercase tracking-tight ${hasEmployees ? 'text-emerald-900' : 'text-foreground'}`}>Certificación de Nómina LRE</h3>
              </div>
              <p className={`text-[11px] font-medium leading-relaxed italic ${hasEmployees ? 'text-emerald-800/70' : 'text-muted-foreground'}`}>Consolidación del capital humano y configuración de liquidaciones electrónicas.</p>
            </div>

            <div className={`p-6 rounded-3xl border-2 transition-all duration-500 ${hasDTE ? 'bg-emerald-50/40 border-emerald-200/50 shadow-inner' : 'bg-card border-dashed border-border group hover:border-primary/40'}`}>
              <div className="flex items-center gap-4 mb-4">
                {hasDTE ? (
                  <div className="bg-emerald-100 p-1.5 rounded-full"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20" />
                )}
                <h3 className={`text-sm font-black uppercase tracking-tight ${hasDTE ? 'text-emerald-900' : 'text-foreground'}`}>Motor de Facturación DTE</h3>
              </div>
              <p className={`text-[11px] font-medium leading-relaxed italic ${hasDTE ? 'text-emerald-800/70' : 'text-muted-foreground'}`}>Gestión de folios CAF e integridad criptográfica de documentos tributarios.</p>
            </div>
          </div>
        </section>
      )}

      {/* ===== MOTOR EJECUTIVO PYTHON ===== */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
        <ExecutiveDashboardClient activeOrgId={activeOrgId} />
      </section>
    </div>
  )
}
