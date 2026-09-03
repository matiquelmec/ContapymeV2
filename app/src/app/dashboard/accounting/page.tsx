import { createClient } from '@/lib/supabase/server'
import { F29Uploader } from './f29-uploader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  History, LayoutDashboard, ArrowRight, TrendingUp,
  ShieldCheck, AlertTriangle, ExternalLink, FileBarChart2, Receipt
} from 'lucide-react'
import Link from 'next/link'
import { SIIDefenseDialog } from './sii-defense-dialog'

export default async function AccountingPage() {
  const supabase = await createClient()

  const { getActiveOrganizationId } = await import('@/actions/organizations')
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return <div className="p-8 text-center text-muted-foreground font-bold italic">Seleccione una empresa en el encabezado para ver el panel contable.</div>
  }

  const { data: orgData } = await supabase.from('organizations').select('nombre').eq('id', activeOrgId).single()
  const activeOrgName = orgData?.nombre || 'Ninguna'

  const { data: lastF29 } = await supabase
    .from('f29_forms')
    .select('*')
    .eq('organization_id', activeOrgId)
    .order('periodo', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700 pb-10">

      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
              <FileBarChart2 className="w-8 h-8 text-primary" />
            </div>
            Auditoría <span className="text-primary italic ml-2">Tributaria</span>
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary opacity-50" />
            Empresa Activa: <strong className="text-foreground not-italic">{activeOrgName}</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <SIIDefenseDialog organizationId={activeOrgId} activeOrgName={activeOrgName} />
          <Link href="/dashboard/accounting/f29-comparative">
            <Button className="h-14 rounded-3xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] px-10 shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all gap-3">
              <History className="w-5 h-5" /> ANÁLISIS COMPARATIVO
            </Button>
          </Link>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ===== UPLOADER PRINCIPAL ===== */}
        <div className="lg:col-span-2">
          <F29Uploader key={activeOrgId} activeOrgId={activeOrgId} />
        </div>

        {/* ===== PANEL LATERAL ===== */}
        <div className="space-y-6">

          {/* KPI ÚLTIMO PERÍODO */}
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/10">
            <CardHeader className="bg-muted/5 border-b border-border p-7">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Estado Último Período</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-7">
              {lastF29 ? (
                <div className="space-y-5">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-black tracking-widest mb-1">IVA a Pagar</span>
                      <span className="text-3xl font-black text-foreground tracking-tighter">
                        ${Number(lastF29.total_a_pagar).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                      {new Date(lastF29.periodo).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="pt-4 border-t-2 border-border/50 space-y-3">
                    <div className="flex justify-between text-[11px] font-black uppercase">
                      <span className="text-muted-foreground italic">Ventas Netas:</span>
                      <span className="text-blue-700 tabular-nums">${Number(lastF29.ventas_netas).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-black uppercase">
                      <span className="text-muted-foreground italic">Compras Proy.:</span>
                      <span className="text-emerald-700 tabular-nums">${Number(lastF29.credito_fiscal / 0.19).toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 inline-block mb-3">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground font-bold italic">Sin registros históricos para esta organización.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MÓDULOS RELACIONADOS */}
          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-500/10">
            <CardHeader className="bg-muted/5 border-b border-border p-7">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">Módulos Relacionados</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {[
                { href: '/dashboard/accounting/rcv', label: 'RCV — Registro SII', icon: LayoutDashboard, color: 'bg-blue-50 text-blue-600', hoverColor: 'group-hover:bg-blue-600 group-hover:text-white' },
                { href: '/dashboard/accounting/reports', label: 'Informes de Gestión', icon: TrendingUp, color: 'bg-purple-50 text-purple-600', hoverColor: 'group-hover:bg-purple-600 group-hover:text-white' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${item.color} ${item.hoverColor} transition-colors shadow-sm`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black text-foreground uppercase tracking-tight">{item.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* PROTOCOLO */}
          <div className="bg-muted/10 border-2 border-border/50 rounded-3xl p-7">
            <h3 className="text-foreground font-black text-[10px] uppercase tracking-[0.25em] flex items-center gap-2 mb-5">
              <ExternalLink className="w-3.5 h-3.5 text-primary" /> PROTOCOLO V2 — FLUJO DE TRABAJO
            </h3>
            <ul className="space-y-4">
              {[
                'Suba el PDF original del F29 para activar el Motor de Proximidad Global.',
                'Verifique los ratios en el Dashboard Comparativo para detectar desviaciones fiscales.',
                'Los datos se consolidan automáticamente en el Balance General.'
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-[11px] text-muted-foreground">
                  <span className="text-primary font-black text-xs shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
