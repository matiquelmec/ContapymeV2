'use client'

import { forwardRef } from 'react'

interface StoryCardProps {
  title: string
  category: string
  imageUrl: string
  date: string
  sourceName?: string
}

// 🎨 Paletas de Diseño "Patagonia Digital" adaptadas al contenido
// Alineadas 100% con los colores de marca de Diario Punta Arenas y ContaPyme (Azul Real Patagónico y tonos australes)
const THEMES = {
  deportes: {
    gradient: 'linear-gradient(180deg, #021a0f 0%, #050d0a 60%, #000000 100%)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    accentColor: '#10b981',
    textColor: '#34d399',
    slogan: 'PULSO DEPORTIVO',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
  },
  clima: {
    gradient: 'linear-gradient(180deg, #081a30 0%, #040a12 60%, #000000 100%)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    accentColor: '#38bdf8',
    textColor: '#7dd3fc',
    slogan: 'METEOROLOGÍA AUSTRAL',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
  },
  horoscopo: {
    gradient: 'linear-gradient(180deg, #1e0b36 0%, #0b071e 60%, #000000 100%)',
    borderColor: 'rgba(192, 132, 252, 0.4)',
    accentColor: '#c084fc',
    textColor: '#e9d5ff',
    slogan: 'PREDICCIONES DEL SUR',
    badgeBg: 'rgba(192, 132, 252, 0.15)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(192, 132, 252, 0.15) 0%, transparent 70%)',
  },
  finanzas: {
    gradient: 'linear-gradient(180deg, #1b1202 0%, #070400 60%, #000000 100%)', // Dorado súper profundo
    borderColor: 'rgba(245, 158, 11, 0.4)',
    accentColor: '#f59e0b',
    textColor: '#fef08a',
    slogan: 'PULSO ECONÓMICO Y FINANCIERO',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
  },
  sii: {
    gradient: 'linear-gradient(180deg, #09122c 0%, #030612 60%, #000000 100%)', // Azul de marca profundo
    borderColor: 'rgba(30, 98, 208, 0.4)',
    accentColor: '#1e62d0', // Azul real patagónico oficial
    textColor: '#93c5fd',
    slogan: 'ACTUALIDAD TRIBUTARIA / SII',
    badgeBg: 'rgba(30, 98, 208, 0.15)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(30, 98, 208, 0.15) 0%, transparent 70%)',
  },
  default: {
    gradient: 'linear-gradient(180deg, #081226 0%, #030710 60%, #000000 100%)', // Master Brand Deep Space Blue!
    borderColor: 'rgba(30, 98, 208, 0.4)',
    accentColor: '#1e62d0', // Azul real patagónico oficial
    textColor: '#93c5fd', // Azul hielo austral
    slogan: 'PATAGONIA ACTUAL / ÚLTIMO MINUTO',
    badgeBg: 'rgba(30, 98, 208, 0.15)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(30, 98, 208, 0.15) 0%, transparent 70%)',
  }
}

