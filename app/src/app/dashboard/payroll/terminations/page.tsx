import { redirect } from 'next/navigation'
import TerminationsClient from './terminations-client'
import { getActiveOrganizationId } from '@/actions/organizations'
import { createClient } from '@/lib/supabase/server'
import { FileWarning } from 'lucide-react'

export const metadata = {
  title: 'Finiquitos - Contapymepuq'
}

export default async function TerminationsPage() {
  const orgId = await getActiveOrganizationId();

  if (!orgId) {
    return <div className="p-8 text-center text-slate-400 font-bold italic">Seleccione una empresa en el encabezado para gestionar finiquitos.</div>
  }

  const supabase = await createClient()

  const { data: terminations, error } = await supabase
    .from('employee_terminations')
    .select(`
      *,
      employees (
        nombres,
        apellido_paterno,
        apellido_materno,
        rut,
        fecha_ingreso,
        sueldo_base
      )
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching terminations:", error)
    return <div className="p-8 text-red-500">Error al cargar finiquitos: {error.message}</div>
  }

  const { data: employees } = await supabase
    .from('employees')
    .select('id, nombres, apellido_paterno, rut')
    .eq('organization_id', orgId)

  // Fetch settings for institutional consistency
  const { data: settings } = await supabase
    .from('organization_payroll_settings')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle()

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700">
      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-2 bg-clip-text">
            Cálculo de <span className="text-rose-600 italic">Finiquitos</span>
          </h1>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-rose-600 opacity-50" />
            Gestión de desvinculaciones, indemnizaciones y términos de contrato legales.
          </p>
        </div>
      </div>

      <TerminationsClient 
        terminations={terminations || []} 
        employees={employees || []} 
        organizationId={orgId}
        settings={settings}
      />
    </div>
  );
}
