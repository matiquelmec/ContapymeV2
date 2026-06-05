import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const activeOrgId = "496582ff-6256-4862-95d2-99c06c225655" // Kioska
  
  const { data: entries, error } = await supabase
    .from('journal_entries_enriched')
    .select(`
      id,
      fecha,
      glosa,
      monto_total
    `)
    .eq('organization_id', activeOrgId)
    .order('fecha', { ascending: false })
    .limit(5)
    
  return NextResponse.json({ entries, error })
}
