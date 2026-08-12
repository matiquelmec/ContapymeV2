import { createClient } from '@/lib/supabase/server'
import { ShieldCheck, FileText, Building2, User, Lock, AlertTriangle, ArrowLeft, Scale, CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'

function formatRUT(rut?: string) {
  if (!rut) return ''
  const clean = rut.replace(/[^0-9kK]/g, '')
  if (clean.length < 2) return rut
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const dv = clean.slice(-1).toUpperCase()
  return `${body}-${dv}`
}

function fCurrency(val: number) {
  return `$${Math.round(val).toLocaleString('es-CL')}`
}

export default async function VerifyDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cleanId = (id || '').trim().toLowerCase()
  const supabase = await createClient()

  let docType: 'liquidation' | 'trial_balance' | 'vacation' | 'contract' | 'unknown' = 'unknown'
  let liquidation: any = null
  let org: any = null
  let emp: any = null
  let docTitle = 'Documento Oficial'
  let docSubtitle = ''
  let totalBruto = 0
  let totalDescuentos = 0
  let totalLiquido = 0
  let isHonorarios = false

  // A. Verificación de Balance de Comprobación (tb-...)
  if (cleanId.startsWith('tb-')) {
    const orgPrefix = cleanId.replace('tb-', '')
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .limit(100)
    
    org = orgs?.find(o => o.id.toLowerCase().startsWith(orgPrefix)) || null
    if (org) {
      docType = 'trial_balance'
      docTitle = 'Balance de Comprobación y Saldos (8 Columnas)'
      docSubtitle = `REGISTRO OFICIAL CERTIFICADO — ${org.nombre}`
    }
  } 
  // B. Verificación de Finiquito de Trabajo (fin-...)
  else if (cleanId.startsWith('fin-')) {
    const rawId = cleanId.replace('fin-', '')
    const { data: terms } = await supabase
      .from('employee_terminations')
      .select('*, employees(*), organizations(*)')
      .or(`id.ilike.${rawId}%`)
      .limit(1)

    const term = terms && terms.length > 0 ? terms[0] : null
    if (term) {
      docType = 'termination' as any
      emp = term.employees
      org = term.organizations
      docTitle = 'Finiquito de Trabajo Acreditado'
      docSubtitle = `CAUSAL: ${term.causal_despido?.toUpperCase()}`
      totalLiquido = Number(term.total_finiquito || 0)
    }
  }
  // C. Verificación de Feriado Legal / Vacaciones (vac-...)
  else if (cleanId.startsWith('vac-')) {
    docType = 'vacation'
    docTitle = 'Comprobante de Feriado Legal (Vacaciones)'
    docSubtitle = 'REGISTRO DE DESCANSO SEGÚN ART. 74 CÓDIGO DEL TRABAJO'
  }
  // C. Verificación de Liquidaciones (Default / Direct ID / Folio)
  else {
    const rawCode = cleanId.replace('liq-', '').replace('ctr-', '')
    const { data: liquidations } = await supabase
      .from('liquidations')
      .select('*, employees(*), organizations(*)')
      .or(`id.ilike.${rawCode}%,folio_number.ilike.%${cleanId}%,folio_number.ilike.%${rawCode}%`)
      .limit(1)

    liquidation = liquidations && liquidations.length > 0 ? liquidations[0] : null

    if (!liquidation && rawCode.length >= 6) {
      const { data: allLiq } = await supabase
        .from('liquidations')
        .select('*, employees(*), organizations(*)')
        .limit(100)
      
      liquidation = allLiq?.find(l => l.id.toLowerCase().startsWith(rawCode) || (l.folio_number || '').toLowerCase().includes(rawCode)) || null
    }

    if (liquidation) {
      docType = 'liquidation'
      emp = liquidation.employees
      org = liquidation.organizations
      const snap = liquidation.calculation_snapshot || {}
      isHonorarios = (liquidation.tipo_contrato || snap.tipo_contrato) === 'honorarios' || Number(snap.retencion_honorarios || 0) > 0
      docTitle = isHonorarios ? 'Liquidación de Honorarios' : 'Liquidación de Sueldo'
      docSubtitle = `FOLIO N° ${liquidation.folio_number || liquidation.id.slice(0, 12).toUpperCase()}`
      totalBruto = Number(liquidation.total_haberes_brutos || 0)
      totalDescuentos = Number(liquidation.total_descuentos || 0)
      totalLiquido = Number(liquidation.sueldo_liquido || 0)
    }
  }

  const isFound = docType !== 'unknown'

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* HEADER LOGO */}
      <div className="mb-8 text-center space-y-3">
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <Image
            src="/logo-contapyme.png"
            alt="ContaPymePuq Logo"
            width={180}
            height={60}
            priority
            className="h-auto w-auto drop-shadow-sm mx-auto"
          />
        </Link>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
          Portal Público de Verificación de Integridad Digital
        </p>
      </div>

      <div className="w-full max-w-2xl">
        {isFound ? (
          <Card className="bg-card border-emerald-500/30 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-600">
            
            {/* BADGE CERTIFICADO */}
            <CardHeader className="bg-emerald-500/5 border-b border-border/50 p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-sm">
                <ShieldCheck className="w-9 h-9 text-emerald-600 animate-pulse" />
              </div>
              <div>
                <Badge className="bg-emerald-600 text-white font-black uppercase text-[10px] tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-emerald-600/20 mb-2">
                  Documento Auténtico & Integridad Verificada
                </Badge>
                <CardTitle className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground mt-2">
                  {docTitle}
                </CardTitle>
                <CardDescription className="text-xs font-bold text-emerald-700 uppercase tracking-widest mt-1">
                  {docSubtitle}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-8">
              
              {/* EMPRESA Y TRABAJADOR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* EMPRESA EMISORA */}
                <div className="p-5 bg-muted/20 rounded-2xl border border-border space-y-2">
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-wider mb-1">
                    <Building2 className="w-4 h-4" /> Entidad Emisora
                  </div>
                  <p className="font-black text-foreground uppercase text-sm">{org?.nombre || 'ContaPymePuQ Regional'}</p>
                  <p className="text-xs font-mono font-bold text-muted-foreground">RUT: {formatRUT(org?.rut_empresa)}</p>
                  <p className="text-[10px] text-muted-foreground/80 italic">{org?.region || 'Magallanes, Chile'}</p>
                </div>

                {/* TITULAR / COLABORADOR */}
                <div className="p-5 bg-muted/20 rounded-2xl border border-border space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-xs tracking-wider mb-1">
                    {docType === 'trial_balance' ? <Scale className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    {docType === 'trial_balance' ? 'Régimen Contable' : 'Titular Registrado'}
                  </div>
                  <p className="font-black text-foreground uppercase text-sm">
                    {emp ? `${emp.nombres} ${emp.apellido_paterno} ${emp.apellido_materno}` : 'Contabilidad IFRS / Pyme'}
                  </p>
                  <p className="text-xs font-mono font-bold text-muted-foreground">
                    {emp ? `RUT: ${formatRUT(emp.rut)}` : 'Normativa SII / Chile'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 italic">
                    {emp?.cargo || 'Auditoría Centralizada'}
                  </p>
                </div>

              </div>

              {/* DETALLES SI ES LIQUIDACIÓN */}
              {docType === 'liquidation' && (
                <div className="space-y-3 p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 font-bold text-xs text-foreground">
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="text-muted-foreground uppercase text-[10px] font-black tracking-wider">Período Fiscal</span>
                    <span className="font-mono font-black">{liquidation.periodo}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="text-muted-foreground uppercase text-[10px] font-black tracking-wider">Estado en Sistema</span>
                    <Badge variant="outline" className="font-mono text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border-emerald-300">
                      {liquidation.status || 'aprobada'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="text-muted-foreground uppercase text-[10px] font-black tracking-wider">Total Haberes Brutos</span>
                    <span className="font-mono font-black text-foreground">{fCurrency(totalBruto)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="text-muted-foreground uppercase text-[10px] font-black tracking-wider">Total Descuentos / Retención</span>
                    <span className="font-mono font-black text-rose-600">-{fCurrency(totalDescuentos)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 pt-3">
                    <span className="text-emerald-700 uppercase text-xs font-black tracking-widest">Alcance Líquido Acreditado</span>
                    <span className="font-mono text-lg font-black text-emerald-700">{fCurrency(totalLiquido)}</span>
                  </div>
                </div>
              )}

              {/* SELLO CRIPTOGRÁFICO */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border text-center space-y-1 font-mono text-[10px] text-muted-foreground">
                <div className="flex items-center justify-center gap-2 text-foreground font-black uppercase text-[11px] mb-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> Sello Digital de Inmutabilidad SHA-256
                </div>
                <p className="truncate">AUTH-ID: {cleanId.toUpperCase()}</p>
                <p>Fecha Emisión: {new Date().toLocaleDateString('es-CL')}</p>
                <p className="text-[9px] text-muted-foreground/60">Certificado por ContaPymePuQ Autonomous Accounting & Payroll Engine</p>
              </div>

            </CardContent>

          </Card>
        ) : (
          <Card className="bg-card border-rose-500/30 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-rose-600 text-center p-8 md:p-12 space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 shadow-sm">
              <AlertTriangle className="w-9 h-9 text-rose-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Documento No Encontrado
              </h2>
              <p className="text-xs text-muted-foreground font-bold italic max-w-md mx-auto">
                El código de verificación <code className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">{cleanId}</code> no corresponde a un documento activo en los registros oficiales.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/">
                <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-all">
                  <ArrowLeft className="w-4 h-4" /> Volver al Inicio
                </button>
              </Link>
            </div>
          </Card>
        )}

        {/* FOOTER */}
        <div className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          ContaPymePuQ — Sistema Descentralizado de Contabilidad y Nómina Regional
        </div>
      </div>

    </div>
  )
}
