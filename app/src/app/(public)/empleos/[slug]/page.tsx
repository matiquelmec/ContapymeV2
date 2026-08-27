import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  ChevronLeft, 
  Building2, 
  BadgeCheck, 
  Send, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  Phone,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getJobBySlug } from "@/actions/jobs";
import { JobSalaryCalculator } from "@/components/jobs/job-salary-calculator";
import { JobEmailButton } from "@/components/jobs/job-email-button";

import type { Metadata } from "next";

interface JobDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const jobRes = await getJobBySlug(slug);
  const job = jobRes.data;

  if (!job) {
    return {
      title: "Oferta de Empleo No Encontrada | ContaEmpleos PUQ",
    };
  }

  const title = `${job.title} en ${job.company_name} | Empleos ${job.location}`;
  const description = `${job.description.slice(0, 160)}... Oferta laboral en ${job.location}, Magallanes. Postula directo por WhatsApp en ContaEmpleos PUQ.`;

  return {
    title,
    description,
    keywords: [
      job.title.toLowerCase(),
      `empleo ${job.location.toLowerCase()}`,
      `trabajo ${job.company_name.toLowerCase()}`,
      "contaempleos magallanes",
      "bolsa de trabajo punta arenas"
    ],
    openGraph: {
      title,
      description,
      url: `https://contapymepuq.cl/empleos/${job.slug}`,
      type: "article",
      locale: "es_CL",
      siteName: "ContaEmpleos PUQ",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    }
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const jobRes = await getJobBySlug(slug);
  const job = jobRes.data;

  if (!job) {
    notFound();
  }

  // Mapeo EmploymentType Schema.org
  const employmentTypeMap: Record<string, string> = {
    "Indefinido": "FULL_TIME",
    "Plazo Fijo": "TEMPORARY",
    "Faena / Obra": "CONTRACTOR",
    "Part-Time": "PART_TIME",
    "Honorarios": "CONTRACTOR",
    "Práctica": "INTERN"
  };

  const schemaOrgJob = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": `<p>${job.description.replace(/\n/g, "<br/>")}</p>`,
    "identifier": {
      "@type": "PropertyValue",
      "name": "ContaEmpleos Magallanes",
      "value": `PUQ-${job.id.slice(0, 8)}`
    },
    "datePosted": job.published_at,
    "validThrough": job.expires_at,
    "employmentType": employmentTypeMap[job.job_type] || "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company_name,
      "sameAs": "https://contapymepuq.cl",
      "logo": "https://contapymepuq.cl/logo-contapyme.png"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location,
        "addressRegion": "Magallanes y de la Antártica Chilena",
        "addressCountry": "CL"
      }
    },
    ...(job.salary_min ? {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "CLP",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": job.salary_min,
          "maxValue": job.salary_max || job.salary_min,
          "unitText": "MONTH"
        }
      }
    } : {})
  };

  const whatsappUrl = job.contact_whatsapp
    ? `https://wa.me/${job.contact_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hola, me interesa postular al cargo de '${job.title}' en ${job.company_name} que vi publicado en ContaEmpleos Magallanes.`
      )}`
    : null;

  return (
    <div className="py-12 sm:py-16">
      {/* Schema.org JobPosting JSON-LD para Google for Jobs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJob) }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-5xl space-y-10">
        {/* NAVEGACIÓN BREADCRUMB */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Link href="/empleos" className="hover:text-primary transition-colors">Empleos Magallanes</Link>
            <span>/</span>
            <span>{job.location}</span>
            <span>/</span>
            <span className="text-foreground truncate max-w-xs">{job.title}</span>
          </div>

          <Link href="/empleos">
            <Button variant="ghost" size="sm" className="text-xs font-black uppercase tracking-wider gap-1.5 rounded-xl">
              <ChevronLeft className="h-4 w-4" /> Volver a Empleos
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* 📋 COLUMNA PRINCIPAL: DETALLE DE LA OFERTA (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Header del Aviso */}
            <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white border border-border/70 shadow-xl shadow-primary/5 space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-black">{job.company_name}</span>
                    {job.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                        <BadgeCheck className="h-3 w-3" /> Verificada
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest px-3.5 py-1.5 bg-zinc-100 rounded-xl text-zinc-700">
                    <MapPin className="h-3 w-3 inline mr-1 text-primary" /> {job.location}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tight text-foreground leading-tight">
                  {job.title}
                </h1>
              </div>

              {/* Badges de Modalidad y Sueldo */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                {job.salary_raw && (
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{job.salary_raw}</span>
                  </div>
                )}
                {job.work_shift && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{job.work_shift}</span>
                  </div>
                )}
                <div className="text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                  {job.job_type}
                </div>
                <div className="text-xs font-bold text-muted-foreground bg-zinc-100 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                  {job.sector}
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4 flex items-center justify-between text-[10px] font-bold text-muted-foreground/70 uppercase">
                <span>Publicado: {new Date(job.published_at).toLocaleDateString('es-CL')}</span>
                <span>Vigencia: 21 días (Google for Jobs)</span>
              </div>
            </div>

            {/* Descripción de Funciones */}
            <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white border border-border/70 shadow-sm space-y-5">
              <h2 className="text-sm font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Descripción del Cargo y Responsabilidades
              </h2>
              <div className="text-sm text-foreground/85 leading-relaxed space-y-4 whitespace-pre-line font-medium">
                {job.description}
              </div>
            </div>

            {/* Requisitos del Cargo */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white border border-border/70 shadow-sm space-y-5">
                <h2 className="text-sm font-black uppercase tracking-[0.25em] text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Requisitos y Competencias Técnicas
                </h2>
                <ul className="space-y-3">
                  {job.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Beneficios */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white border border-border/70 shadow-sm space-y-5">
                <h2 className="text-sm font-black uppercase tracking-[0.25em] text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Beneficios y Condiciones de Faena
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {job.benefits.map((ben, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-xs font-bold text-zinc-800 flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{ben}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🧮 CALCULADORA DE SUELDO LÍQUIDO EN VIVO */}
            <JobSalaryCalculator 
              initialGrossSalary={job.salary_min || 1000000} 
              salaryRaw={job.salary_raw} 
            />
          </div>

          {/* 📱 COLUMNA LATERAL: POSTULACIÓN RÁPIDA & SEGURIDAD (4/12) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Card de Postulación */}
            {(() => {
              const hasEmail = Boolean(job.contact_email && job.contact_email.trim().includes('@') && job.contact_email.trim().includes('.'));
              const rawPhone = (job.contact_whatsapp || '').replace(/\D/g, '');
              const hasWhatsApp = Boolean(rawPhone && rawPhone.length >= 8);
              const whatsappUrl = hasWhatsApp
                ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(
                    `Hola, me interesa postular al cargo de '${job.title}' en ${job.company_name} que vi publicado en ContaEmpleos Magallanes.`
                  )}`
                : null;
              const hasAppUrl = Boolean(job.application_url && job.application_url.trim().startsWith('http'));
              const hasAnyContact = hasEmail || hasWhatsApp || hasAppUrl;

              return (
                <div className="p-8 rounded-[2.5rem] bg-white border border-primary/20 shadow-2xl shadow-primary/10 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">
                      Canal de Postulación Directa
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tight italic">
                      ¿Te interesa este cargo?
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Comunícate con el equipo de selección de <strong>{job.company_name}</strong>.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Botón WhatsApp */}
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                      >
                        <Send className="h-4 w-4" /> Postular por WhatsApp
                      </a>
                    )}

                    {/* Botón Email Inteligente: Soporta Gmail Web, Outlook Web, app local y copia al portapapeles */}
                    {hasEmail && job.contact_email && (
                      <JobEmailButton
                        email={job.contact_email}
                        jobTitle={job.title}
                        companyName={job.company_name}
                        variant="full"
                      />
                    )}

                    {/* Botón Portal Oficial */}
                    {hasAppUrl && (
                      <a
                        href={job.application_url?.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                          !hasWhatsApp && !hasEmail
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                            : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200'
                        }`}
                      >
                        <ExternalLink className="h-4 w-4" /> Ir a la Fuente Oficial ({job.source_name || 'BNE'})
                      </a>
                    )}

                    {/* Aviso informativo si no hay contacto digital directo */}
                    {!hasAnyContact && (
                      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-muted-foreground text-center font-medium">
                        Postulación sujeta a las indicaciones detalladas en la descripción del aviso.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Sello de Cumplimiento Legal Art. 2° */}
            <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Aviso Auditado & Cumplimiento Legal</span>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed font-medium">
                Esta publicación fue validada bajo el <strong>Artículo 2° del Código del Trabajo</strong> y la <strong>Ley N° 20.609</strong>. Libre de requisitos discriminatorios y sin intermediación de cobros.
              </p>
            </div>

            {/* CTA para Pymes */}
            <div className="p-6 rounded-2xl bg-zinc-100 border border-zinc-200 space-y-3">
              <div className="flex items-center gap-2 text-zinc-900 font-black text-xs uppercase tracking-wider">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <span>¿Eres una Pyme en Magallanes?</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Publica tus ofertas de trabajo gratis y genera automáticamente los contratos de trabajo bajo el Art. 10 con el ecosistema ContaPyme.
              </p>
              <Link href="/contacto" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase tracking-wider rounded-xl">
                  Publicar una Vacante
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
