import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveOrganizationId } from "@/actions/organizations";
import { 
  getProfile, 
  getOrganizationDetails, 
  getOrganizationMembers 
} from "@/actions/settings";
import { getDTEConfig, getCAFRecords } from "@/actions/billing";
import SettingsPageClient from "./settings-page-client";
import { Settings2 } from "lucide-react";

export default async function GlobalSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile();
  const orgId = await getActiveOrganizationId();
  
  if (!orgId) {
    return (
      <div className="p-8 text-center text-muted-foreground font-bold italic">
        <h2 className="text-xl mb-4 font-black uppercase text-foreground">Configuración Global</h2>
        <p>Seleccione una empresa en el encabezado para acceder a la configuración de la organización.</p>
      </div>
    );
  }

  const [organization, members, dteConfigRes, cafRes] = await Promise.all([
    getOrganizationDetails(orgId),
    getOrganizationMembers(orgId),
    getDTEConfig(orgId),
    getCAFRecords(orgId)
  ]);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700 pb-12">

      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-2">
            Configuración <span className="text-primary italic">Corporativa</span>
          </h1>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary opacity-50" />
            Información fiscal, perfiles de usuario y gestión de accesos del equipo B2B.
          </p>
        </div>
      </div>

      <SettingsPageClient 
        organizationId={orgId}
        userEmail={user.email || ""}
        userId={user.id}
        initialProfile={JSON.parse(JSON.stringify(profile))}
        initialOrganization={JSON.parse(JSON.stringify(organization))}
        initialMembers={JSON.parse(JSON.stringify(members))}
        initialDTEConfig={JSON.parse(JSON.stringify(dteConfigRes?.data))}
        initialCAFRecords={JSON.parse(JSON.stringify(cafRes?.data || []))}
      />
    </div>
  );
}
