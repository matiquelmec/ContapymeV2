import { NextRequest, NextResponse } from 'next/server'
import { createMercadoPagoPreference } from '@/lib/mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateJobCompliance } from '@/actions/jobs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      itemType, // 'job_post', 'press_release', 'company_creation', 'subscription'
      itemTier, // 'free', 'basic', 'featured', 'faena'
      jobData,
      contactEmail,
      contactPhone,
    } = body

    if (!itemType) {
      return NextResponse.json({ success: false, error: 'itemType requerido' }, { status: 400 })
    }

    // 1. Manejo especial de Ofertas de Empleo (ContaEmpleos)
    if (itemType === 'job_post' && jobData) {
      // Validar Art. 2° Código del Trabajo
      const fullText = `${jobData.title} ${jobData.description} ${(jobData.requirements || []).join(' ')}`
      const compliance = await validateJobCompliance(fullText)
      if (!compliance.isCompliant) {
        return NextResponse.json({
          success: false,
          error: `El aviso infringe las normas de no discriminación (Art. 2° DT): ${compliance.violations.join(', ')}`
        }, { status: 400 })
      }

      // Definir tarifa
      let amount = 0
      let title = 'Aviso de Empleo Básico Comunitario ($0)'
      if (itemTier === 'basic') {
        amount = 2990
        title = 'Aviso de Empleo Destacado con Pin ($2.990)'
      } else if (itemTier === 'featured') {
        amount = 4990
        title = 'Aviso de Empleo Destacado + Redes Sociales ($4.990)'
      } else if (itemTier === 'faena') {
        amount = 9990
        title = 'Aviso de Empleo Faena / Gran Empresa ($9.990)'
      }

      const supabase = createAdminClient()
      const slug = `${(jobData.title || 'empleo')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')}-${Date.now().toString(36)}`

      const isFeatured = itemTier === 'basic' || itemTier === 'featured' || itemTier === 'faena'
      const isFree = amount === 0

      // Inserción del empleo en la base de datos
      const { data: createdJob, error: jobError } = await supabase
        .from('job_postings')
        .insert({
          title: jobData.title,
          slug,
          company_name: jobData.company_name,
          location: jobData.location || 'Punta Arenas',
          sector: jobData.sector || 'General',
          job_type: jobData.job_type || 'Jornada Completa',
          work_shift: jobData.work_shift || 'Lunes a Viernes (40 Horas)',
          salary_min: jobData.salary_min ? Number(jobData.salary_min) : null,
          salary_max: jobData.salary_max ? Number(jobData.salary_max) : null,
          is_salary_public: Boolean(jobData.salary_min),
          description: jobData.description,
          requirements: Array.isArray(jobData.requirements) ? jobData.requirements : [],
          benefits: Array.isArray(jobData.benefits) ? jobData.benefits : [],
          contact_whatsapp: jobData.contact_whatsapp,
          contact_email: contactEmail || jobData.contact_email,
          source_name: isFree ? 'ContaEmpleos (Gratis)' : `ContaEmpleos (${title})`,
          source_url: 'https://www.contapymepuq.cl/publicar-empleo',
          is_verified: isFree,
          status: isFree ? 'active' : 'pending_payment',
          published_at: isFree ? new Date().toISOString() : null,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (jobError) {
        console.error('Error creating job_posting:', jobError)
        return NextResponse.json({ success: false, error: 'Error al registrar aviso en base de datos' }, { status: 500 })
      }

      // Si es GRATIS ($0), finalizamos aquí instantáneamente
      if (isFree) {
        return NextResponse.json({
          success: true,
          is_free: true,
          job_slug: slug,
          job_id: createdJob.id,
          message: 'Aviso publicado exitosamente sin costo.'
        })
      }

      // Si es de pago ($2.990, $4.990, $9.990), creamos preferencia en Mercado Pago
      const preferenceRes = await createMercadoPagoPreference({
        items: [{
          id: `job_${createdJob.id}`,
          title: `${title} - ${jobData.title}`,
          quantity: 1,
          unit_price: amount,
          description: `Publicación destacada en ContaEmpleos PUQ (${jobData.company_name})`,
        }],
        payerEmail: contactEmail || 'contacto@contapymepuq.cl',
        payerName: jobData.company_name,
        externalReference: `job_${createdJob.id}`,
        metadata: {
          job_id: createdJob.id,
          job_slug: slug,
          item_tier: itemTier,
          amount_clp: amount
        }
      })

      if (!preferenceRes.success) {
        return NextResponse.json({ success: false, error: preferenceRes.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        is_free: false,
        init_point: preferenceRes.init_point,
        preference_id: preferenceRes.id,
        job_slug: slug,
        job_id: createdJob.id,
      })
    }

    // 2. Manejo de Notas de Prensa & Publirreportajes
    if (itemType === 'press_release' && body.newsData) {
      const { newsData } = body

      let amount = 19990
      let title = 'Nota de Prensa / Comunicado ($19.990)'
      if (itemTier === 'featured') {
        amount = 39990
        title = 'Publirreportaje de Portada ($39.990)'
      } else if (itemTier === 'campaign') {
        amount = 79990
        title = 'Cobertura Comercial + Banner ($79.990)'
      }

      const supabase = createAdminClient()
      const slug = `${(newsData.title || 'noticia')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')}-${Date.now().toString(36)}`

      const { data: createdNews, error: newsError } = await supabase
        .from('regional_news')
        .insert({
          title: newsData.title,
          slug,
          category: newsData.category || 'REGIONAL',
          content: newsData.content,
          summary: newsData.summary || newsData.title,
          image_url: newsData.image_url || 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80',
          source_name: newsData.company_name || 'Publirreportaje Comercial',
          source_url: 'https://www.contapymepuq.cl/noticias',
          is_featured: itemTier === 'featured' || itemTier === 'campaign',
          published_at: null,
        })
        .select()
        .single()

      if (newsError) {
        console.error('Error creating regional_news:', newsError)
        return NextResponse.json({ success: false, error: 'Error al registrar noticia en base de datos' }, { status: 500 })
      }

      const preferenceRes = await createMercadoPagoPreference({
        items: [{
          id: `news_${createdNews.id}`,
          title: `${title} - ${newsData.title}`,
          quantity: 1,
          unit_price: amount,
          description: `Publicación en Diario Regional Punta Arenas (${newsData.company_name})`,
        }],
        payerEmail: contactEmail || 'contacto@contapymepuq.cl',
        payerName: newsData.company_name,
        externalReference: `news_${createdNews.id}`,
        metadata: {
          news_id: createdNews.id,
          news_slug: slug,
          item_tier: itemTier,
          amount_clp: amount,
        },
      })

      if (!preferenceRes.success) {
        return NextResponse.json({ success: false, error: preferenceRes.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        init_point: preferenceRes.init_point,
        preference_id: preferenceRes.id,
        news_slug: slug,
        news_id: createdNews.id,
      })
    }

    // 3. Manejo de Banners Publicitarios (Media Kit Digital)
    if (itemType === 'ad_banner' && body.adData) {
      const { adData } = body
      let amount = 49990
      let title = 'Banner Calculadora de Sueldos ($49.990/mes)'

      if (itemTier === 'sidebar') {
        amount = 39990
        title = 'Banner Lateral en Noticias ($39.990/mes)'
      } else if (itemTier === 'header') {
        amount = 59990
        title = 'Mega Banner Superior Header ($59.990/mes)'
      }

      const bannerRefId = `banner_${Date.now().toString(36)}`

      const preferenceRes = await createMercadoPagoPreference({
        items: [{
          id: bannerRefId,
          title: `${title} - ${adData.sponsor_name}`,
          quantity: 1,
          unit_price: amount,
          description: `Espacio Publicitario 30 días en ContaPymePUQ (${adData.sponsor_name})`,
        }],
        payerEmail: contactEmail || 'contacto@contapymepuq.cl',
        payerName: adData.sponsor_name,
        externalReference: bannerRefId,
        metadata: {
          type: 'ad_banner',
          sponsor_name: adData.sponsor_name,
          position: adData.position || 'calculator',
          image_url: adData.image_url,
          target_url: adData.target_url,
          amount_clp: amount,
        },
      })

      if (!preferenceRes.success) {
        return NextResponse.json({ success: false, error: preferenceRes.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        init_point: preferenceRes.init_point,
        preference_id: preferenceRes.id,
      })
    }

    return NextResponse.json({ success: false, error: 'Tipo de producto no soportado' }, { status: 400 })
  } catch (err: any) {
    console.error('API create-preference error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Error interno' }, { status: 500 })
  }
}
