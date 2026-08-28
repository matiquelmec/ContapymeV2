import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 3600 // Revalidar cada hora

export async function GET() {
  const supabase = createAdminClient()

  // Google News exige artículos publicados preferentemente en las últimas 48 horas
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  let { data: news } = await supabase
    .from('regional_news')
    .select('title, slug, published_at, category, image_url')
    .gte('published_at', twoDaysAgo)
    .order('published_at', { ascending: false })
    .limit(100)

  // Fallback: si no hay noticias en las últimas 48h, tomar las últimas 30 registradas
  if (!news || news.length === 0) {
    const { data: latestNews } = await supabase
      .from('regional_news')
      .select('title, slug, published_at, category, image_url')
      .order('published_at', { ascending: false })
      .limit(30)
    news = latestNews || []
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.contapymepuq.cl'

  const xmlItems = news.map(item => {
    const newsUrl = `${baseUrl}/noticias/${item.slug}`
    const pubDate = item.published_at ? new Date(item.published_at).toISOString() : new Date().toISOString()
    const cleanTitle = (item.title || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

    const imageTag = item.image_url ? `
    <image:image>
      <image:loc>${item.image_url.replace(/&/g, '&amp;')}</image:loc>
      <image:title>${cleanTitle}</image:title>
    </image:image>` : ''

    return `
  <url>
    <loc>${newsUrl}</loc>
    <news:news>
      <news:publication>
        <news:name>ContaPymePUQ Diario Regional de Magallanes</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${cleanTitle}</news:title>
    </news:news>${imageTag}
  </url>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlItems}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
