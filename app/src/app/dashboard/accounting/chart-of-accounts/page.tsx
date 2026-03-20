import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChartOfAccountsClient from "./chart-client";
import { getChartOfAccounts } from "@/actions/accounting";
import { Layers } from "lucide-react";

export default async function ChartOfAccountsPage() {
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
      <div className="p-8 text-center text-muted-foreground font-medium italic">
        Seleccione una empresa en el encabezado para administrar el Plan de Cuentas.
      </div>
    )
  }

  const accounts = await getChartOfAccounts(activeOrgId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
              <Layers className="w-8 h-8 text-primary" />
            </div>
            Plan de Cuentas (IFRS)
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-sm">
            Estructura contable clasificada: Activos, pasivos, patrimonio, ingresos y gastos.
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      <ChartOfAccountsClient 
        organizationId={activeOrgId} 
        initialAccounts={accounts} 
      />
    </div>
  );
}
