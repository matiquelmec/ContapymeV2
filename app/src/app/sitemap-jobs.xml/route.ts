import { createClient } from '@/lib/supabase/server'

export const revalidate = 1800 // Revalidar cada 30 minutos

export async function GET() {
  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('job_postings')
    .select('slug, updated_at, published_at')
    .eq('status', 'active')
    .order('published_at', { ascending: false })

  const baseUrl = 'https://www.contapymepuq.cl'

  const xmlUrls = (jobs || []).map((job) => `
  <url>
    <loc>${baseUrl}/empleos/${job.slug}</loc>
    <lastmod>${new Date(job.updated_at || job.published_at).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/empleos</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>${xmlUrls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
    },
  })
}
