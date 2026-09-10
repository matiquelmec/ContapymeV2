import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 3600 // Revalidación horaria

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoryFilter = searchParams.get('cat')

  const supabase = createAdminClient()
  let query = supabase
    .from('regional_news')
    .select('title, slug, summary, content, category, image_url, published_at, updated_at, author_name')
    .order('published_at', { ascending: false })
    .limit(40)

  if (categoryFilter) {
    query = query.ilike('category', `%${categoryFilter}%`)
  }

  const { data: newsList } = await query
  const news = newsList || []

  const baseUrl = 'https://www.contapymepuq.cl'
  const buildDate = new Date().toUTCString()

  const feedTitle = categoryFilter
    ? `ContaPymePUQ Diario Regional — ${categoryFilter}`
    : 'ContaPymePUQ Diario Regional de Magallanes'

  const feedItems = news.map((item) => {
    const itemUrl = `${baseUrl}/noticias/${item.slug}`
    const pubDate = item.published_at ? new Date(item.published_at).toUTCString() : buildDate
    const author = item.author_name || 'Redacción ContaPymePUQ'
    const category = item.category || 'Regional'
    const imageUrl = item.image_url || `${baseUrl}/og-cover.png`
    const summary = item.summary || (item.content ? item.content.slice(0, 250) + '...' : '')
    const fullContent = item.content || summary

    return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${itemUrl}</link>
      <guid isPermaLink="true">${itemUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${author}]]></dc:creator>
      <category><![CDATA[${category}]]></category>
      <description><![CDATA[${summary}]]></description>
      <content:encoded><![CDATA[<p>${fullContent.replace(/\n\s*\n/g, '</p><p>')}</p>]]></content:encoded>
      <enclosure url="${imageUrl}" length="50000" type="image/jpeg" />
      <media:content url="${imageUrl}" medium="image" type="image/jpeg">
        <media:title><![CDATA[${item.title}]]></media:title>
      </media:content>
    </item>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <link>${baseUrl}</link>
    <description>Noticias regionales de Punta Arenas, actualidad económica, finanzas y empresas de Magallanes.</description>
    <language>es-CL</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${feedItems}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
