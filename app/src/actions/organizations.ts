'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getUserOrganizations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      organizations (
        id,
        nombre,
        rut_empresa
      )
    `)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return data.map((membership: any) => membership.organizations)
}

export async function setActiveOrganization(orgId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  const { data: membership, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !membership) {
    return { success: false, error: 'No perteneces a esta organizacion' }
  }

  const cookieStore = await cookies()
  cookieStore.set('active_organization_id', orgId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    sameSite: 'lax',
  })
  
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getActiveOrganizationId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get('active_organization_id')?.value

  // Validamos que la cookie apunte a una organización del usuario ACTUAL.
  // Sin esto, una cookie de una sesión anterior (otra cuenta en el mismo
  // navegador) se arrastra y el motor responde 403 "no pertenece".
  if (cookieOrgId) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', cookieOrgId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (membership) return cookieOrgId
  }

  // Fallback: primera organización del usuario (auto-selección).
  // No persistimos cookie aquí porque este getter se invoca durante el render.
  const orgs = await getUserOrganizations()
  return orgs.length > 0 ? orgs[0].id : null
}
