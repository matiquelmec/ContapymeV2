'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { engineFetch } from '@/lib/engine-client'

let lastNewsSync = 0
const NEWS_SYNC_COOLDOWN = 5 * 60 * 1000 // 5 minutos de cooldown en memoria
const NEWS_OUTDATED_INTERVAL = 4 * 60 * 60 * 1000 // 4 horas de validez de noticias en DB


const FALLBACK_IMAGES_REGIONAL = [
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80", // Plaza Muñoz Gamero
  "https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=800&q=80", // Torres del Paine
  "https://images.unsplash.com/photo-1473163928189-364b2c4e1135?auto=format&fit=crop&w=800&q=80", // Patagonia Estrecho
  "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80"  // Faro San Isidro / Puerto
]

const FALLBACK_IMAGES_FINANZAS = [
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80", // Finanzas oficina
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80", // Contabilidad
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80"  // Gráficos financieros
]

const NEWS_SOURCES = [
  { name: "La Prensa Austral", url: "https://laprensaaustral.cl/feed/", category: "REGIONAL" },
  { name: "El Pingüino", url: "https://elpinguino.com/rss", category: "REGIONAL" },
  { name: "Ovejero Noticias", url: "https://www.ovejeronoticias.cl/feed/", category: "REGIONAL" },
  { name: "Google News Magallanes", url: "https://news.google.com/rss/search?q=Punta+Arenas+Magallanes&hl=es-419&gl=CL&ceid=CL:es-419", category: "REGIONAL" },
  { name: "Diario Financiero", url: "https://www.df.cl/site/asociacion/rss/rss_index.xml", category: "FINANZAS" },
  { name: "Google News Economía", url: "https://news.google.com/rss/search?q=SII+IPC+Dolar+Chile+Impuestos+Economia&hl=es-419&gl=CL&ceid=CL:es-419", category: "FINANZAS" }
]

