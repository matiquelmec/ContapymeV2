import { redirect } from "next/navigation";
import LREClient from "./lre-client";
import { getLREBooks } from "@/actions/lre";
import { getActiveOrganizationId } from "@/actions/organizations";
import { createClient } from "@/lib/supabase/server";
import { Briefcase } from "lucide-react";

export default async function LREPage() {
  const orgId = await getActiveOrganizationId();

  if (!orgId) {
    return <div className="p-8 text-center text-slate-400 font-bold italic">Seleccione una empresa en el encabezado para generar archivos CSV (DT).</div>
  }

  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  const result = await getLREBooks(orgId);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700">
      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-2 bg-clip-text">
            Libro de Remuneraciones <span className="text-primary italic">Electrónico (LRE)</span>
          </h1>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary opacity-50" />
            Consolidación y síntesis del archivo CSV para la Dirección del Trabajo (DT).
          </p>
        </div>
      </div>

      <LREClient 
        organization={organization} 
        initialBooks={result.success ? result.data : []}
        error={!result.success ? result.error : null}
      />
    </div>
  );
}
