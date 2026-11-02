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

import { sanitizeJobSeoText, notifySearchEnginesOfJob } from '@/lib/seo/indexing-service'

export function generateSlug(title: string, company: string): string {
  const norm = (s: string) =>
    (sanitizeJobSeoText(s) || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const titleSlug = norm(title).slice(0, 45)
  const companySlug = norm(company).slice(0, 30)
  const deterministicSuffix = crypto
    .createHash('sha256')
    .update(`${titleSlug}|${companySlug}`)
    .digest('hex')
    .slice(0, 6)
  return `${titleSlug}-${companySlug}-${deterministicSuffix}`.replace(/--+/g, '-')
}

/**
 * 🏭 Catálogo Curado de Vacantes Regionales Reales de Magallanes (Punta Arenas, Natales, Porvenir)
 * Fuentes Oficiales Verificables: Bolsa Nacional de Empleo (BNE.cl), Chiletrabajos Magallanes, OMIL
 */
export const MAGALLANES_REGIONAL_SEED_JOBS: RegionalJobFeedItem[] = []
/**
 * 🔄 Sincroniza e ingesta vacantes regionales asegurando idempotencia, frescura y fuentes reales.
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

  // 2. Iterar por los ítems del feed verificado
  for (const item of feedItems) {
    try {
      const hash = generateJobDeduplicationKey(item.company_name, item.title, item.location)
      if (existingHashes.has(hash)) {
        skippedCount++
        continue
      }

      // Regla de Calidad y Veracidad: Exigir canal de postulación directa comprobable (Email, WhatsApp o URL directa de postulación)
      const contactEmail = item.contact_email?.trim().toLowerCase() || null
      const contactWhatsapp = item.contact_whatsapp?.trim() || null
      const appUrl = item.external_url?.trim() || null

      const hasDirectChannel = Boolean(
        (contactEmail && contactEmail.includes('@')) ||
        (contactWhatsapp && contactWhatsapp.replace(/\D/g, '').length >= 8) ||
        (appUrl && appUrl.startsWith('http'))
      )

      if (!hasDirectChannel) {
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
        title: sanitizeJobSeoText(item.title),
        slug,
        company_name: sanitizeJobSeoText(item.company_name),
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
        contact_email: contactEmail,
        contact_whatsapp: item.contact_whatsapp?.trim() || null,
        application_url: appUrl,
        source_url: appUrl,
        salary_raw: null,
        is_salary_public: false,
        source_name: item.source || 'BNE Magallanes',
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
        // Disparo de indexación inmediata no bloqueante
        notifySearchEnginesOfJob(slug).catch((e) => console.warn(`[Sync Indexing Warning ${slug}]`, e?.message))
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
