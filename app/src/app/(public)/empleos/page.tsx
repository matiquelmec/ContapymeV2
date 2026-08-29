import { Briefcase, Sparkles, Building, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getRegionalJobs, getJobsStats } from "@/actions/jobs";
import { JobsBoardClient } from "@/components/jobs/jobs-board-client";
import { AuroraBackground } from "@/components/ui/aurora-background";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bolsa de Empleos en Punta Arenas y Magallanes | ContaEmpleos PUQ",
  description: "Ofertas laborales en Punta Arenas, Puerto Natales, Porvenir y Faenas de Magallanes. Vacantes verificadas en salmonicultura, hidrógeno verde, comercio, turismo y administración.",
  keywords: [
    "empleos punta arenas",
    "trabajo punta arenas magallanes",
    "bolsa de empleo magallanes",
    "ofertas laborales puerto natales",
    "turnos faena magallanes",
    "trabajo salmonera punta arenas",
    "hidrogeno verde magallanes empleos"
  ],
  openGraph: {
    title: "ContaEmpleos Magallanes | Portal de Empleos Regional",
    description: "Bolsa de trabajo hiperlocal para Punta Arenas y la Patagonia Chilena.",
    url: "https://contapymepuq.cl/empleos",
  },
};

export const revalidate = 300; // Refrescar cada 5 minutos

export default async function JobsPage() {
  const jobsRes = await getRegionalJobs();
  const jobs = jobsRes.success ? jobsRes.data : [];
  const stats = await getJobsStats();

  return (
    <AuroraBackground className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-6xl space-y-12">
        {/* ===== HERO PRINCIPAL ===== */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            <Sparkles className="h-3 w-3" /> Concentrador Laboral Hiperlocal de la Patagonia
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] text-foreground">
              Bolsa de Empleos <br />
              <span className="text-muted-foreground/35 font-serif">Magallanes & Antártica.</span>
            </h1>
            <p className="text-muted-foreground font-medium italic text-base sm:text-lg leading-relaxed max-w-2xl">
              Ofertas verificadas en Punta Arenas, Puerto Natales, Porvenir y Faenas australes. Con desglose de sueldo líquido estimado y postulación directa por WhatsApp.
            </p>
          </div>

          {/* Micro badges informativos y Botón Publicar para Empresas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap gap-2.5 text-xs font-bold">
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-border shadow-xs">
                <Building className="h-4 w-4 text-primary" />
                <span>{stats.total} Vacantes Activas</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-border shadow-xs">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>Punta Arenas • Natales • Faena</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-border shadow-xs">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Art. 2° DT</span>
              </div>
            </div>

            <Link
              href="/publicar-empleo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-5 h-11 shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <Briefcase className="h-4 w-4" />
              <span>+ Publicar Oferta ($0 / Destacado)</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* ===== TABLERO INTERACTIVO DE EMPLEOS ===== */}
        <JobsBoardClient initialJobs={jobs} />
      </div>
    </AuroraBackground>
  );
}
