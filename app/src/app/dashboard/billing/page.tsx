import { createClient } from '@/lib/supabase/server'
import { getDTEsForOrganization, getDTEStats } from '@/actions/billing'
import { getActiveOrganizationId } from '@/actions/organizations'
import { BillingClient } from './billing-client'
import { FileText, Building2, Shield } from 'lucide-react'

export default async function BillingPage() {
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return (
      <div className="p-8 text-center text-muted-foreground font-bold italic">
        Seleccione una empresa en el encabezado para gestionar la facturación.
      </div>
    )
  }

  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('nombre, rut_empresa')
    .eq('id', activeOrgId)
    .single()

  const [dtesRes, statsRes] = await Promise.all([
    getDTEsForOrganization(activeOrgId),
    getDTEStats(activeOrgId)
  ])

  const dtes = dtesRes.success ? dtesRes.data : []
  const stats = statsRes.success ? statsRes.data : {
    totalDTEs: 0,
    acceptedDTEs: 0,
    signedDTEs: 0,
    totalFacturado: 0,
    availableFolios: 0
  }

  return (
    <div className="space-y-8">
      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
              Facturación <span className="text-primary italic">Electrónica</span>
            </h1>
          </div>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary opacity-50" />
            {org ? (
              <><strong className="text-foreground not-italic">{org.nombre}</strong> — {org.rut_empresa}</>
            ) : 'Gestión de DTEs y folios autorizados.'}
          </p>
        </div>
        
        <div className="bg-emerald-50/50 border border-emerald-200/50 px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-full">
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Estado de Conexión SII</p>
            <p className="text-xs font-bold text-emerald-600 italic">Certificación Activa</p>
          </div>
        </div>
      </div>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <BillingClient key={activeOrgId} organizationId={activeOrgId} initialData={dtes} stats={stats as any} />
    </div>
  )
}
