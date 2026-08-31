'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface JobPosting {
  id: string
  title: string
  slug: string
  company_name: string
  company_rut?: string
  company_logo_url?: string
  location: string
  sector: string
  job_type: string
  work_shift: string
  salary_raw?: string
  salary_min?: number
  salary_max?: number
  salary_period?: string
  is_salary_public: boolean
  description: string
  requirements: string[]
  benefits: string[]
  contact_email?: string
  contact_whatsapp?: string
  application_url?: string
  source_name: string
  source_url?: string
  is_verified: boolean
  status: 'active' | 'expired' | 'filled'
  published_at: string
  expires_at: string
  created_at: string
}

export interface NetSalaryCalculation {
  grossSalary: number
  afpDeduction: number
  healthDeduction: number
  afcDeduction: number
  taxDeduction: number
  netSalary: number
  totalDeductions: number
}

// Patrones discriminatorios prohibidos por el Art. 2° del Código del Trabajo
const DISCRIMINATORY_PATTERNS = [
  { pattern: /\b(edad\s*(?:entre|de|maxima|minima|debe\s*tener)?\s*\d{2}\s*(?:a|-|y)?\s*\d{2}\s*a[ñn]os?)\b/i, reason: 'Límites o rangos de edad explícitos' },
  { pattern: /\b(menor\s*de\s*\d{2}\s*a[ñn]os?)\b/i, reason: 'Exclusión por minoría de edad relativa' },
  { pattern: /\b(mayor\s*de\s*\d{2}\s*a[ñn]os?)\b/i, reason: 'Exclusión por mayoría de edad' },
  { pattern: /\b(buena\s*presencia)\b/i, reason: 'Discriminación por apariencia física' },
  { pattern: /\b(foto\s*(?:obligatoria|actualizada|en\s*el\s*cv)?)\b/i, reason: 'Exigencia obligatoria de fotografía en el CV' },
  { pattern: /\b(solter[oa]|casad[oa]|sin\s*hijos?)\b/i, reason: 'Discriminación por estado civil o situación familiar' },
  { pattern: /\b(solo\s*(?:hombres|mujeres|chilenos?|extranjeros?))\b/i, reason: 'Exclusión arbitraria por género o nacionalidad' },
  { pattern: /\b(sin\s*dicom|certificado\s*(?:de\s*)?dicom|bolet[ií]n\s*comercial\s*limpio)\b/i, reason: 'Exigencia ilegal de antecedentes comerciales (DICOM)' },
  { pattern: /\b(pago\s*previo|costo\s*(?:de\s*)?(?:matr[ií]cula|capacitaci[oó]n|uniforme))\b/i, reason: 'Cobro ilegal previo para postular o capacitar' },
]

/**
 * 🛡️ Valida que el texto del aviso cumpla con el Artículo 2° del Código del Trabajo.
 */
export async function validateJobCompliance(text: string): Promise<{ isCompliant: boolean; violations: string[] }> {
  const violations: string[] = []
  for (const { pattern, reason } of DISCRIMINATORY_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(reason)
    }
  }
  return {
    isCompliant: violations.length === 0,
    violations,
  }
}

/**
 * 🧮 Motor de Cálculo Previsional Chileno (Estimación de Sueldo Líquido Regional)
 */
export async function calculateNetSalaryEstimate(
  grossSalary: number,
  afpRate: number = 0.1145
): Promise<NetSalaryCalculation> {
  if (!grossSalary || grossSalary <= 0) {
    return {
      grossSalary: 0,
      afpDeduction: 0,
      healthDeduction: 0,
      afcDeduction: 0,
      taxDeduction: 0,
      netSalary: 0,
      totalDeductions: 0,
    }
  }

  const afpDeduction = Math.round(grossSalary * afpRate)
  const healthDeduction = Math.round(grossSalary * 0.07)
  const afcDeduction = Math.round(grossSalary * 0.006)
  const taxableBase = Math.max(0, grossSalary - afpDeduction - healthDeduction - afcDeduction)

  let taxDeduction = 0
  if (taxableBase > 950000 && taxableBase <= 2100000) {
    taxDeduction = Math.round((taxableBase - 950000) * 0.04)
  } else if (taxableBase > 2100000 && taxableBase <= 3500000) {
    taxDeduction = Math.round(46000 + (taxableBase - 2100000) * 0.08)
  } else if (taxableBase > 3500000) {
    taxDeduction = Math.round(158000 + (taxableBase - 3500000) * 0.135)
  }

  const totalDeductions = afpDeduction + healthDeduction + afcDeduction + taxDeduction
  const netSalary = Math.max(0, grossSalary - totalDeductions)

  return {
    grossSalary,
    afpDeduction,
    healthDeduction,
    afcDeduction,
    taxDeduction,
    netSalary,
    totalDeductions,
  }
}

