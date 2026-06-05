import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, History, ShieldCheck } from "lucide-react";
import { RCVAnalysisClient } from "./rcv-analysis-client";
import { RCVUploadDynamic as RCVUploadClient } from "./rcv-upload-dynamic";
import { getActiveOrganizationId } from "@/actions/organizations";
import { getRCVDashboardData } from "@/actions/rcv";

export const metadata = {
  title: "RCV — Registro de Compras y Ventas | Contapymepuq",
  description: "Importa, analiza y contabiliza tu Registro de Compras y Ventas del SII con gráficos interactivos.",
};

function AnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg" />)}
      </div>
      <div className="h-10 bg-muted rounded-lg w-64" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="h-80 bg-muted rounded-lg" />
        <div className="h-80 bg-muted rounded-lg" />
      </div>
    </div>
  );
}


export default async function RCVPage({
  searchParams,
}: {
  searchParams?: Promise<{ periodo?: string }> | { periodo?: string }
}) {
  const organizationId = await getActiveOrganizationId();
  const resolvedParams = searchParams ? await searchParams : {};
  const initialSelectedPeriodo = resolvedParams?.periodo || "";
  // Pre-fetch inicial de datos en el servidor
  const initialData = await getRCVDashboardData(organizationId, initialSelectedPeriodo || undefined);

  return (
    <div className="space-y-12 p-8">

      {/* ---- HEADER ---- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
            </div>
            Tributario & RCV
          </h1>
          <p className="text-muted-foreground font-bold italic tracking-wide text-sm">
            Auditoría digital, sincronización SII e inteligencia contable delegada.
          </p>
        </div>
        <Link
          href="/dashboard/accounting/rcv/history"
          className="relative z-10 inline-flex items-center gap-3 px-10 h-14 rounded-full bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl hover:scale-[1.03] active:scale-95 group shadow-primary/20"
        >
          <History className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Historial de Lotes
        </Link>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/20 via-border to-transparent" />

      {/* ---- ANÁLISIS (gráficos + KPIs) ---- */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">Inteligencia de Datos</h2>
          <div className="h-px bg-gradient-to-r from-border to-transparent flex-1" />
        </div>
        <Suspense fallback={<AnalysisSkeleton />}>
          <RCVAnalysisClient 
            key={organizationId}
            organizationId={organizationId} 
            initialData={initialData} 
            initialSelectedPeriodo={initialSelectedPeriodo}
          />
        </Suspense>
      </section>

      {/* ---- IMPORTAR ARCHIVOS ---- */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100/50">Sincronización SII</h2>
          <div className="h-px bg-gradient-to-r from-border to-transparent flex-1" />
        </div>
        <RCVUploadClient key={organizationId} organizationId={organizationId} />
      </section>

      {/* ---- NOTA DE INTEGRIDAD ---- */}
      <Card className="bg-card border-border shadow-2xl rounded-[2rem] overflow-hidden border-l-8 border-l-emerald-500/30">
        <CardContent className="p-8 flex items-center gap-6">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground uppercase tracking-widest mb-1">Integridad de Datos & Auditoría SII</p>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-4xl">
              El motor de conciliación detecta automáticamente colisiones por <span className="font-bold text-foreground">folio, RUT y período fiscal</span>.
              Puedes re-inyectar datasets múltiples veces sin riesgo de duplicidad nominal. Los asientos contables son generados mediante
              transacciones atómicas exclusivas para documentos que carecen de registro previo en el libro diario.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
