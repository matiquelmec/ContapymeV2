import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 1800 // Revalidar cada 30 minutos

export async function GET() {
  const supabase = createAdminClient()
  const { data: jobs } = await supabase
    .from('job_postings')
    .select('slug, updated_at, published_at')
    .eq('status', 'active')
    .order('published_at', { ascending: false })

  const baseUrl = 'https://www.contapymepuq.cl'

  const xmlUrls = (jobs || []).map((job) => {
    const cleanSlug = encodeURIComponent(job.slug)
    const lastModDate = job.updated_at || job.published_at || new Date().toISOString()
    const isoDate = new Date(lastModDate).toISOString()
    return `
  <url>
    <loc>${baseUrl}/empleos/${cleanSlug}</loc>
    <lastmod>${isoDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/empleos</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.95</priority>
  </url>${xmlUrls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
    },
  })
}
