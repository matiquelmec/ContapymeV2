import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Landmark, ArrowRightLeft, FileSpreadsheet, Lock } from 'lucide-react'
import { ReconciliationClient } from './reconciliation-client'

export const metadata = {
  title: 'Conciliación Bancaria - Contapyme V2'
}

export default async function ReconciliationPage() {
  const supabase = await createClient()

  const { getActiveOrganizationId } = await import('@/actions/organizations')
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return <div className="p-8 text-center text-muted-foreground font-bold italic">Seleccione una empresa en el encabezado para administrar la conciliación bancaria.</div>
  }

  const { data: accountingEntries, error } = await supabase
    .from('journal_entry_lines')
    .select(`
      id, cuenta_codigo, cuenta_nombre, tipo, monto, created_at,
      journal_entries!inner(id, fecha, glosa, organization_id)
    `)
    .eq('journal_entries.organization_id', activeOrgId)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700">

      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
              <Landmark className="w-8 h-8 text-primary" />
            </div>
            Conciliación <span className="text-primary italic ml-2">Bancaria</span>
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-sm flex items-center gap-2">
            Cruza cartolas bancarias contra asientos del Libro Diario generados por el motor RCV.
          </p>
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
      <ReconciliationClient accountingEntries={accountingEntries || []} />

    </div>
  )
}
