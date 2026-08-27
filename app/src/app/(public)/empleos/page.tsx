import { Briefcase, Sparkles, Building, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getRegionalJobs, getJobsStats } from "@/actions/jobs";
import { JobsBoardClient } from "@/components/jobs/jobs-board-client";

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
    <div className="relative py-12 sm:py-16 overflow-hidden">
      {/* Fondo sutil con destello de marca */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none -z-10" />
      <div className="absolute top-20 right-[-10%] w-[450px] h-[450px] bg-primary/10 rounded-full blur-[130px] -z-10 pointer-events-none opacity-50" />

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

          {/* Micro badges informativos */}
          <div className="flex flex-wrap gap-3 pt-1 text-xs font-bold">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-border shadow-sm">
              <Building className="h-4 w-4 text-primary" />
              <span>{stats.total} Vacantes Activas</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-border shadow-sm">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Punta Arenas • Natales • Porvenir • Faena</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-border shadow-sm">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span>Auditoría Art. 2° Código del Trabajo</span>
            </div>
          </div>
        </div>

        {/* ===== TABLERO INTERACTIVO DE EMPLEOS ===== */}
        <JobsBoardClient initialJobs={jobs} />
      </div>
    </div>
  );
}