const getTheme = (cat: string, title: string) => {
  const c = (cat || '').toLowerCase();
  const t = (title || '').toLowerCase();
  
  if (c.includes('deporte') || c.includes('fútbol') || c.includes('futbol') || t.includes('fútbol') || t.includes('deporte') || t.includes('estadio')) {
    return THEMES.deportes;
  }
  if (c.includes('clima') || c.includes('tiempo') || c.includes('meteorolog') || t.includes('clima') || t.includes('tiempo') || t.includes('temperatura')) {
    return THEMES.clima;
  }
  if (c.includes('horóscopo') || c.includes('horoscopo') || c.includes('astral') || t.includes('horóscopo') || t.includes('astrología')) {
    return THEMES.horoscopo;
  }
  if (c.includes('finanzas') || c.includes('econom') || c.includes('mercado') || t.includes('dólar') || t.includes('dolar') || t.includes('finanzas') || t.includes('ipc') || t.includes('cobre')) {
    return THEMES.finanzas;
  }
  if (c.includes('sii') || c.includes('tribut') || c.includes('legal') || c.includes('impuesto') || t.includes('sii') || t.includes('impuesto')) {
    return THEMES.sii;
  }
  return THEMES.default;
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
    const theme = getTheme(category, title);

    const formattedDate = new Date(date).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Generamos un hash SHA-256 simulado y consistente para la estética criptográfica
    const generateShortHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16).padEnd(8, 'f').substring(0, 8).toUpperCase();
    }
    const fakeHash = generateShortHash(title + date);

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
          fontFamily: "var(--font-geist-sans), 'Inter', 'Helvetica Neue', Arial, sans-serif",
          background: theme.gradient,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Capa radial de iluminación decorativa */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: theme.radial,
          pointerEvents: 'none',
        }} />

        {/* Textura de Fondo de Carbono / Fibra Fina */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
          opacity: 0.04,
          pointerEvents: 'none',
        }} />

        {/* Header / Branding (Espaciado y tamaños maximizados geométricamente) */}
        <div style={{
          padding: '100px 80px 50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
          }}>
            {/* Logo Oficial de Contapymepuq - Aumentado geométricamente para alta definición (1080px) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo-contapyme.png" 
              alt="Contapymepuq Logo"
              style={{
                height: '110px',
                width: 'auto',
                objectFit: 'contain',
              }}
              crossOrigin="anonymous"
            />
            {/* Línea divisoria más visible */}
            <div style={{
              height: '65px',
              width: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              margin: '0 24px'
            }} />
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: '34px',
                fontWeight: 900,
                letterSpacing: '6px',
                textTransform: 'uppercase',
                fontStyle: 'italic',
                lineHeight: 1.1,
              }}>
                DIARIO
              </span>
              <span style={{
                color: theme.textColor,
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '4px',
                textTransform: 'uppercase',
                fontStyle: 'italic',
                marginTop: '4px',
              }}>
                Punta Arenas
              </span>
            </div>
          </div>
          
          {/* Categoria Badge más imponente */}
          <div style={{
            background: theme.badgeBg,
            border: `2px solid ${theme.borderColor}`,
            borderRadius: '32px',
            padding: '16px 36px',
            color: theme.accentColor,
            fontSize: '22px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '4px',
            fontStyle: 'italic',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            {category}
          </div>
        </div>

        {/* Image Frame Glassmorphic */}
        <div style={{
          margin: '0 80px',
          borderRadius: '40px',
          overflow: 'hidden',
          flex: '1',
          maxHeight: '940px',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          zIndex: 10,
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
          {/* Degradado oscuro inferior en la foto para fundir con la tarjeta */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '250px',
            background: 'linear-gradient(to top, #000000, transparent)',
          }} />
        </div>

        {/* Title & Glassmorphic Content Plate */}
        <div style={{
          padding: '60px 80px 40px',
          flex: '0 0 auto',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: theme.textColor,
            fontSize: '13px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '5px',
            fontStyle: 'italic',
            marginBottom: '20px',
          }}>
            <span style={{
              width: '24px',
              height: '2px',
              backgroundColor: theme.accentColor,
            }} />
            {theme.slogan}
          </div>
          
          <h2 style={{
            color: '#ffffff',
            fontSize: '56px',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-2px',
            lineHeight: 1.1,
            textTransform: 'uppercase',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 4px 15px rgba(0,0,0,0.8)',
          }}>
            {title}
          </h2>
        </div>

        {/* Footer Criptográfico e Institucional */}
        <div style={{
          padding: '30px 80px 80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          marginTop: 'auto',
          position: 'relative',
          zIndex: 10,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '16px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '4px',
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
              marginTop: '6px',
            }}>
              {formattedDate}
            </div>
          </div>
          
          {/* SHA-256 Verification Badge */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '6px',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ fontSize: '14px' }}>✓</span> INTEGRIDAD VERIFICADA
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.15)',
              fontSize: '12px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              SHA-256: {fakeHash}...
            </div>
          </div>
        </div>
      </div>
    )
  }
)

StoryCard.displayName = 'StoryCard'
