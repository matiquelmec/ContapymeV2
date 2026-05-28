import { Landmark, WalletCards } from "lucide-react";
import { getActiveOrganizationId } from "@/actions/organizations";
import { getTreasuryDashboardData } from "@/actions/treasury";
import { TreasuryClient } from "./treasury-client";

export const metadata = {
  title: "Gestion de Tesoreria - Contapymepuq",
};

export default async function TreasuryPage() {
  const organizationId = await getActiveOrganizationId();

  if (!organizationId) {
    return (
      <div className="p-6 sm:p-12 lg:p-20 text-center animate-in fade-in zoom-in duration-700">
        <div className="inline-flex p-5 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 mb-6">
          <WalletCards className="w-11 h-11 text-primary opacity-50" />
        </div>
        <h2 className="text-lg sm:text-xl font-black uppercase tracking-widest text-foreground">
          Seleccione una Empresa
        </h2>
        <p className="text-muted-foreground font-bold italic text-xs mt-2 uppercase tracking-tight">
          Active una organizacion en el selector superior para operar tesoreria.
        </p>
      </div>
    );
  }

  const data = await getTreasuryDashboardData(organizationId);

  return (
    <div className="space-y-8 sm:space-y-10 animate-in fade-in zoom-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1 sm:px-0">
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm shrink-0">
              <Landmark className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <span className="leading-tight">
              Gestion de <span className="text-primary italic block sm:inline">Tesoreria</span>
            </span>
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-xs sm:text-sm leading-relaxed max-w-2xl">
            Carga RCV, controla documentos pagados y configura medios de pago para contabilizacion automatica.
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      <TreasuryClient organizationId={organizationId} initialData={data} />
    </div>
  );
}