function cleanHTML(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8211;/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function normalizeTitle(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function getFallbackImage(title: string, category: string): string {
  // Generar un hash numérico a partir del título para elegir una imagen consistente
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash)
  
  if (category === "FINANZAS") {
    return FALLBACK_IMAGES_FINANZAS[index % FALLBACK_IMAGES_FINANZAS.length]
  }
  return FALLBACK_IMAGES_REGIONAL[index % FALLBACK_IMAGES_REGIONAL.length]
}

function parseRSS(xmlText: string): any[] {
  const items: any[] = []
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1]
    
    const extractTag = (tag: string): string => {
      const tagRegex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\/${tag}>`, 'i')
      const tagMatch = itemContent.match(tagRegex)
      if (tagMatch) {
        return (tagMatch[1] || tagMatch[2] || '').trim()
      }
      return ''
    }

    const title = extractTag('title')
    const link = extractTag('link')
    const description = extractTag('description')
    const pubDate = extractTag('pubDate')
    
    // Buscar imagen en enclosure
    let imageUrl = ''
    const enclosureRegex = /<enclosure[^>]+url=["']([^"']+)["']/i
    const enclosureMatch = itemContent.match(enclosureRegex)
    if (enclosureMatch) {
      imageUrl = enclosureMatch[1]
    } else {
      // Buscar imagen en media:content o media:thumbnail
      const mediaRegex = /<(?:media:content|media:thumbnail)[^>]+url=["']([^"']+)["']/i
      const mediaMatch = itemContent.match(mediaRegex)
      if (mediaMatch) {
        imageUrl = mediaMatch[1]
      } else {
        // Buscar img src en la description
        const imgScrMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i)
        if (imgScrMatch) {
          imageUrl = imgScrMatch[1]
        }
      }
    }

    if (title && link) {
      items.push({
        title: cleanHTML(title),
        link: link.trim(),
        description: cleanHTML(description),
        imageUrl: imageUrl.trim(),
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
      })
    }
  }
  return items
}

/**
 * Obtiene las noticias regionales de Supabase.
 * Gatilla una sincronización asíncrona en segundo plano si los datos están obsoletos.
 */
export async function getRegionalNews() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('regional_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(60)
    
    if (error) {
      console.error('[DATABASE ERROR] Fallo al obtener noticias:', error.message)
      return { success: false, error: 'No se pudieron obtener noticias.', data: [] }
    }

    const news = data || []

    // Verificar si las noticias están desactualizadas
    let shouldSync = false
    if (news.length === 0) {
      shouldSync = true
    } else {
      // Tomamos la fecha de creación de la noticia más reciente
      const newestNewsTime = news[0].created_at ? new Date(news[0].created_at).getTime() : 0
      const now = Date.now()
      
      if (now - newestNewsTime > NEWS_OUTDATED_INTERVAL && now - lastNewsSync > NEWS_SYNC_COOLDOWN) {
        shouldSync = true
      }
    }

    if (shouldSync) {
      lastNewsSync = Date.now()
      console.log('[News Action] Noticias obsoletas. Gatillando sincronización en segundo plano en el motor de IA...')
      engineFetch('/api/v1/news/sync', { method: 'POST' })
        .then(async (res) => {
          if (res.ok) {
            console.log('[News Action] Sincronización en el motor de IA iniciada con éxito.')
            revalidatePath('/')
          } else {
            const errText = await res.text()
            console.error('[News Action] Error de API al gatillar sincronización en el motor:', errText)
          }
        })
        .catch((err) => {
          console.error('[News Action] Error de red al contactar al motor de noticias:', err.message)
        })
    }

    return { success: true, data: news, isFallback: false }
  } catch (err: any) {
    console.error("[News Action Error]:", err.message);
    return { success: true, data: [], isFallback: false }
  }
}

export async function getNewsBySlug(slug: string) {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('regional_news')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error || !data) {
      return { success: false, error: 'Noticia no encontrada en los registros oficiales' }
    }

    return { success: true, data, isFallback: false }
  } catch (err: any) {
    return { success: false, error: 'Error de conexión con la central de noticias' }
  }
}

/**
 * Server Action que sincroniza las noticias desde los feeds RSS y las guarda en Supabase.
 */
export async function syncNewsAction() {
  const supabase = createAdminClient()
  let addedCount = 0
  const errores: string[] = []

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/xml, text/xml, */*'
  }

  try {
    // 1. Obtener registros existentes para evitar colisiones en columnas unique en memoria
    const { data: existingData } = await supabase
      .from('regional_news')
      .select('title, slug, source_url')
    
    const existingTitles = new Set(existingData?.map(n => normalizeTitle(n.title)) || [])
    const existingSlugs = new Set(existingData?.map(n => n.slug) || [])
    const existingUrls = new Set(existingData?.map(n => n.source_url) || [])

    // 2. Iterar feeds de noticias y descargar
    for (const feed of NEWS_SOURCES) {
      try {
        const res = await fetch(feed.url, { headers, cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`HTTP status ${res.status}`)
        }
        
        const xmlText = await res.text()
        const parsedItems = parseRSS(xmlText)

        for (const item of parsedItems) {
          const titleNorm = normalizeTitle(item.title)
          const itemSlug = slugify(item.title)
          
          // Saltar si ya existe
          if (existingTitles.has(titleNorm) || existingSlugs.has(itemSlug) || existingUrls.has(item.link)) {
            continue
          }

          // Preparar la imagen (si no viene, se usa fallback temático)
          const finalImage = item.imageUrl || getFallbackImage(item.title, feed.category)
          
          // Crear resumen a partir de la descripción (limitar a 300 caracteres)
          const rawDesc = item.description || ''
          const summary = rawDesc.length > 300 ? rawDesc.substring(0, 297) + '...' : rawDesc

          // Insertar la noticia
          const { error: insertError } = await supabase
            .from('regional_news')
            .insert({
              title: item.title,
              slug: itemSlug,
              category: feed.category,
              content: rawDesc || item.title,
              summary: summary,
              image_url: finalImage,
              source_url: item.link,
              source_name: feed.name,
              normalized_title: titleNorm,
              published_at: item.pubDate,
              is_featured: addedCount < 2 // Marcar las primeras noticias añadidas como destacadas
            })

          if (!insertError) {
            addedCount++
            existingTitles.add(titleNorm)
            existingSlugs.add(itemSlug)
            existingUrls.add(item.link)
          } else {
            console.error(`[Sync News] Fallo al insertar noticia "${item.title}":`, insertError.message)
          }
        }
      } catch (err: any) {
        console.error(`[Sync News] Error consumiendo feed ${feed.name}:`, err.message)
        errores.push(`${feed.name}: ${err.message}`)
      }
    }
  } catch (err: any) {
    console.error('[Sync News] Error crítico en pipeline de noticias:', err.message)
    errores.push(`crítico: ${err.message}`)
  }

  // Si se agregaron noticias, revalidar las rutas del frontend
  if (addedCount > 0) {
    revalidatePath('/')
  }

  return { success: errores.length === 0, addedCount, errores }
}

/**
 * Verifica si el usuario actual está autenticado y tiene privilegios de administrador.
 */
export async function checkAdminPermission() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { authorized: false, error: 'Usuario no autenticado' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, plan')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { authorized: false, error: 'Perfil de usuario no encontrado en el sistema' }
    }

    // Permitir si es rol admin o si el plan es consorcio (con soporte case-insensitive)
    const userRole = (profile.role || '').toLowerCase()
    const userPlan = (profile.plan || '').toLowerCase()
    const isAuthorized = userRole === 'admin' || userPlan === 'consorcio'
    
    if (!isAuthorized) {
      return { authorized: false, error: 'Acceso denegado: requiere plan Consorcio o rol Administrador' }
    }

    return { authorized: true, user, profile }
  } catch (err: any) {
    return { authorized: false, error: `Error de autorización: ${err.message}` }
  }
}

/**
 * Crea una nueva noticia en el portal.
 */
export async function createNewsAction(newsData: {
  title: string
  category: string
  content: string
  summary?: string
  image_url?: string
  source_name?: string
  source_url?: string
  is_featured?: boolean
}) {
  const authCheck = await checkAdminPermission()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  try {
    const supabaseAdmin = createAdminClient()
    
    const titleClean = cleanHTML(newsData.title)
    const titleNorm = normalizeTitle(titleClean)
    const itemSlug = slugify(titleClean)
    
    // Verificar duplicado local antes de insertar
    const { data: existing } = await supabaseAdmin
      .from('regional_news')
      .select('id')
      .or(`title.eq."${titleClean}",slug.eq."${itemSlug}"`)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'Ya existe una noticia con este título o dirección web (slug).' }
    }

    const finalImage = newsData.image_url || getFallbackImage(titleClean, newsData.category)
    const rawDesc = newsData.content || ''
    const summary = newsData.summary || (rawDesc.length > 300 ? rawDesc.substring(0, 297) + '...' : rawDesc)

    const { data, error } = await supabaseAdmin
      .from('regional_news')
      .insert({
        title: titleClean,
        slug: itemSlug,
        category: newsData.category,
        content: rawDesc,
        summary: summary,
        image_url: finalImage,
        source_name: newsData.source_name || 'ContaPymePuq',
        source_url: newsData.source_url || `/noticias/${itemSlug}`,
        normalized_title: titleNorm,
        is_featured: !!newsData.is_featured,
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true, data }
  } catch (err: any) {
    console.error('[createNewsAction Error]:', err.message)
    return { success: false, error: err.message || 'Error al insertar la noticia.' }
  }
}

/**
 * Modifica una noticia existente.
 */
export async function updateNewsAction(
  id: string,
  newsData: {
    title: string
    category: string
    content: string
    summary?: string
    image_url?: string
    source_name?: string
    source_url?: string
    is_featured?: boolean
  }
) {
  const authCheck = await checkAdminPermission()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  try {
    const supabaseAdmin = createAdminClient()
    
    const titleClean = cleanHTML(newsData.title)
    const titleNorm = normalizeTitle(titleClean)
    const itemSlug = slugify(titleClean)
    
    const rawDesc = newsData.content || ''
    const summary = newsData.summary || (rawDesc.length > 300 ? rawDesc.substring(0, 297) + '...' : rawDesc)
    const finalImage = newsData.image_url || getFallbackImage(titleClean, newsData.category)

    const { data, error } = await supabaseAdmin
      .from('regional_news')
      .update({
        title: titleClean,
        slug: itemSlug,
        category: newsData.category,
        content: rawDesc,
        summary: summary,
        image_url: finalImage,
        source_name: newsData.source_name || 'ContaPymePuq',
        source_url: newsData.source_url || `/noticias/${itemSlug}`,
        normalized_title: titleNorm,
        is_featured: !!newsData.is_featured,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true, data }
  } catch (err: any) {
    console.error('[updateNewsAction Error]:', err.message)
    return { success: false, error: err.message || 'Error al actualizar la noticia.' }
  }
}

/**
 * Elimina de manera inmutable una noticia del portal.
 */
export async function deleteNewsAction(id: string) {
  const authCheck = await checkAdminPermission()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  try {
    const supabaseAdmin = createAdminClient()
    
    const { error } = await supabaseAdmin
      .from('regional_news')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    console.error('[deleteNewsAction Error]:', err.message)
    return { success: false, error: err.message || 'Error al eliminar la noticia.' }
  }
}

/**
 * Server Action para subir una imagen de portada al bucket 'news_images'.
 */
export async function uploadNewsImageAction(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No se ha detectado ningún archivo para subir.' }
    }

    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const supabaseAdmin = createAdminClient()
    
    const { data, error } = await supabaseAdmin.storage
      .from('news_images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      throw error
    }

    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('news_images')
      .getPublicUrl(fileName)

    return { success: true, url: publicUrl }
  } catch (err: any) {
    console.error('[uploadNewsImageAction Error]:', err.message)
    return { success: false, error: err.message || 'Error al subir la imagen.' }
  }
}

/**
 * 🏢 Permite a una empresa u organización autenticada publicar un comunicado de prensa o noticia.
 */
export async function createCompanyNewsAction(newsData: {
  title: string
  category: string
  content: string
  summary?: string
  image_url?: string
  source_name?: string
  source_url?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para publicar un comunicado.' }
    }

    const supabaseAdmin = createAdminClient()
    const titleClean = cleanHTML(newsData.title)
    const titleNorm = normalizeTitle(titleClean)
    const itemSlug = slugify(titleClean) + '-' + Math.random().toString(36).substring(2, 6)

    const finalImage = newsData.image_url || getFallbackImage(titleClean, newsData.category)
    const rawDesc = newsData.content || ''
    const summary = newsData.summary || (rawDesc.length > 300 ? rawDesc.substring(0, 297) + '...' : rawDesc)

    const { data, error } = await supabaseAdmin
      .from('regional_news')
      .insert({
        title: titleClean,
        slug: itemSlug,
        category: newsData.category,
        content: rawDesc,
        summary: summary,
        image_url: finalImage,
        source_name: newsData.source_name || 'Comunicado de Empresa',
        source_url: newsData.source_url || `/noticias/${itemSlug}`,
        normalized_title: titleNorm,
        is_featured: false,
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/')
    revalidatePath('/noticias')
    revalidatePath('/dashboard/noticias')
    return { success: true, data }
  } catch (err: any) {
    console.error('[createCompanyNewsAction Error]:', err.message)
    return { success: false, error: err.message || 'Error al enviar el comunicado.' }
  }
}

/**
 * 📰 Obtiene los comunicados y noticias de la empresa u organización conectada.
 */
export async function getCompanyNewsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'No autorizado.', data: [] }
    }

    const supabaseAdmin = createAdminClient()
    const { data: orgMembers } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, organizations(nombre)')
      .eq('user_id', user.id)

    const allowedSources = new Set<string>()
    orgMembers?.forEach((m: any) => {
      if (m.organizations?.nombre) allowedSources.add(m.organizations.nombre.trim())
    })

    if (allowedSources.size === 0) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabaseAdmin
      .from('regional_news')
      .select('*')
      .in('source_name', Array.from(allowedSources))
      .order('published_at', { ascending: false })
      .limit(30)

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (err: any) {
    return { success: false, error: err.message, data: [] }
  }
}


