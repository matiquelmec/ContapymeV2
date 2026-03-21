import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TrialBalanceClient from "./trial-balance-client";
import { Scale } from "lucide-react";

export default async function TrialBalancePage() {
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
        Seleccione una empresa en el encabezado para ver el Balance de Comprobación.
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
              <Scale className="w-8 h-8 text-primary" />
            </div>
            Balance de Sumas y Saldos
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-sm">
            Resumen acumulado de sumas y saldos para la verificación de cuadratura contable y estados financieros.
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      <TrialBalanceClient 
        key={activeOrgId}
        organizationId={activeOrgId} 
      />
    </div>
  );
}
