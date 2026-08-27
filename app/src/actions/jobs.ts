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

/**
 * 🧮 Motor de Cálculo Previsional Chileno (Estimación de Sueldo Líquido Regional)
 * Aplica parámetros previsionales estándar (AFP 11.45% promedio, Salud 7%, AFC 0.6%, Impuesto Único).
 */
export async function calculateNetSalaryEstimate(
  grossSalary: number,
  afpRate: number = 0.1145,
  isExtremeZone: boolean = true
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

  // Cotizaciones obligatorias
  const afpDeduction = Math.round(grossSalary * afpRate)
  const healthDeduction = Math.round(grossSalary * 0.07)
  const afcDeduction = Math.round(grossSalary * 0.006)

  // Base tributable (Afecta a Impuesto Único de 2da Categoría)
  const taxableBase = Math.max(0, grossSalary - afpDeduction - healthDeduction - afcDeduction)

  // Tramos aproximados Impuesto Único 2026 (Pesos Chilenos)
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
