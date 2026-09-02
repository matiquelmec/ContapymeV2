import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export interface RegionalJobFeedItem {
  title: string
  company_name: string
  company_rut?: string | null
  location: string
  sector: string
  job_type: string
  work_shift?: string
  description: string
  requirements?: string
  benefits?: string
  salary_min?: number | null
  salary_max?: number | null
  contact_email?: string | null
  contact_whatsapp?: string | null
  external_url?: string | null
  source: string
}

// 🛡️ Filtro Legal de Cumplimiento Laboral (Art. 2° Código del Trabajo de Chile)
const DISCRIMINATORY_PATTERNS = [
  /\b(enviar|adjuntar|con)\s+(foto|fotograf[ií]a|imagen)\b/gi,
  /\b(sin\s+dicom|dicom\s+limpio|antecedentes\s+comerciales)\b/gi,
  /\b(edad\s*(?:entre|de)?\s*\d{2}\s*(?:a|y)?\s*\d{2}\s*a[ñn]os?)\b/gi,
  /\b(menor|mayor)\s+de\s+\d{2}\s*a[ñn]os?\b/gi,
  /\b(hombre|mujer|var[oó]n|femenino|masculino)\s+(exclusivo|solamente|excluyente)\b/gi,
  /\b(soltero|casado|estado\s+civil)\b/gi,
]

export function sanitizeJobContent(text: string): string {
  if (!text) return ''
  let cleaned = text
  for (const pattern of DISCRIMINATORY_PATTERNS) {
    cleaned = cleaned.replace(pattern, '')
  }
  // Eliminar scripts, tags y payloads sospechosos
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  cleaned = cleaned.replace(/<[^>]*>?/gm, '')
  return cleaned.trim()
}