/**
 * 📋 Obtiene la lista de ofertas laborales activas de Magallanes con filtros.
 */
export async function getRegionalJobs(filters?: {
  location?: string
  sector?: string
  jobType?: string
  search?: string
  limit?: number
}) {
  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'active')
      .order('published_at', { ascending: false })

    if (filters?.location && filters.location !== 'TODAS') {
      query = query.ilike('location', `%${filters.location}%`)
    }
    if (filters?.sector && filters.sector !== 'TODOS') {
      query = query.ilike('sector', `%${filters.sector}%`)
    }
    if (filters?.jobType && filters.jobType !== 'TODOS') {
      query = query.ilike('job_type', `%${filters.jobType}%`)
    }
    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim()
      query = query.or(`title.ilike.%${s}%,company_name.ilike.%${s}%,description.ilike.%${s}%`)
    }

    const limit = filters?.limit || 50
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener ofertas de empleo:', error)
      return { success: false, data: [] }
    }

    return { success: true, data: (data as JobPosting[]) || [] }
  } catch (err: any) {
    console.error('Error inesperado en getRegionalJobs:', err)
    return { success: false, data: [] }
  }
}

/**
 * 🔎 Obtiene una oferta laboral por su slug único.
 */
export async function getJobBySlug(slug: string) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return { success: false, data: null }
    }

    return { success: true, data: data as JobPosting }
  } catch (err) {
    console.error('Error al consultar empleo por slug:', err)
    return { success: false, data: null }
  }
}

/**
 * 📊 Obtiene estadísticas de ofertas de empleo activas en la región.
 */
export async function getJobsStats() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('job_postings')
      .select('location, sector, job_type')
      .eq('status', 'active')

    if (error || !data) {
      return { total: 0, byLocation: {}, bySector: {} }
    }

    const byLocation: Record<string, number> = {}
    const bySector: Record<string, number> = {}

    data.forEach((j: any) => {
      const loc = j.location || 'Punta Arenas'
      const sec = j.sector || 'Otros'
      byLocation[loc] = (byLocation[loc] || 0) + 1
      bySector[sec] = (bySector[sec] || 0) + 1
    })

    return {
      total: data.length,
      byLocation,
      bySector,
    }
  } catch (err) {
    return { total: 0, byLocation: {}, bySector: {} }
  }
}

/**
 * 🏢 Obtiene exclusivamente las vacantes pertenecientes a la empresa u organización conectada.
 */
export async function getCompanyJobsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'No autorizado. Inicia sesión.', data: [] }
    }

    const adminDb = createAdminClient()

    // Obtener las organizaciones a las que pertenece el usuario
    const { data: orgMembers } = await adminDb
      .from('organization_members')
      .select('organization_id, organizations(nombre, rut)')
      .eq('user_id', user.id)

    const allowedNames = new Set<string>()
    const allowedRuts = new Set<string>()

    orgMembers?.forEach((m: any) => {
      if (m.organizations?.nombre) allowedNames.add(m.organizations.nombre.trim())
      if (m.organizations?.rut) allowedRuts.add(m.organizations.rut.trim())
    })

    const userEmail = user.email ? user.email.trim() : ''

    let query = adminDb
      .from('job_postings')
      .select('*')
      .order('created_at', { ascending: false })

    const filters: string[] = []

    if (allowedNames.size > 0) {
      const namesList = Array.from(allowedNames).map((n) => `company_name.eq."${n}"`)
      filters.push(...namesList)
    }

    if (allowedRuts.size > 0) {
      const rutsList = Array.from(allowedRuts).map((r) => `company_rut.eq."${r}"`)
      filters.push(...rutsList)
    }

    if (userEmail) {
      filters.push(`contact_email.ilike.${userEmail}`)
    }

    if (filters.length === 0) {
      return { success: true, data: [] }
    }

    query = query.or(filters.join(','))

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: (data as JobPosting[]) || [] }
  } catch (err: any) {
    return { success: false, error: err.message, data: [] }
  }
}

