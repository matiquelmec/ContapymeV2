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
  const cookieStore = await cookies()
  const activeOrgId = cookieStore.get('active_organization_id')?.value
  
  if (activeOrgId) return activeOrgId

  // Fallback: get the first one if no cookie is set
  const orgs = await getUserOrganizations()
  if (orgs.length > 0) {
    const defaultId = orgs[0].id
    // We can't set cookies here in a "getter" that might be called during render
    // but we can return it.
    return defaultId
  }

  return null
}
