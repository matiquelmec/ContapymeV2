import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Landmark, ArrowRightLeft, FileSpreadsheet, Lock, CheckCircle2 } from 'lucide-react'
import { ReconciliationClient } from './reconciliation-client'

export const metadata = {
  title: 'Conciliación Bancaria - Contapymepuq'
}

export default async function ReconciliationPage() {
  const supabase = await createClient()

  // Intentar obtener ID de organización activa
  const { getActiveOrganizationId } = await import('@/actions/organizations')
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return (
      <div className="p-20 text-center animate-in fade-in zoom-in duration-700">
        <div className="inline-block p-6 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 mb-6">
            <Landmark className="w-12 h-12 text-primary opacity-40" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Seleccione una Empresa</h2>
        <p className="text-muted-foreground font-bold italic text-xs mt-2 uppercase tracking-tight">Active una organización en el selector superior para ver sus registros bancarios.</p>
      </div>
    )
  }

  // Consulta REFORZADA con join robusto
  const { getBankAccounts } = await import('@/actions/bank-reconciliation')
  
  const [accountingEntriesRes, bankAccounts] = await Promise.all([
    supabase
      .from('journal_entry_lines')
      .select(`
        id, 
        cuenta_codigo, 
        cuenta_nombre, 
        tipo, 
        monto, 
        created_at,
        journal_entries!inner(id, fecha, glosa, organization_id),
        bank_reconciliations(id, status, reconciled_at, notes)
      `)
      .eq('journal_entries.organization_id', activeOrgId)
      .order('created_at', { ascending: false })
      .limit(100),
    getBankAccounts(activeOrgId)
  ]);

  const { data: accountingEntries, error } = accountingEntriesRes;

  if (error) {
    console.error("Critical Query Error (ReconciliationPage):", error);
  }

  // Filtrado de auditorías para el contador (Soporta objeto 1:1 o Arreglo)
  const reconciledCount = accountingEntries?.filter(ae => {
    const br = ae.bank_reconciliations;
    return br && (Array.isArray(br) ? br.length > 0 : true);
  }).length || 0;

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700">

      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 sm:px-0">
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground uppercase flex flex-row items-center gap-3 sm:gap-4 mb-2">
            <div className="p-2.5 sm:p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm shrink-0">
              <Landmark className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <span className="leading-tight">
              Conciliación <span className="text-primary italic block sm:inline">Bancaria</span>
            </span>
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-xs sm:text-sm leading-relaxed max-w-2xl">
            Cruza cartolas bancarias contra asientos del Libro Diario generados por el motor RCV.
          </p>
        </div>

        {/* Contador de Auditorías (Visibilidad real de lo guardado) */}
        <div className="flex items-center justify-between sm:justify-start gap-4 bg-emerald-500/5 px-6 py-4 rounded-3xl border border-emerald-500/10 w-full md:w-auto">
            <div className="flex flex-col items-start sm:items-end">
                <span className="text-[10px] font-black uppercase text-emerald-600 leading-none">Auditorías Guardadas</span>
                <span className="text-2xl font-black text-emerald-600 leading-none mt-1">
                    {reconciledCount}
                </span>
            </div>
            <div className="w-px sm:w-1.5 h-10 bg-emerald-500/10 mx-2" />
            <div className="p-2 bg-white rounded-xl border border-emerald-500/10 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      {/* ===== PASOS DEL PROCESO ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-l-8 border-l-emerald-500 hover:scale-[1.01] transition-all group">
          <CardHeader className="p-8">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 w-fit mb-4">
              <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            </div>
            <CardTitle className="text-foreground font-black uppercase text-sm tracking-widest group-hover:text-emerald-600 transition-colors">
              1. IMPORTAR CARTOLA
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs font-bold leading-relaxed mt-2">
              Sube un archivo CSV o Excel de Santander, BCI, BancoEstado, Itaú u otro banco compatible.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-white border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-l-8 border-l-primary hover:scale-[1.01] transition-all group">
          <CardHeader className="p-8">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 w-fit mb-4">
              <ArrowRightLeft className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-foreground font-black uppercase text-sm tracking-widest group-hover:text-primary transition-colors">
              2. MOTOR DE CRUCE V2
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs font-bold leading-relaxed mt-2">
              El algoritmo intentará emparejar montos y fechas de la cartola contra el Libro Diario automáticamente.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-white border-border shadow-2xl rounded-[2.5rem] overflow-hidden border-l-8 border-l-rose-500 hover:scale-[1.01] transition-all group">
          <CardHeader className="p-8">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 w-fit mb-4">
              <Lock className="w-7 h-7 text-rose-600" />
            </div>
            <CardTitle className="text-foreground font-black uppercase text-sm tracking-widest group-hover:text-rose-600 transition-colors">
              3. CIERRE DE TESORERÍA
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs font-bold leading-relaxed mt-2">
              Marca asientos como "Pagados" y visualiza el saldo real de disponibilidad inmediata.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Interfaz Cliente Principal */}
      <ReconciliationClient 
        key={activeOrgId}
        accountingEntries={accountingEntries || []} 
        bankAccounts={bankAccounts || []}
        organizationId={activeOrgId}
      />

    </div>
  )
}


