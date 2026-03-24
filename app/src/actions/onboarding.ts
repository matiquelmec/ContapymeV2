'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ────────────────────────────────────────────────
// PASO 1: Actualizar perfil profesional
// ────────────────────────────────────────────────
export async function updateProfileOnboarding(data: {
  fullName: string
  phone: string
  role: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName,
      phone: data.phone,
      role: data.role,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ────────────────────────────────────────────────
// PASO 2: Crear organización
// ────────────────────────────────────────────────
export async function createOrganization(data: {
  rut: string
  nombre: string
  giro: string
  direccion: string
  comuna: string
  regimen: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  // Llamar al RPC (Procedimiento Almacenado) que crea la empresa y el miembro atómicamente
  // Bypasando las restricciones RLS porque es SECURITY DEFINER
  const { data: orgId, error: rpcError } = await supabase.rpc('create_new_company', {
    p_rut: data.rut,
    p_nombre: data.nombre,
    p_giro: data.giro,
    p_direccion: data.direccion,
    p_comuna: data.comuna,
    p_regimen: data.regimen
  })

  if (rpcError) {
    console.error('Error in create_new_company RPC:', rpcError)
    return { success: false, error: rpcError.message }
  }

  return { success: true, organizationId: orgId }
}

// ────────────────────────────────────────────────
// PASO 3: Seed del Plan de Cuentas estándar Chile
// ────────────────────────────────────────────────
export async function seedChartOfAccounts(organizationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const { error } = await supabase.rpc('create_default_chart_of_accounts', {
    p_org_id: organizationId
  })

  if (error) {
    console.error('Error seeding chart of accounts via RPC:', error)
    return { success: false, error: error.message }
  }

  return { success: true, count: 55 }
}

// ────────────────────────────────────────────────
// PASO 3.5: Seed de Configuración Previsional
// (AFPs + Isapres oficiales Chile 2025)
// ────────────────────────────────────────────────
export async function seedPayrollSettings(organizationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const { error } = await supabase.rpc('seed_payroll_settings', {
    p_org_id: organizationId
  })

  if (error) {
    console.error('Error seeding payroll settings via RPC:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ────────────────────────────────────────────────
// PASO 4: Marcar onboarding como completado
// ────────────────────────────────────────────────
export async function completeOnboarding(organizationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  // Marcar perfil como onboarding completo
  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error completing onboarding:', error)
    return { success: false, error: error.message }
  }

  // Set cookie para organización activa
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  cookieStore.set('active_organization_id', organizationId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: 'lax',
  })

  revalidatePath('/dashboard')
  return { success: true }
}
