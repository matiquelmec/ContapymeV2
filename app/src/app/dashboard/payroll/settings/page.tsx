import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPayrollSettings } from "@/actions/payroll-settings";
import { getActiveOrganizationId } from "@/actions/organizations";
import SettingsClient from "./settings-client";
import { Settings2 } from "lucide-react";

export default async function PayrollSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orgId = await getActiveOrganizationId();
  
  if (!orgId) {
    return <div className="p-8 text-center text-slate-400 font-bold italic">Seleccione una empresa en el encabezado para configurar parámetros previsionales.</div>
  }

  const settings = await getPayrollSettings(orgId);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700">
      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-2 bg-clip-text">
            Panel de <span className="text-primary italic">Configuración</span>
          </h1>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary opacity-50" />
            Parámetros legales, topes imponibles y validaciones normativas del sistema de RRHH.
          </p>
        </div>
      </div>

      <SettingsClient 
        organizationId={orgId} 
        initialSettings={settings} 
      />
    </div>
  );
}