/**
 * 📝 Crea una nueva vacante de empleo con validación legal Art. 2° DT.
 */
export async function createJobAction(formData: {
  title: string
  company_name: string
  company_rut?: string
  company_logo_url?: string
  location: string
  sector: string
  job_type: string
  work_shift: string
  salary_raw?: string
  salary_min?: number
  salary_max?: number
  description: string
  requirements: string[]
  benefits: string[]
  contact_email?: string
  contact_whatsapp?: string
  application_url?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para publicar una oferta.' }
    }

    // 1. Auditoría de Cumplimiento Legal (Art. 2° Código del Trabajo)
    const fullText = `${formData.title} ${formData.description} ${formData.requirements.join(' ')}`
    const compliance = await validateJobCompliance(fullText)
    if (!compliance.isCompliant) {
      return {
        success: false,
        error: `El aviso infringe el Art. 2° del Código del Trabajo: ${compliance.violations.join(', ')}. Por favor modifica los requisitos para continuar.`,
      }
    }

    // 2. Generar Slug Único
    const baseSlug = `${formData.title}-${formData.company_name}-${formData.location}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    const randomSuffix = Math.random().toString(36).substring(2, 7)
    const slug = `${baseSlug}-${randomSuffix}`

    // 3. Fechas de vigencia (21 días)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)

    const adminDb = createAdminClient()
    const { data, error } = await adminDb
      .from('job_postings')
      .insert({
        title: formData.title.trim(),
        slug,
        company_name: formData.company_name.trim(),
        company_rut: formData.company_rut?.trim() || null,
        company_logo_url: formData.company_logo_url?.trim() || null,
        location: formData.location.trim(),
        sector: formData.sector.trim(),
        job_type: formData.job_type || 'Presencial',
        work_shift: formData.work_shift || 'Jornada Completa',
        salary_raw: formData.salary_raw?.trim() || null,
        salary_min: formData.salary_min || null,
        salary_max: formData.salary_max || null,
        is_salary_public: !!formData.salary_raw,
        description: formData.description.trim(),
        requirements: formData.requirements || [],
        benefits: formData.benefits || [],
        contact_email: formData.contact_email?.trim() || null,
        contact_whatsapp: formData.contact_whatsapp?.trim() || null,
        application_url: formData.application_url?.trim() || null,
        source_name: 'ContaEmpleos Portal',
        is_verified: true,
        status: 'active',
        published_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error insertando empleo:', error)
      return { success: false, error: 'Error al registrar la oferta: ' + error.message }
    }

    revalidatePath('/empleos')
    revalidatePath('/dashboard/empleos')
    revalidatePath('/sitemap-jobs.xml')

    return { success: true, data: data as JobPosting }
  } catch (err: any) {
    return { success: false, error: 'Error inesperado: ' + err.message }
  }
}

/**
 * 🔄 Actualiza una vacante existente asegurando autorización multi-tenant.
 */
export async function updateJobAction(id: string, formData: Partial<JobPosting>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'No autorizado.' }
    }

    const adminDb = createAdminClient()

    // 1. Obtener la vacante y verificar propiedad
    const { data: job, error: jobErr } = await adminDb
      .from('job_postings')
      .select('id, company_name, company_rut')
      .eq('id', id)
      .single()

    if (jobErr || !job) {
      return { success: false, error: 'La vacante solicitada no existe.' }
    }

    // 2. Verificar rol y permisos del usuario
    const { data: profile } = await adminDb
      .from('profiles')
      .select('id, full_name, role, plan')
      .eq('id', user.id)
      .single()

    const isAdmin = (profile?.role || '').toLowerCase() === 'admin' || (profile?.plan || '').toLowerCase() === 'consorcio'

    if (!isAdmin) {
      const { data: orgMembers } = await adminDb
        .from('organization_members')
        .select('organization_id, organizations(nombre, rut)')
        .eq('user_id', user.id)

      const allowedNames = new Set<string>()
      if (profile?.full_name) allowedNames.add(profile.full_name.trim().toLowerCase())
      orgMembers?.forEach((m: any) => {
        if (m.organizations?.nombre) allowedNames.add(m.organizations.nombre.trim().toLowerCase())
      })

      const isOwner = allowedNames.has(job.company_name?.trim().toLowerCase())
      if (!isOwner) {
        return { success: false, error: 'Seguridad Multi-Tenant: No tienes autorización para modificar vacantes de otra empresa.' }
      }
    }

    const { data, error } = await adminDb
      .from('job_postings')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/empleos')
    revalidatePath('/dashboard/empleos')

    return { success: true, data: data as JobPosting }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * 🗑️ Elimina o finaliza una vacante asegurando autorización multi-tenant.
 */
export async function deleteJobAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'No autorizado.' }
    }

    const adminDb = createAdminClient()

    // 1. Obtener la vacante
    const { data: job, error: jobErr } = await adminDb
      .from('job_postings')
      .select('id, company_name, company_rut')
      .eq('id', id)
      .single()

    if (jobErr || !job) {
      return { success: false, error: 'La vacante solicitada no existe.' }
    }

    // 2. Verificar rol y permisos
    const { data: profile } = await adminDb
      .from('profiles')
      .select('id, full_name, role, plan')
      .eq('id', user.id)
      .single()

    const isAdmin = (profile?.role || '').toLowerCase() === 'admin' || (profile?.plan || '').toLowerCase() === 'consorcio'

    if (!isAdmin) {
      const { data: orgMembers } = await adminDb
        .from('organization_members')
        .select('organization_id, organizations(nombre, rut)')
        .eq('user_id', user.id)

      const allowedNames = new Set<string>()
      if (profile?.full_name) allowedNames.add(profile.full_name.trim().toLowerCase())
      orgMembers?.forEach((m: any) => {
        if (m.organizations?.nombre) allowedNames.add(m.organizations.nombre.trim().toLowerCase())
      })

      const isOwner = allowedNames.has(job.company_name?.trim().toLowerCase())
      if (!isOwner) {
        return { success: false, error: 'Seguridad Multi-Tenant: No tienes autorización para eliminar vacantes de otra empresa.' }
      }
    }

    const { error } = await adminDb
      .from('job_postings')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/empleos')
    revalidatePath('/dashboard/empleos')

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * 🤖 Asistente de Reclutamiento IA: Genera y optimiza perfiles de cargo y ofertas laborales en 1 clic.
 */
export async function generateJobPostingAIAction(params: {
  rawNotes: string
  companyName?: string
  location?: string
  sector?: string
}): Promise<{
  success: boolean
  title?: string
  description?: string
  requirements?: string
  benefits?: string
  workShift?: string
  sector?: string
  location?: string
  salaryMin?: number
  salaryMax?: number
  error?: string
}> {
  try {
    const apiKey = process.env.GROQ_API_KEY || ''
    if (!apiKey) {
      return { success: false, error: 'Motor de inteligencia artificial no configurado (GROQ_API_KEY no disponible).' }
    }

    if (!params.rawNotes || params.rawNotes.trim().length < 5) {
      return { success: false, error: 'Por favor ingresa una breve descripción o notas sobre la vacante que deseas publicar.' }
    }

    const systemPrompt = `
Eres el Asistente Senior de Reclutamiento y Selección de ContaEmpleos Magallanes (Punta Arenas, Puerto Natales, Tierra del Fuego).
Tu misión es transformar notas informales o ideas de un empleador en una OFERTA DE EMPLEO PROFESIONAL, atractiva y 100% en regla con el Código del Trabajo de Chile y la Ley de 40 Horas.

REGLAS DE CUMPLIMIENTO LEGAL ESTRICTO (Código del Trabajo de Chile):
1. PROHIBICIÓN DE DISCRIMINACIÓN (Art. 2°): NUNCA incluyas requisitos de edad ("entre 25 y 35 años"), apariencia física ("buena presencia"), fotografía en el CV, estado civil ("soltero/a") ni certificados comerciales (DICOM/Boletín comercial).
2. LEY 40 HORAS: Toda jornada completa debe alinearse con la normativa legal vigente de reducción de jornada.
3. CONTEXTO REGIONAL: Adapta el vocabulario y contexto a Magallanes (Punta Arenas, Puerto Natales, Porvenir, Faena, Estancia, etc.).

SECTORES PERMITIDOS:
- "Comercio & Retail"
- "Gastronomía & Hotelería"
- "Salmonicultura & Pesca"
- "Logística & Transporte"
- "Construcción & Minería"
- "Administración & Finanzas"
- "Salud & Servicios"
- "Tecnología & Otros"

TURNOS PERMITIDOS:
- "Lunes a Viernes (40 Horas)"
- "Turno 7x7 Faena"
- "Turno 14x14"
- "Turno 4x4"
- "Turno Rotativo 6x1"
- "Part-Time Fin de Semana"

FORMATO DE SALIDA (JSON ÚNICAMENTE):
Devuelve un objeto JSON con las siguientes propiedades:
{
  "title": "Titular del cargo profesional y claro",
  "description": "Descripción atractiva del puesto, ambiente de trabajo y responsabilidades principales (2-3 párrafos)",
  "requirements": "Lista de requisitos técnicos y habilidades en líneas separadas con guiones (-)",
  "benefits": "Lista de beneficios laborales (colación, seguro, uniforme, estabilidad) en líneas con guiones (-)",
  "workShift": "Uno de los turnos permitidos",
  "sector": "Uno de los sectores permitidos",
  "location": "Punta Arenas | Puerto Natales | Porvenir | Torres del Paine | Faena / Yacimiento | Todo Magallanes",
  "salaryMin": número opcional si se deduce del texto o 0,
  "salaryMax": número opcional si se deduce del texto o 0
}
`

    const userPrompt = `
Empresa: ${params.companyName || 'Empresa Empleadora'}
Ubicación tentativa: ${params.location || 'Punta Arenas'}
Sector tentativo: ${params.sector || 'Comercio & Retail'}
Borrador de la vacante:
"""
${params.rawNotes}
"""
Redacta la oferta de empleo completa y estructurada en JSON.
`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 1200
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Groq Job Copilot Error]:', errText)
      return { success: false, error: 'El copiloto de selección no pudo procesar la solicitud en este momento.' }
    }

    const json = await response.json()
    const rawContent = json.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(rawContent)

    // Validar y purgar patrones discriminatorios en el texto generado por seguridad
    let cleanDesc = parsed.description || ''
    let cleanReqs = parsed.requirements || ''
    for (const dp of DISCRIMINATORY_PATTERNS) {
      cleanDesc = cleanDesc.replace(dp.pattern, '')
      cleanReqs = cleanReqs.replace(dp.pattern, '')
    }

    return {
      success: true,
      title: parsed.title,
      description: cleanDesc.trim(),
      requirements: cleanReqs.trim(),
      benefits: parsed.benefits,
      workShift: parsed.workShift || 'Lunes a Viernes (40 Horas)',
      sector: parsed.sector || params.sector || 'Comercio & Retail',
      location: parsed.location || params.location || 'Punta Arenas',
      salaryMin: parsed.salaryMin || undefined,
      salaryMax: parsed.salaryMax || undefined
    }
  } catch (err: any) {
    console.error('[generateJobPostingAIAction Error]:', err.message)
    return { success: false, error: err.message || 'Error inesperado al generar la oferta laboral.' }
  }
}

