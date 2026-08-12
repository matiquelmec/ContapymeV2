import { createClient } from '@/lib/supabase/server'
import { BookOpen, Filter, Search } from 'lucide-react'
import { JournalClient } from './journal-client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }> | { periodo?: string }
}) {
  const supabase = await createClient()
  const resolvedParams = await searchParams
  const selectedPeriodo = resolvedParams?.periodo || ""

  // 1. Obtener organización activa real
  const { getActiveOrganizationId } = await import('@/actions/organizations')
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return <div className="p-8 text-center text-muted-foreground font-medium italic underline decoration-primary/30 underline-offset-8">Seleccione una empresa en el encabezado para ver el Libro Diario.</div>
  }

  // 2. Obtener periodos únicos con asientos para la organización
  const { data: rawDates } = await supabase
    .from('journal_entries')
    .select('fecha')
    .eq('organization_id', activeOrgId)
    .order('fecha', { ascending: false })

  const availablePeriods = Array.from(
    new Set((rawDates || []).map((d: any) => d.fecha ? d.fecha.slice(0, 7) : ''))
  ).filter(p => p !== '') as string[]

  // 3. Obtener asientos contables desde la VISTA ENRIQUECIDA (con o sin filtro de periodo)
  let query = supabase
    .from('journal_entries_enriched')
    .select(`
      id,
      fecha,
      glosa,
      monto_total,
      lines:journal_entry_lines(id, tipo, monto, account_id, chart_of_accounts(codigo, nombre))
    `)
    .eq('organization_id', activeOrgId)
    .order('fecha', { ascending: false })

  if (selectedPeriodo && selectedPeriodo !== 'all') {
    const start = `${selectedPeriodo}-01`
    const [year, month] = selectedPeriodo.split('-')
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const end = `${selectedPeriodo}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('fecha', start).lte('fecha', end)
  } else {
    query = query.limit(100)
  }

  const { data: entries, error } = await query

  if (error) {
    console.error("Error fetching journal entries from enriched view:", error)
  }

  console.log("FECHAS DE ASIENTOS EN SERVER COMPONENT:", (entries || []).slice(0, 5).map(e => ({ id: e.id, fecha: e.fecha })))

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10" suppressHydrationWarning={true}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6" suppressHydrationWarning={true}>
        <div suppressHydrationWarning={true}>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm" suppressHydrationWarning={true}>
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            Libro Diario
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-sm">
            Registro cronológico detallado de todos los hechos económicos de la entidad.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0" suppressHydrationWarning={true}>
          <div className="relative w-full sm:w-80" suppressHydrationWarning={true}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
            <Input
              id="journalSearchInput"
              name="journalSearchInput"
              type="search"
              placeholder="Ej. Pago Proveedores, Folio..."
              className="pl-12 bg-white border-border text-foreground font-black h-14 rounded-full shadow-lg focus:ring-primary focus:border-primary transition-all text-sm uppercase tracking-widest hover:border-primary/50"
            />
          </div>
          <Button variant="outline" className="border-2 border-border text-foreground font-black uppercase text-[10px] tracking-widest px-8 h-14 rounded-full hover:bg-muted shadow-lg active:scale-95 transition-all w-full sm:w-auto flex-shrink-0">
            <Filter className="w-5 h-5 mr-3" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" suppressHydrationWarning={true} />

      <JournalClient 
        key={activeOrgId} 
        entries={entries || []} 
        availablePeriods={availablePeriods}
        selectedPeriodo={selectedPeriodo}
      />
    </div>
  )
}
