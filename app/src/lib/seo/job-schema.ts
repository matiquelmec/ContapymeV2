export interface JobPostingSchemaInput {
  id?: string;
  title: string;
  slug: string;
  company_name: string;
  company_rut?: string | null;
  company_logo_url?: string | null;
  location: string;
  sector?: string | null;
  job_type?: string | null;
  work_shift?: string | null;
  salary_raw?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  is_salary_public?: boolean;
  description: string;
  requirements?: string[] | string | null;
  benefits?: string[] | string | null;
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  application_url?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  is_verified?: boolean;
  status?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
}

export const BASE_SITE_URL = "https://www.contapymepuq.cl";

/**
 * 🛡️ Sanitiza ofertas de empleo para entrega pública: si is_salary_public es false,
 * enmascara salary_raw, salary_min y salary_max para proteger la confidencialidad de la empresa.
 */
export function sanitizeJobForPublicDelivery<T extends JobPostingSchemaInput>(job: T): T {
  const isPublic = job.is_salary_public !== false;
  return {
    ...job,
    salary_raw: isPublic ? (job.salary_raw || null) : null,
    salary_min: isPublic ? (job.salary_min || null) : null,
    salary_max: isPublic ? (job.salary_max || null) : null,
  };
}

/**
 * Normaliza listas que pueden venir como array, string separado por saltos de línea o JSON string.
 */
export function normalizeStringList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => String(v).trim()).filter(Boolean);
        }
      } catch {
        // Fallback al split normal
      }
    }
    return trimmed
      .split("\n")
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Mapea el tipo de jornada chileno al Enum oficial de Schema.org / Google for Jobs:
 * FULL_TIME | PART_TIME | CONTRACTOR | TEMPORARY | INTERN | VOLUNTEER | PER_DIEM | OTHER
 */
export function mapEmploymentType(jobType: string | undefined): string {
  if (!jobType) return "FULL_TIME";
  const t = jobType.toLowerCase();

  if (t.includes("part") || t.includes("media")) {
    return "PART_TIME";
  }
  if (t.includes("temporad") || t.includes("plazo fijo") || t.includes("reemplazo") || t.includes("verano")) {
    return "TEMPORARY";
  }
  if (t.includes("honorarios") || t.includes("contratista") || t.includes("freelance")) {
    return "CONTRACTOR";
  }
  if (t.includes("pasant") || t.includes("practica") || t.includes("práctica") || t.includes("intern")) {
    return "INTERN";
  }
  // "Jornada Completa", "Faena", "Presencial", "Turnos 7x7", etc. corresponden a empleo asalariado dependiente
  return "FULL_TIME";
}

function escapeXmlOrHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Limpia y formatea descripciones eliminando posibles scripts maliciosos (XSS)
 * mientras produce el HTML requerido por Google for Jobs (<p>, <h3>, <ul>, <li>).
 */
export function formatHtmlDescription(
  description: string,
  requirements: string[] = [],
  benefits: string[] = []
): string {
  // Limpieza básica anti-XSS
  const safeDesc = (description || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map((par) => `<p>${par.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const reqHtml =
    requirements.length > 0
      ? `<h3>Requisitos y Competencias:</h3><ul>${requirements
          .map((r) => `<li>${escapeXmlOrHtml(r)}</li>`)
          .join("")}</ul>`
      : "";

  const benHtml =
    benefits.length > 0
      ? `<h3>Beneficios Ofrecidos:</h3><ul>${benefits
          .map((b) => `<li>${escapeXmlOrHtml(b)}</li>`)
          .join("")}</ul>`
      : "";

  return `${safeDesc}${reqHtml}${benHtml}`;
}

/**
 * Genera el objeto Schema.org JobPosting conforme a las especificaciones 2026 de Google for Jobs.
 */
export function generateJobPostingSchema(job: JobPostingSchemaInput) {
  const requirementsList = normalizeStringList(job.requirements);
  const benefitsList = normalizeStringList(job.benefits);
  const employmentType = mapEmploymentType(job.job_type || undefined);

  const isRemote =
    (job.location || "").toLowerCase().includes("remoto") ||
    (job.job_type || "").toLowerCase().includes("remoto");

  const canonicalJobUrl = `${BASE_SITE_URL}/empleos/${job.slug}`;

  // Fechas ISO 8601 válidas
  const datePosted = job.published_at
    ? new Date(job.published_at).toISOString()
    : new Date().toISOString();

  const validThrough = job.expires_at
    ? new Date(job.expires_at).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Códigos postales oficiales de Magallanes
  const postalCode =
    job.location === "Punta Arenas"
      ? "6200000"
      : job.location === "Puerto Natales"
      ? "6160000"
      : job.location === "Porvenir"
      ? "6300000"
      : job.location === "Cabo de Hornos" || job.location === "Puerto Williams"
      ? "6350000"
      : "6200000";

  const schema: Record<string, any> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: formatHtmlDescription(job.description, requirementsList, benefitsList),
    identifier: {
      "@type": "PropertyValue",
      name: job.company_name,
      value: job.slug,
    },
    datePosted,
    validThrough,
    employmentType,
    directApply: true,
    url: canonicalJobUrl,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company_name,
      sameAs: BASE_SITE_URL,
      logo: job.company_logo_url || `${BASE_SITE_URL}/logo-contapyme.png`,
    },
  };

  if (isRemote) {
    schema.jobLocationType = "TELECOMMUTE";
    schema.applicantLocationRequirements = {
      "@type": "Country",
      name: "Chile",
    };
  } else {
    // Para empleos físicos presenciales, Google for Jobs NO debe tener applicantLocationRequirements
    schema.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: `${job.location}, Región de Magallanes`,
        addressLocality: job.location,
        addressRegion: "Magallanes y de la Antártica Chilena",
        postalCode,
        addressCountry: "CL",
      },
    };
  }

  // Si existe salario estructurado mínimo y es público
  if (job.is_salary_public !== false && job.salary_min && job.salary_min > 0) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "CLP",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salary_min,
        maxValue: job.salary_max && job.salary_max >= job.salary_min ? job.salary_max : job.salary_min,
        unitText: "MONTH",
      },
    };
  }

  return schema;
}

/**
 * Genera el Schema.org BreadcrumbList para una oferta específica
 */
export function generateJobBreadcrumbSchema(job: JobPostingSchemaInput) {
  const comunaSlug = encodeURIComponent(
    job.location.toLowerCase().replace(/\s+/g, "-")
  );

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ContaEmpleos Magallanes",
        item: `${BASE_SITE_URL}/empleos`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: job.location,
        item: `${BASE_SITE_URL}/empleos/comuna/${comunaSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: job.title,
        item: `${BASE_SITE_URL}/empleos/${job.slug}`,
      },
    ],
  };
}
