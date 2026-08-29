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
          is_verified: true,
          status: 'active',
          published_at: new Date().toISOString(),
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

    return NextResponse.json({ success: false, error: 'Tipo de producto no soportado' }, { status: 400 })
  } catch (err: any) {
    console.error('API create-preference error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Error interno' }, { status: 500 })
  }
}