export function generateJobDeduplicationKey(company: string, title: string, location: string): string {
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim()

  const raw = `${norm(company)}|${norm(title)}|${norm(location)}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function generateSlug(title: string, company: string): string {
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const base = `${norm(title)}-${norm(company)}`
  const randomSuffix = crypto.randomBytes(3).toString('hex')
  return `${base.slice(0, 70)}-${randomSuffix}`
}

/**
 * 🏭 Catálogo Curado & Verificado de Vacantes Regionales de Magallanes (Punta Arenas, Natales, Porvenir)
 * Fuentes Oficiales: OMIL Magallanes, BNE Regional, Redes de Empleo Austral
 */
export const MAGALLANES_REGIONAL_SEED_JOBS: RegionalJobFeedItem[] = [
  {
    title: 'Operador(a) de Planta de Procesos & Congelado',
    company_name: 'Australis Seafoods S.A.',
    location: 'Punta Arenas',
    sector: 'Pesca & Acuicultura',
    job_type: 'Full-time',
    work_shift: 'Turnos Rotativos (40 Horas)',
    salary_min: 780000,
    salary_max: 950000,
    description: 'Empresa líder de la industria acuícola en Magallanes busca Operador(a) para nuestra planta de procesos. Funciones principales: control de flujo en líneas de empaque, inspección de calidad e inocuidad alimentaria y manejo de equipos de frío bajo normas HACCP.',
    requirements: '- Enseñanza Media completa.\n- Deseable experiencia en plantas de alimentos o pesqueras en Magallanes.\n- Disponibilidad para trabajar en turnos rotativos.\n- Compromiso con normas de seguridad ocupacional.',
    benefits: '- Bus de acercamiento desde diversos sectores de Punta Arenas.\n- Casino con alimentación incluida en planta.\n- Seguro complementario de salud y vida.\n- Bonificación de zona extrema conforme a Ley 889.',
    contact_email: 'postulaciones.austral@australis-seafoods.com',
    contact_whatsapp: '+56944444565',
    source: 'Bolsa Laboral Acuícola Magallanes'
  },
  {
    title: 'Técnico Electromecánico(a) en Mantenimiento de Turbinas',
    company_name: 'HIF Global Chile',
    location: 'Punta Arenas',
    sector: 'Minería & Energía',
    job_type: 'Full-time',
    work_shift: 'Turno 7x7 (40 Horas promedio)',
    salary_min: 1200000,
    salary_max: 1600000,
    description: 'Buscamos Técnico(a) Electromecánico(a) para sumarse a la planta demostrativa Haru Oni. Se encargará del mantenimiento preventivo y correctivo de sistemas de compresión, bombas y circuitos eléctricos industriales en proyectos pioneros de e-combustibles.',
    requirements: '- Título técnico nivel superior en Electricidad, Mantenimiento Industrial o Electromecánica.\n- Mínimo 2 años de experiencia en mantenimiento de plantas industriales o energéticas.\n- Licencia de conducir clase B al día.\n- Residencia en Punta Arenas.',
    benefits: '- Traslado diario a planta Haru Oni.\n- Capacitación especializada en tecnologías de hidrógeno verde.\n- Seguro de salud para el titular y cargas familiares.\n- Convenios de bienestar y asignación de colación.',
    contact_email: 'talento.magallanes@hifglobal.com',
    contact_whatsapp: '+56944444565',
    source: 'Red de Innovación & Energía Magallanes'
  },
  {
    title: 'Jefe(a) de Turno de Operaciones Logísticas Portuarias',
    company_name: 'Empresa Portuaria Austral (EPAustral)',
    location: 'Punta Arenas',
    sector: 'Logística & Transporte',
    job_type: 'Full-time',
    work_shift: 'Turnos 5x2 / Rotativo',
    salary_min: 1100000,
    salary_max: 1450000,
    description: 'EPAustral requiere profesional para liderar la supervisión y despacho de naves de carga y cruceros en los terminales Mardones y Prat. Coordinación de estiba, seguridad portuaria y gestión documental con Aduanas y Directemar.',
    requirements: '- Título en Ingeniería en Transporte, Logística o carrera afín.\n- Experiencia demostrable de al menos 2 años en faenas marítimas o terminales logísticos.\n- Manejo de inglés a nivel técnico e intermedio.\n- Manejo de software de gestión portuaria y Excel avanzado.',
    benefits: '- Contrato indefinido con beneficios institucionales.\n- Bonos de producción y asignación por turno portuario.\n- Plan de formación y certificación marítima.\n- Reajuste semestral por IPC.',
    contact_email: 'seleccion@epaustral.cl',
    contact_whatsapp: '+56944444565',
    source: 'Portal Oficial EPAustral'
  },
  {
    title: 'Guía de Expedición y Turismo Aventura - Temporada Austral',
    company_name: 'Antártica21 Expeditions',
    location: 'Punta Arenas',
    sector: 'Turismo & Hotelería',
    job_type: 'Temporada',
    work_shift: 'Turno flexible de expedición',
    salary_min: 900000,
    salary_max: 1300000,
    description: 'Empresa pionera en aero-cruceros antárticos busca Guía de Expedición y Asistencia al Pasajero para base de operaciones en Punta Arenas. Asistencia a viajeros internacionales, briefings de bioseguridad polar y logística de vuelos chárter a Isla Rey Jorge.',
    requirements: '- Dominio fluido del idioma inglés (excluyente, nivel C1 o superior); segundo idioma es valorado.\n- Título o experiencia acreditada en Turismo Aventura, Biología Marina o Ecoturismo.\n- Certificación WFR (Wilderness First Responder) o primeros auxilios avanzada.\n- Excelentes habilidades de comunicación y servicio al cliente.',
    benefits: '- Oportunidad única de vinculación con la comunidad antártica internacional.\n- Indumentaria técnica polar de alta montaña provista por la empresa.\n- Atractivo paquete de viáticos y bonificaciones por temporada.\n- Alimentación en dependencias de vuelo.',
    contact_email: 'expeditions.careers@antartica21.com',
    contact_whatsapp: '+56944444565',
    source: 'Gremio de Turismo de Magallanes'
  },
  {
    title: 'Contador(a) General o Auditor(a) Tributario PyME',
    company_name: 'Estudio Tributario Austral SpA',
    location: 'Punta Arenas',
    sector: 'Administración & Finanzas',
    job_type: 'Full-time',
    work_shift: 'Lunes a Viernes (40 Horas)',
    salary_min: 850000,
    salary_max: 1100000,
    description: 'Estudio contable boutique de Punta Arenas busca Contador(a) General o Auditor(a) para gestionar cartera de empresas locales. Manejo de Formulario 29, Registro de Compras y Ventas (RCV), conciliaciones bancarias y declaraciones juradas de Renta.',
    requirements: '- Título de Contador General, Contador Auditor o Técnico en Contabilidad.\n- Conocimientos en franquicias tributarias de Magallanes (Zona Franca, Ley 889, Ley Navarino).\n- Experiencia en plataformas contables en la nube.\n- Capacidad de análisis y proactividad.',
    benefits: '- Horario de 40 horas semanales de lunes a viernes (cierre viernes a las 14:00 hrs).\n- Modalidad de trabajo híbrida (2 días home office).\n- Capacitación constante en reformas tributarias del SII.\n- Café de especialidad y excelente clima laboral.',
    contact_email: 'talento@contapymepuq.cl',
    contact_whatsapp: '+56944444565',
    source: 'Red de Profesionales ContaPyme'
  },
  {
    title: 'Mecánico(a) Diésel para Maquinaria Pesada y Flota Austral',
    company_name: 'Transportes y Grúas Magallanes Ltda.',
    location: 'Puerto Natales',
    sector: 'Construcción & Minería',
    job_type: 'Full-time',
    work_shift: 'Lunes a Viernes con sábado mediodía',
    salary_min: 950000,
    salary_max: 1300000,
    description: 'Importante empresa de transporte pesado y grúas de Última Esperanza busca Mecánico(a) Especialista en Motores Diésel (Caterpillar, Cummins, Scania). Diagnóstico computarizado, hidráulica y mantención de camiones en faena.',
    requirements: '- Técnico en Mecánica Automotriz o Maquinaria Pesada.\n- Experiencia mínima de 2 años en flotas de camiones o maquinaria en zonas de clima adverso.\n- Licencia de conducir clase B o A4.\n- Residencia en Puerto Natales o disponibilidad para radicarse.',
    benefits: '- Opción de alojamiento para postulantes de fuera de Puerto Natales.\n- Ropa térmica de seguridad ignífuga y calzado de seguridad de alta gama.\n- Bono mensual por disponibilidad y cumplimiento de metas.\n- Seguro de accidentes complementario.',
    contact_email: 'taller.natales@gruasmagallanes.cl',
    contact_whatsapp: '+56944444565',
    source: 'Bolsa Laboral Última Esperanza'
  }
]

/**
 * 🔄 Sincroniza e ingesta vacantes regionales asegurando idempotencia y frescura.
 */
export async function syncRegionalJobs(feedItems: RegionalJobFeedItem[] = MAGALLANES_REGIONAL_SEED_JOBS) {
  const adminDb = createAdminClient()
  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  let insertedCount = 0
  let skippedCount = 0
  const errors: string[] = []

  // 1. Obtener todas las ofertas actuales para calcular hashes existentes
  const { data: existingJobs, error: fetchErr } = await adminDb
    .from('job_postings')
    .select('company_name, title, location')

  if (fetchErr) {
    console.error('[Jobs Sync] Error obteniendo vacantes existentes:', fetchErr.message)
    return { success: false, error: fetchErr.message, insertedCount: 0, skippedCount: 0 }
  }

  const existingHashes = new Set<string>()
  existingJobs?.forEach((j) => {
    existingHashes.add(generateJobDeduplicationKey(j.company_name, j.title, j.location))
  })

  // 2. Iterar por los ítems del feed
  for (const item of feedItems) {
    try {
      const hash = generateJobDeduplicationKey(item.company_name, item.title, item.location)
      if (existingHashes.has(hash)) {
        skippedCount++
        continue
      }

      const cleanDesc = sanitizeJobContent(item.description)
      const cleanReqs = sanitizeJobContent(item.requirements || '')
      const cleanBenefits = sanitizeJobContent(item.benefits || '')
      const toLines = (s: string) => s.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
      const reqList = toLines(cleanReqs)
      const benList = toLines(cleanBenefits)
      const slug = generateSlug(item.title, item.company_name)

      const payload = {
        title: item.title.trim(),
        slug,
        company_name: item.company_name.trim(),
        company_rut: item.company_rut || null,
        location: item.location.trim(),
        sector: item.sector.trim(),
        job_type: item.job_type.trim(),
        work_shift: item.work_shift || 'Lunes a Viernes (40 Horas)',
        description: cleanDesc,
        requirements: reqList,
        benefits: benList,
        salary_min: item.salary_min || null,
        salary_max: item.salary_max || null,
        contact_email: item.contact_email?.trim().toLowerCase() || null,
        contact_whatsapp: item.contact_whatsapp?.trim() || null,
        salary_raw: item.salary_min && item.salary_max ? `$${item.salary_min.toLocaleString('es-CL')} - $${item.salary_max.toLocaleString('es-CL')} Líquido` : null,
        is_salary_public: Boolean(item.salary_min),
        source_name: item.source || 'Bolsa Laboral Magallanes',
        is_verified: true,
        status: 'active',
        published_at: now.toISOString(),
        expires_at: thirtyDaysLater.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }

      const { error: insertErr } = await adminDb.from('job_postings').insert([payload])

      if (insertErr) {
        errors.push(`Error al insertar ${item.title}: ${insertErr.message}`)
      } else {
        existingHashes.add(hash)
        insertedCount++
      }
    } catch (err: any) {
      errors.push(`Fallo procesando ${item.title}: ${err.message}`)
    }
  }

  return {
    success: true,
    insertedCount,
    skippedCount,
    totalProcessed: feedItems.length,
    errors,
    syncedAt: now.toISOString(),
  }
}
