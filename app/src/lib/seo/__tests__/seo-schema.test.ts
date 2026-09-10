import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { 
  generateJobPostingSchema, 
  generateJobBreadcrumbSchema, 
  mapEmploymentType, 
  normalizeStringList,
  formatHtmlDescription,
  BASE_SITE_URL,
  type JobPostingSchemaInput
} from "../job-schema.ts";
import { 
  sanitizeJobSeoText, 
  generateCleanJobSlug,
  createGoogleOAuthJwt
} from "../indexing-service.ts";

describe("SEO & Schema.org Google for Jobs Suite", () => {
  const mockPhysicalJob: JobPostingSchemaInput = {
    id: "job-123",
    title: "Técnico en Climatización e Instalaciones",
    slug: "tecnico-climatizacion-punta-arenas-abc123",
    company_name: "Frío Austral SpA",
    location: "Punta Arenas",
    sector: "Construcción e Ingeniería",
    job_type: "Jornada Completa",
    work_shift: "Lunes a Viernes 40 Horas",
    salary_raw: "$950.000 Líquido",
    salary_min: 950000,
    salary_max: 1200000,
    is_salary_public: true,
    description: "Se requiere técnico para mantenimiento preventivo.\nNo incluye turnos nocturnos.",
    requirements: ["Título técnico en refrigeración o afín", "Licencia clase B vigente"],
    benefits: ["Seguro complementario de salud", "Almuerzo en faena"],
    source_name: "ContaEmpleos Directo",
    is_verified: true,
    status: "active",
    published_at: "2026-09-01T10:00:00Z",
    expires_at: "2026-09-22T10:00:00Z",
    created_at: "2026-09-01T10:00:00Z",
  };

  test("mapEmploymentType mapea correctamente jornadas legales chilenas a Enums de Google", () => {
    assert.equal(mapEmploymentType("Jornada Completa"), "FULL_TIME");
    assert.equal(mapEmploymentType("Turnos 7x7 en Faena"), "FULL_TIME");
    assert.equal(mapEmploymentType("Presencial"), "FULL_TIME");
    assert.equal(mapEmploymentType("Part-Time"), "PART_TIME");
    assert.equal(mapEmploymentType("Media Jornada"), "PART_TIME");
    assert.equal(mapEmploymentType("Temporada Alta"), "TEMPORARY");
    assert.equal(mapEmploymentType("Plazo Fijo 3 meses"), "TEMPORARY");
    assert.equal(mapEmploymentType("Honorarios Profesionales"), "CONTRACTOR");
    assert.equal(mapEmploymentType("Práctica Profesional"), "INTERN");
    assert.equal(mapEmploymentType(undefined), "FULL_TIME");
  });

  test("generateJobPostingSchema genera JSON-LD estricto para empleos presenciales físicos", () => {
    const schema = generateJobPostingSchema(mockPhysicalJob);

    assert.equal(schema["@context"], "https://schema.org/");
    assert.equal(schema["@type"], "JobPosting");
    assert.equal(schema.title, "Técnico en Climatización e Instalaciones");
    assert.equal(schema.employmentType, "FULL_TIME");
    assert.equal(schema.url, `${BASE_SITE_URL}/empleos/${mockPhysicalJob.slug}`);

    // Google for Jobs: Empleos físicos deben incluir PostalAddress
    assert.ok(schema.jobLocation);
    assert.equal(schema.jobLocation.address.addressLocality, "Punta Arenas");
    assert.equal(schema.jobLocation.address.addressRegion, "Magallanes y de la Antártica Chilena");
    assert.equal(schema.jobLocation.address.postalCode, "6200000");
    assert.equal(schema.jobLocation.address.addressCountry, "CL");

    // CRÍTICO: NO debe incluir applicantLocationRequirements en físico para evitar advertencia de Search Console
    assert.equal(schema.applicantLocationRequirements, undefined);
    assert.equal(schema.jobLocationType, undefined);

    // Salario cuantitativo
    assert.ok(schema.baseSalary);
    assert.equal(schema.baseSalary.currency, "CLP");
    assert.equal(schema.baseSalary.value.minValue, 950000);
    assert.equal(schema.baseSalary.value.maxValue, 1200000);
    assert.equal(schema.baseSalary.value.unitText, "MONTH");

    // Empresa y Canonicidad
    assert.equal(schema.hiringOrganization.name, "Frío Austral SpA");
    assert.equal(schema.hiringOrganization.sameAs, BASE_SITE_URL);
  });

  test("generateJobPostingSchema genera teletrabajo con applicantLocationRequirements solo si es remoto", () => {
    const remoteJob: JobPostingSchemaInput = {
      ...mockPhysicalJob,
      location: "Remoto / Punta Arenas",
      job_type: "Teletrabajo Remoto",
    };

    const schema = generateJobPostingSchema(remoteJob);

    assert.equal(schema.jobLocationType, "TELECOMMUTE");
    assert.ok(schema.applicantLocationRequirements);
    assert.equal(schema.applicantLocationRequirements.name, "Chile");
    assert.equal(schema.jobLocation, undefined);
  });

  test("formatHtmlDescription y normalizeStringList limpian XSS y producen HTML rico para Google", () => {
    const dirtyDesc = "Oferta segura.<script>alert('xss')</script>\n\nSegunda línea de funciones.";
    const reqs = ["Requisito 1", "Requisito <script>alert(1)</script> 2"];
    const html = formatHtmlDescription(dirtyDesc, reqs, []);

    assert.ok(!html.includes("<script>"));
    assert.ok(html.includes("<p>Oferta segura."));
    assert.ok(html.includes("<h3>Requisitos y Competencias:</h3>"));
    assert.ok(html.includes("<li>Requisito 1</li>"));
  });

  test("generateJobBreadcrumbSchema genera la jerarquía de 3 niveles con URLs canónicas", () => {
    const breadcrumb = generateJobBreadcrumbSchema(mockPhysicalJob);

    assert.equal(breadcrumb["@context"], "https://schema.org");
    assert.equal(breadcrumb["@type"], "BreadcrumbList");
    assert.equal(breadcrumb.itemListElement.length, 3);
    assert.equal(breadcrumb.itemListElement[0].item, `${BASE_SITE_URL}/empleos`);
    assert.equal(breadcrumb.itemListElement[1].item, `${BASE_SITE_URL}/empleos/comuna/punta-arenas`);
    assert.equal(breadcrumb.itemListElement[2].item, `${BASE_SITE_URL}/empleos/${mockPhysicalJob.slug}`);
  });
});

