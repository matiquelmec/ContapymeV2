import { redirect } from "next/navigation";
import { getContractsList, getActiveEmployees } from "@/actions/contracts";
import { getPayrollSettings } from "@/actions/payroll-settings";
import { getActiveOrganizationId } from "@/actions/organizations";
import ContractsClient from "./contracts-client";
import { Briefcase } from "lucide-react";

export default async function ContractsPage() {
  const orgId = await getActiveOrganizationId();

  if (!orgId) {
    return <div className="p-8 text-center text-slate-400 font-bold italic">Seleccione una empresa en el encabezado para gestionar contratos.</div>
  }

  const contracts = await getContractsList(orgId);
  const employees = await getActiveEmployees(orgId);
  const settings = await getPayrollSettings(orgId);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700">
      {/* ===== CABECERA PREMIUM ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b-2 border-primary/5">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-2 bg-clip-text">
            Gestión de <span className="text-primary italic">Contratos</span>
          </h1>
          <p className="text-muted-foreground font-bold italic flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary opacity-50" />
            Generación normativa de contratos de trabajo, anexos y documentos institucionales.
          </p>
        </div>
      </div>

      <ContractsClient 
        organizationId={orgId} 
        initialContracts={contracts}
        employees={employees}
        settings={settings}
      />
    </div>
  );
}
