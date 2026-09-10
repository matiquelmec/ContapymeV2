import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { 
  generateJobPostingSchema, 
  sanitizeJobForPublicDelivery,
  type JobPostingSchemaInput 
} from "../../lib/seo/job-schema.ts";

describe("Job Salary Confidentiality & Data Protection Suite", () => {
  const baseMockJob: JobPostingSchemaInput = {
    id: "job-recasur-001",
    title: "Vendedor de Repuestos Automotrices",
    slug: "vendedor-repuestos-recasur-12345",
    company_name: "Recasur",
    company_rut: "76.123.456-7",
    location: "Punta Arenas",
    sector: "Comercio & Retail",
    job_type: "Jornada Completa",
    work_shift: "Lunes a Viernes (40 Horas)",
    salary_raw: "$850.000 Líquido",
    salary_min: 850000,
    salary_max: 1100000,
    is_salary_public: false,
    description: "Atención a clientes y asesoría técnica en repuestos automotrices.",
    requirements: ["Experiencia en mesón automotriz", "Residencia en Punta Arenas"],
    benefits: ["Seguro complementario", "Caja los Andes"],
    contact_email: "empleos@recasur.cl",
    contact_whatsapp: "+56912345678",
    source_name: "ContaEmpleos Portal",
    is_verified: true,
    status: "active",
    published_at: "2026-09-10T10:00:00Z",
    expires_at: "2026-10-01T10:00:00Z",
    created_at: "2026-09-10T10:00:00Z",
  };

  test("1. sanitizeJobForPublicDelivery purga salary_raw, salary_min y salary_max si is_salary_public es false", () => {
    const confidentialJob: JobPostingSchemaInput = { ...baseMockJob, is_salary_public: false };
    const publicVersion = sanitizeJobForPublicDelivery(confidentialJob);

    assert.equal(publicVersion.salary_raw, null, "salary_raw debe ser null para el público");
    assert.equal(publicVersion.salary_min, null, "salary_min debe ser null para el público");
    assert.equal(publicVersion.salary_max, null, "salary_max debe ser null para el público");
    assert.equal(publicVersion.is_salary_public, false);
    assert.equal(publicVersion.company_name, "Recasur");
    assert.equal(publicVersion.title, "Vendedor de Repuestos Automotrices");
  });

  test("2. sanitizeJobForPublicDelivery mantiene los montos si is_salary_public es true", () => {
    const publicJob: JobPostingSchemaInput = { ...baseMockJob, is_salary_public: true };
    const publicVersion = sanitizeJobForPublicDelivery(publicJob);

    assert.equal(publicVersion.salary_raw, "$850.000 Líquido");
    assert.equal(publicVersion.salary_min, 850000);
    assert.equal(publicVersion.salary_max, 1100000);
    assert.equal(publicVersion.is_salary_public, true);
  });

  test("3. generateJobPostingSchema NO incluye baseSalary en Schema.org cuando is_salary_public es false", () => {
    const confidentialSchemaInput: JobPostingSchemaInput = {
      ...baseMockJob,
      is_salary_public: false,
    };

    const schema = generateJobPostingSchema(confidentialSchemaInput);

    assert.equal(schema.baseSalary, undefined, "baseSalary NO debe incluirse en JSON-LD de Google si el sueldo es confidencial");
    assert.equal(schema.title, "Vendedor de Repuestos Automotrices");
    assert.equal(schema.hiringOrganization.name, "Recasur");
  });

  test("4. generateJobPostingSchema SÍ incluye baseSalary estructurado cuando is_salary_public es true", () => {
    const publicSchemaInput: JobPostingSchemaInput = {
      ...baseMockJob,
      is_salary_public: true,
    };

    const schema = generateJobPostingSchema(publicSchemaInput);

    assert.ok(schema.baseSalary, "baseSalary debe existir en JSON-LD si el sueldo es público");
    assert.equal(schema.baseSalary.currency, "CLP");
    assert.equal(schema.baseSalary.value.minValue, 850000);
    assert.equal(schema.baseSalary.value.maxValue, 1100000);
  });
});
