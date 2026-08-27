import { Briefcase, ChevronLeft, Sparkles, Building, MapPin, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getRegionalJobs, getJobsStats } from "@/actions/jobs";
import { MarketTicker } from "@/components/market-ticker";
import { getLatestIndicators } from "@/actions/indicators";
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

  const indicatorsRes = await getLatestIndicators();
  const indicators = indicatorsRes.success ? indicatorsRes.data : [];

  const stats = await getJobsStats();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <MarketTicker indicators={indicators} />

      {/* ===== HEADER NAVEGABLE ===== */}
      <header className="sticky top-11 z-50 w-full border-b border-border bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-12">
          <Link href="/" className="flex items-center gap-2 group transition-transform duration-300">
            <Image src="/logo-contapyme.png" alt="Logo Contapyme" width={140} height={40} className="h-auto w-[120px]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/noticias">
              <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest">
                Diario Regional
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl">
                <ChevronLeft className="h-4 w-4" /> Inicio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-16 px-6">
        <div className="container mx-auto max-w-6xl space-y-12">
          {/* TÍTULO HERO */}
          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              <Sparkles className="h-3 w-3" /> Concentrador Laboral Hiperlocal de la Patagonia
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] text-foreground">
              Bolsa de Empleos <br />
              <span className="text-muted-foreground/35">Magallanes & Antártica.</span>
            </h1>
            <p className="text-muted-foreground font-medium italic text-base sm:text-xl leading-relaxed max-w-2xl">
              Ofertas verificadas en Punta Arenas, Puerto Natales, Porvenir y Faenas australes. Con desglose de sueldo líquido estimado y postulación directa por WhatsApp.
            </p>

            {/* Micro métricas */}
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-bold">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 shadow-sm">
                <Building className="h-4 w-4 text-primary" />
                <span>{stats.total} Vacantes Activas</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 shadow-sm">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>Punta Arenas • Natales • Porvenir • Faena</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Auditoría Art. 2° Código del Trabajo</span>
              </div>
            </div>
          </div>

          {/* TABLERO INTERACTIVO DE EMPLEOS */}
          <JobsBoardClient initialJobs={jobs} />
        </div>
      </main>
    </div>
  );
}
