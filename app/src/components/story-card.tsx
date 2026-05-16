'use client'

import { forwardRef } from 'react'

interface StoryCardProps {
  title: string
  category: string
  imageUrl: string
  date: string
  sourceName?: string
}

/**
 * StoryCard — Componente visual invisible (off-screen) que se renderiza
 * en formato 9:16 (1080x1920) para generar imágenes compartibles en
 * Instagram Stories, Posts, WhatsApp, etc.
 * 
 * Este componente NO se muestra al usuario. Solo se usa como fuente
 * para html2canvas.
 */
export const StoryCard = forwardRef<HTMLDivElement, StoryCardProps>(
  ({ title, category, imageUrl, date, sourceName = 'Diario Punta Arenas' }, ref) => {

    const formattedDate = new Date(date).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1080px',
          height: '1920px',
          overflow: 'hidden',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header / Branding */}
        <div style={{
          padding: '60px 60px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 900,
              fontSize: '20px',
              fontStyle: 'italic',
            }}>
              CP
            </div>
            <div>
              <div style={{
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 900,
                fontStyle: 'italic',
                letterSpacing: '-0.5px',
                textTransform: 'uppercase',
              }}>
                ContaPyme
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                fontStyle: 'italic',
              }}>
                Diario Regional
              </div>
            </div>
          </div>
          <div style={{
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '20px',
            padding: '8px 20px',
            color: '#60a5fa',
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontStyle: 'italic',
          }}>
            {category}
          </div>
        </div>

        {/* Image */}
        <div style={{
          margin: '0 60px',
          borderRadius: '32px',
          overflow: 'hidden',
          flex: '1',
          maxHeight: '900px',
          position: 'relative',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to top, #0a0a0a, transparent)',
          }} />
        </div>

        {/* Title */}
        <div style={{
          padding: '50px 60px 30px',
          flex: '0 0 auto',
        }}>
          <h2 style={{
            color: '#ffffff',
            fontSize: '54px',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-2px',
            lineHeight: 1.1,
            textTransform: 'uppercase',
            margin: 0,
            // Limitar a ~4 líneas
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {title}
          </h2>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 60px 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: 'auto',
        }}>
          <div>
            <div style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '3px',
              fontStyle: 'italic',
            }}>
              {sourceName}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.2)',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginTop: '4px',
            }}>
              {formattedDate}
            </div>
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.15)',
            fontSize: '16px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '4px',
            fontStyle: 'italic',
          }}>
            contapymepuq.cl
          </div>
        </div>
      </div>
    )
  }
)

StoryCard.displayName = 'StoryCard'
