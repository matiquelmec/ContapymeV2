import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAccountingConfig } from "@/actions/accounting";
import { ConfigClient } from "./config-client";
import { Settings } from "lucide-react";

export default async function AccountingConfigPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { getActiveOrganizationId } = await import('@/actions/organizations')
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return <div className="p-8 text-center text-muted-foreground font-medium italic underline decoration-primary/30 underline-offset-8">Seleccione una empresa en el encabezado para configurar el mapeo de cuentas.</div>
  }

  const configs = await getAccountingConfig(activeOrgId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            Mapeo y Automatización
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-sm">
            Configure las reglas de imputación contable para la generación automática de asientos desde módulos externos.
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      <ConfigClient initialConfigs={configs} organizationId={activeOrgId} />
    </div>
  );
}
