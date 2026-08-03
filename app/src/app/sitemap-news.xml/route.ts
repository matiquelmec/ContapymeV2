import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 3600 // Revalidar cada hora

export async function GET() {
  const supabase = createAdminClient()

  // Google News exige artículos publicados preferentemente en las últimas 48 horas
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  let { data: news } = await supabase
    .from('regional_news')
    .select('title, slug, published_at, category')
    .gte('published_at', twoDaysAgo)
    .order('published_at', { ascending: false })
    .limit(100)

  // Fallback: si no hay noticias en las últimas 48h, tomar las últimas 20 registradas
  if (!news || news.length === 0) {
    const { data: latestNews } = await supabase
      .from('regional_news')
      .select('title, slug, published_at, category')
      .order('published_at', { ascending: false })
      .limit(20)
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

    return `
  <url>
    <loc>${newsUrl}</loc>
    <news:news>
      <news:publication>
        <news:name>Contapymepuq Diario Regional</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${cleanTitle}</news:title>
    </news:news>
  </url>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlItems}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
