import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LedgerClient from "./ledger-client";
import { getChartOfAccounts } from "@/actions/accounting";
import { BookOpen } from "lucide-react";

export default async function LedgerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Obtener organización activa real
  const { getActiveOrganizationId } = await import('@/actions/organizations')
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return (
      <div className="p-8 text-center text-muted-foreground font-medium italic underline decoration-primary/30 underline-offset-8">
        Seleccione una empresa en el encabezado para ver el Libro Mayor.
      </div>
    )
  }

  // Necesitamos las cuentas para que el usuario elija cuál mayorizar
  const accounts = await getChartOfAccounts(activeOrgId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            Libro Mayor
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-sm">
            Detalle cronológico de movimientos y saldos acumulados por cada cuenta contable individual.
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      <LedgerClient 
        organizationId={activeOrgId} 
        accounts={accounts} 
      />
    </div>
  );
}
