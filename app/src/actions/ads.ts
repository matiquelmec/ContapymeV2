'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AdBanner {
  id: string
  position: 'calculator' | 'news_sidebar' | 'header_top'
  media_type?: 'image' | 'video'
  sponsor_name: string
  title: string
  image_url: string
  video_url?: string
  poster_url?: string
  target_url: string
  contact_whatsapp?: string
  status: 'active' | 'expired' | 'pending' | 'pending_review' | 'paused'
  amount_clp?: number
  starts_at?: string
  expires_at?: string
  created_at?: string
}

export async function getActiveAdBanners(position: 'calculator' | 'news_sidebar' | 'header_top'): Promise<AdBanner[]> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('ad_banners')
      .select('*')
      .eq('position', position)
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as AdBanner[]
  } catch (err) {
    return []
  }
}

export async function getActiveAdBanner(position: 'calculator' | 'news_sidebar' | 'header_top'): Promise<AdBanner | null> {
  try {
    const banners = await getActiveAdBanners(position)
    if (banners.length === 0) return null
    const selectedIndex = Math.floor(Math.random() * banners.length)
    return banners[selectedIndex]
  } catch (err) {
    return null
  }
}

export interface SlotAvailability {
  position: 'calculator' | 'news_sidebar' | 'header_top'
  count: number
  max: number
  available: number
  isFull: boolean
  nextAvailableDate?: string | null
}

export async function getAdSlotsAvailabilityAction(): Promise<Record<string, SlotAvailability>> {
  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    const { data } = await supabase
      .from('ad_banners')
      .select('position, expires_at')
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('expires_at', now)
      .order('expires_at', { ascending: true })

    const slots: ('calculator' | 'news_sidebar' | 'header_top')[] = ['calculator', 'news_sidebar', 'header_top']
    const result: Record<string, SlotAvailability> = {}
    const maxPerSlot = 5

    for (const s of slots) {
      const activeForSlot = (data || []).filter(item => item.position === s)
      const count = activeForSlot.length
      const isFull = count >= maxPerSlot
      const nextAvailableDate = isFull && activeForSlot.length > 0 ? activeForSlot[0].expires_at : null

      result[s] = {
        position: s,
        count,
        max: maxPerSlot,
        available: Math.max(0, maxPerSlot - count),
        isFull,
        nextAvailableDate,
      }
    }

    return result
  } catch (e) {
    return {
      calculator: { position: 'calculator', count: 0, max: 5, available: 5, isFull: false },
      news_sidebar: { position: 'news_sidebar', count: 0, max: 5, available: 5, isFull: false },
      header_top: { position: 'header_top', count: 0, max: 5, available: 5, isFull: false },
    }
  }
}

export async function getCompanyAdBannersAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, data: [] }

    const adminDb = createAdminClient()
    const { data, error } = await adminDb
      .from('ad_banners')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) return { success: true, data: [] }
    return { success: true, data: (data as AdBanner[]) || [] }
  } catch (err: any) {
    return { success: false, error: err.message, data: [] }
  }
}

export async function updateAdBannerStatusAction(id: string, status: 'active' | 'paused' | 'expired' | 'pending_review', durationDays: number = 30) {
  try {
    const adminDb = createAdminClient()
    const now = new Date()
    const updatePayload: Record<string, any> = { status }

    if (status === 'active') {
      updatePayload.starts_at = now.toISOString()
      updatePayload.expires_at = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    }

    const { error } = await adminDb
      .from('ad_banners')
      .update(updatePayload)
      .eq('id', id)

    if (error) throw error

    revalidatePath('/')
    revalidatePath('/anunciar')
    revalidatePath('/dashboard/publicidad')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function createManualAdBannerAction(payload: {
  position: 'calculator' | 'news_sidebar' | 'header_top'
  media_type?: 'image' | 'video'
  sponsor_name: string
  title: string
  image_url: string
  video_url?: string
  poster_url?: string
  target_url: string
  contact_whatsapp?: string
  duration_days: number
  amount_clp?: number
}) {
  try {
    const adminDb = createAdminClient()
    const now = new Date()
    const startsAt = now.toISOString()
    const expiresAt = new Date(now.getTime() + (payload.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await adminDb
      .from('ad_banners')
      .insert({
        position: payload.position,
        media_type: payload.media_type || (payload.video_url ? 'video' : 'image'),
        sponsor_name: payload.sponsor_name,
        title: payload.title,
        image_url: payload.image_url,
        video_url: payload.video_url || null,
        poster_url: payload.poster_url || null,
        target_url: payload.target_url,
        contact_whatsapp: payload.contact_whatsapp || null,
        status: 'active',
        amount_clp: payload.amount_clp || 0,
        starts_at: startsAt,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/')
    revalidatePath('/anunciar')
    revalidatePath('/dashboard/publicidad')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteAdBannerAction(id: string) {
  try {
    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from('ad_banners')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/')
    revalidatePath('/anunciar')
    revalidatePath('/dashboard/publicidad')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function uploadAdBannerImageAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No se detecto ningun archivo.' }
    }

    const fileExt = file.name.split('.').pop() || 'webp'
    const fileName = 'ad_' + Date.now() + '_' + Math.random().toString(36).substring(7) + '.' + fileExt
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const supabaseAdmin = createAdminClient()
    
    const { error } = await supabaseAdmin.storage
      .from('news_images')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/webp',
        upsert: true
      })

    if (error) {
      throw error
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('news_images')
      .getPublicUrl(fileName)

    return { success: true, url: publicUrl }
  } catch (err: any) {
    console.error('[uploadAdBannerImageAction Error]:', err.message)
    return { success: false, error: err.message || 'Error al subir la imagen.' }
  }
}
