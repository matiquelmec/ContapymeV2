import Link from "next/link";
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  ArrowRight, 
  Sparkles, 
  BadgeCheck, 
  DollarSign, 
  Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobPosting } from "@/actions/jobs";

interface RegionalJobsSectionProps {
  jobs: JobPosting[];
}

export function RegionalJobsSection({ jobs }: RegionalJobsSectionProps) {
  if (!jobs || jobs.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 border-t border-border/40 bg-zinc-50/50 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl space-y-8">
        {/* Cabecera de la Sección con Enlaces de Alta Jerarquía SEO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
              <Sparkles className="h-3 w-3" /> ContaEmpleos Magallanes
            </div>
            <h2 className="text-2xl sm:text-4xl font-black italic tracking-tight uppercase text-foreground">
              Bolsa de Empleos <span className="text-primary">Punta Arenas & Faenas</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
              Ofertas de trabajo verificadas en Magallanes: salmonicultura, hidrógeno verde, comercio, logística y administración austral.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/empleos">
              <Button 
                variant="outline" 
                className="text-xs font-black uppercase tracking-wider rounded-2xl h-11 px-5 border-zinc-300 hover:bg-zinc-100 hover:text-foreground group"
              >
                <span>Ver las {jobs.length > 6 ? '+18' : ''} Vacantes</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/publicar-empleo">
              <Button 
                className="text-xs font-black uppercase tracking-wider rounded-2xl h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <Briefcase className="h-3.5 w-3.5 mr-1.5" /> + Publicar Empleo
              </Button>
            </Link>
          </div>
        </div>

        {/* Grilla SSR de Empleos con Enlaces Canónicos Directos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {jobs.slice(0, 6).map((job) => (
            <article 
              key={job.id} 
              className="group bg-white rounded-3xl p-5 sm:p-6 border border-border/70 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Metadatos superiores de Empresa y Ubicación */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground truncate">
                      <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{job.company_name}</span>
                      {job.is_verified && (
                        <span title="Empresa Verificada">
                          <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 bg-zinc-100 rounded-lg text-zinc-700 shrink-0">
                    <MapPin className="h-3 w-3 text-primary" /> {job.location}
                  </span>
                </div>

                {/* Título de la Vacante con Enlace Semántico HTML */}
                <h3 className="text-base sm:text-lg font-black italic uppercase tracking-tight text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  <Link href={`/empleos/${job.slug}`} className="focus:outline-hidden">
                    {job.title}
                  </Link>
                </h3>

                {/* Extracto descriptivo */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Pie de la Tarjeta con Detalles Salariales y Enlace a Detalle */}
              <div className="pt-5 mt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {job.salary_raw ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <DollarSign className="h-3 w-3" /> {job.salary_raw}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-lg">
                      <Clock className="h-3 w-3" /> {job.job_type}
                    </span>
                  )}
                </div>

                <Link 
                  href={`/empleos/${job.slug}`}
                  className="text-xs font-black uppercase tracking-wider text-primary hover:text-primary/80 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  Postular <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Footer del bloque con enlace a explorador completo */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground font-medium">
            ¿Buscas trabajo en faena o turnos 7x7?{" "}
            <Link href="/empleos" className="text-primary font-black underline underline-offset-4 hover:text-primary/80">
              Explora todas las vacantes en ContaEmpleos Magallanes
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
