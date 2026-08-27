import { ImageResponse } from 'next/og'
import { getJobBySlug } from '@/actions/jobs'

export const runtime = 'edge'

interface RouteProps {
  params: Promise<{ slug: string }>
}

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params
    const jobRes = await getJobBySlug(slug)
    const job = jobRes.data

    const title = job?.title || 'Oferta Laboral en Magallanes'
    const company = job?.company_name || 'Empresa Regional'
    const location = job?.location || 'Punta Arenas'
    const salary = job?.salary_raw || 'Remuneración acorde al mercado'
    const shift = job?.work_shift || 'Jornada Completa'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #1E293B 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1E293B 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            padding: '60px 70px',
            fontFamily: 'sans-serif',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          {/* Destellos de fondo */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 99, 235, 0.25)',
              filter: 'blur(90px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-100px',
              left: '-100px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              filter: 'blur(90px)',
            }}
          />

          {/* Header Superior: Branding y Ubicación */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderBottom: '2px solid rgba(51, 65, 85, 0.8)',
              paddingBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '-1px',
                  color: '#FFFFFF',
                }}
              >
                CONTAPYME<span style={{ color: '#38BDF8' }}>PUQ</span>
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                ContaEmpleos
              </div>
            </div>

            <div
              style={{
                fontSize: '15px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#E2E8F0',
                backgroundColor: '#1E293B',
                padding: '8px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
              }}
            >
              📍 {location}, Chile
            </div>
          </div>

          {/* Cuerpo Central: Empresa y Cargo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#94A3B8',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🏢 {company}
            </div>

            <div
              style={{
                fontSize: '46px',
                fontWeight: 900,
                fontStyle: 'italic',
                textTransform: 'uppercase',
                letterSpacing: '-1px',
                lineHeight: 1.15,
                color: '#F8FAFC',
              }}
            >
              {title}
            </div>

            {/* Badges de Sueldo y Modalidad */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  padding: '10px 22px',
                  borderRadius: '16px',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                💰 {salary}
              </div>

              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#C7D2FE',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  padding: '10px 20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                }}
              >
                ⏱️ {shift}
              </div>
            </div>
          </div>

          {/* Footer Inferior: Legal y CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: '2px solid rgba(51, 65, 85, 0.8)',
              paddingTop: '20px',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🛡️ Verificado bajo Art. 2° Código del Trabajo
            </div>

            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#94A3B8',
                letterSpacing: '1px',
              }}
            >
              contapymepuq.cl/empleos
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (err) {
    console.error('Error generating OG image:', err)
    return new Response('Failed to generate image', { status: 500 })
  }
}