describe("SEO Sanitization & Indexing Service Suite", () => {
  test("sanitizeJobSeoText repara caracteres corruptos con signos de interrogación", () => {
    const brokenTitle = "Gu?a Biling?e de Turismo y Trekking";
    const repaired = sanitizeJobSeoText(brokenTitle);
    assert.equal(repaired, "Guía Bilingüe de Turismo y Trekking");

    const brokenWords = "T?cnico el?ctrico para gesti?n y administraci?n";
    const repairedWords = sanitizeJobSeoText(brokenWords);
    assert.equal(repairedWords, "Técnico eléctrico para gestión y administración");
  });

  test("generateCleanJobSlug produce slugs limpios, con palabras separadas por guiones y sin acentos", () => {
    const slug = generateCleanJobSlug(
      "Gu?a Biling?e de Turismo y Trekking",
      "Patagonia Wilderness Expeditions SpA",
      "ef08e0"
    );

    assert.ok(!slug.includes("?"));
    assert.ok(slug.startsWith("guia-bilingue-de-turismo-y-trekking-patagonia-wilderness-ex"));
    assert.ok(slug.endsWith("ef08e0"));
    assert.ok(!slug.includes("--"));
  });

  test("createGoogleOAuthJwt produce un token JWT con header y payload válidos", () => {
    // Generar par de claves RSA en memoria para probar la firma sin requerir credenciales reales
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const jwt = createGoogleOAuthJwt("test-service@contapymepuq.iam.gserviceaccount.com", privateKey);

    assert.ok(typeof jwt === "string");
    const parts = jwt.split(".");
    assert.equal(parts.length, 3);

    const header = JSON.parse(Buffer.from(parts[0], "base64").toString("utf-8"));
    const claim = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));

    assert.equal(header.alg, "RS256");
    assert.equal(claim.iss, "test-service@contapymepuq.iam.gserviceaccount.com");
    assert.equal(claim.scope, "https://www.googleapis.com/auth/indexing");
  });
});
