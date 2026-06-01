import { getActiveOrganizationId } from "@/actions/organizations";
import { createClient } from "@/lib/supabase/server";
import { getMedicalLeaves } from "@/actions/medical-leaves";
import NovedadesClient from "./novedades-client";
import MedicalLeavesCard from "./medical-leaves-card";
import { Briefcase } from "lucide-react";

export default async function NovedadesPage() {
  const orgId = await getActiveOrganizationId();

  if (!orgId) {
    return (
      <div className="p-8 text-center text-slate-400 font-bold italic">
        Seleccione una empresa en el encabezado para ingresar novedades masivas.
      </div>
    );
  }

  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("organization_id", orgId)
    .eq("activo", true)
    .order("apellido_paterno", { ascending: true });

  const medicalLeaves = await getMedicalLeaves(orgId);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700">
      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-2 bg-clip-text">
            Ingreso Masivo de <span className="text-primary italic">Novedades</span>
          </h1>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary opacity-50" />
            Planilla de carga rápida de variables mensuales para el cálculo de liquidaciones.
          </p>
        </div>
      </div>

      <NovedadesClient
        organization={organization}
        initialEmployees={employees || []}
      />

      <MedicalLeavesCard
        orgId={orgId}
        employees={employees || []}
        initialLeaves={medicalLeaves}
      />
    </div>
  );
}
