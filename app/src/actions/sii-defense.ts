'use server'

import { createClient } from '@/lib/supabase/server'
import { engineFetch } from '@/lib/engine-client'
import { parseError } from '@/lib/utils/errors'

export interface SIITemplate {
  id: string
  title: string
  law_reference: string
  description: string
}

export async function getSIITemplates(): Promise<{ success: boolean; templates?: SIITemplate[]; error?: string }> {
  try {
    const res = await engineFetch('/api/v1/sii/templates')
    if (!res.ok) throw new Error('Error al obtener plantillas del SII')
    const data = await res.json()
    return { success: true, templates: data.templates }
  } catch (err: any) {
    return { success: false, error: parseError(err) }
  }
}

export async function getSIIDefenseHistory(organizationId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sii_defense_documents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, documents: data || [] }
  } catch (err: any) {
    return { success: false, error: parseError(err), documents: [] }
  }
}
