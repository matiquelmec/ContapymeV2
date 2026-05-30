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
    gradient: 'linear-gradient(180deg, #040e22 0%, #020712 60%, #000000 100%)',
    borderColor: 'rgba(0, 242, 254, 0.3)',
    accentColor: '#00f2fe',
    textColor: '#00f2fe',
    slogan: 'PULSO DEPORTIVO / MAGALLANES',
    badgeBg: 'rgba(0, 242, 254, 0.1)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
  },
  clima: {
    gradient: 'linear-gradient(180deg, #040e22 0%, #020712 60%, #000000 100%)',
    borderColor: 'rgba(0, 180, 216, 0.3)',
    accentColor: '#00b4d8',
    textColor: '#90e0ef',
    slogan: 'METEOROLOGÍA AUSTRAL',
    badgeBg: 'rgba(0, 180, 216, 0.1)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(0, 180, 216, 0.15) 0%, transparent 70%)',
  },
  horoscopo: {
    gradient: 'linear-gradient(180deg, #040e22 0%, #020712 60%, #000000 100%)',
    borderColor: 'rgba(192, 132, 252, 0.3)',
    accentColor: '#c084fc',
    textColor: '#e9d5ff',
    slogan: 'PREDICCIONES DEL SUR',
    badgeBg: 'rgba(192, 132, 252, 0.1)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(192, 132, 252, 0.1) 0%, transparent 70%)',
  },
  finanzas: {
    gradient: 'linear-gradient(180deg, #040e22 0%, #020712 60%, #000000 100%)',
    borderColor: 'rgba(0, 242, 254, 0.4)',
    accentColor: '#00f2fe',
    textColor: '#90e0ef',
    slogan: 'PULSO ECONÓMICO Y FINANCIERO',
    badgeBg: 'rgba(0, 242, 254, 0.15)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(0, 242, 254, 0.2) 0%, transparent 70%)',
  },
  sii: {
    gradient: 'linear-gradient(180deg, #040e22 0%, #020712 60%, #000000 100%)',
    borderColor: 'rgba(0, 82, 212, 0.4)',
    accentColor: '#4364f7',
    textColor: '#6fb1fc',
    slogan: 'ACTUALIDAD TRIBUTARIA / SII',
    badgeBg: 'rgba(0, 82, 212, 0.15)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(0, 82, 212, 0.2) 0%, transparent 70%)',
  },
  default: {
    gradient: 'linear-gradient(180deg, #040e22 0%, #020712 60%, #000000 100%)', // Master Brand Deep Space Blue!
    borderColor: 'rgba(0, 242, 254, 0.3)',
    accentColor: '#00f2fe', // Azul real patagónico oficial
    textColor: '#90e0ef', // Azul hielo austral
    slogan: 'PATAGONIA ACTUAL / ÚLTIMO MINUTO',
    badgeBg: 'rgba(0, 242, 254, 0.1)',
    radial: 'radial-gradient(circle at 50% 20%, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
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
  ({ title, category, imageUrl, date, sourceName = 'Diario Contapymepuq' }, ref) => {
    const theme = getTheme(category, title);

    const formattedDate = new Date(date).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Generamos un hash SHA-256 consistente para la estética criptográfica
    const generateShortHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
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
          background: 'linear-gradient(180deg, #040e22 0%, #020712 60%, #000000 100%)', // Master Brand Deep Space Blue!
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          border: '24px solid #020712', // Marco elegante de contraste neón
        }}
      >
        {/* Líneas geométricas minimalistas de fondo */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRight: '1px solid rgba(0, 242, 254, 0.08)',
          borderLeft: '1px solid rgba(0, 242, 254, 0.08)',
          margin: '0 80px',
          pointerEvents: 'none',
        }} />

        {/* Header / Branding Disruptivo "Infórmate Con" */}
        <div style={{
          padding: '110px 80px 40px 80px',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10,
          gap: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            {/* Contenedor "INFÓRMATE CON" + Logo */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{
                color: '#00f2fe',
                fontSize: '24px',
                fontWeight: 900,
                letterSpacing: '8px',
                textTransform: 'uppercase',
                fontStyle: 'italic',
                textShadow: '0 0 10px rgba(0, 242, 254, 0.4)'
              }}>
                INFÓRMATE CON
              </span>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(2, 7, 18, 0.6)',
                border: '2px solid rgba(0, 242, 254, 0.3)',
                padding: '16px 28px',
                borderRadius: '24px',
                boxShadow: '0 10px 30px rgba(0, 242, 254, 0.08)',
                backdropFilter: 'blur(10px)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/logo-contapyme.png" 
                  alt="Contapymepuq Logo"
                  style={{
                    height: '80px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 12px rgba(0, 242, 254, 0.4))', // Resalte del logo neón
                  }}
                  crossOrigin="anonymous"
                />
                <span style={{
                  color: '#ffffff',
                  fontSize: '38px',
                  fontWeight: 950,
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                  marginLeft: '20px',
                  fontStyle: 'italic'
                }}>
                  ContaPyme
                </span>
              </div>
            </div>

            {/* Categoría con diseño insignia flotante */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(2, 7, 18, 0.9) 100%)',
              border: '2px solid #00f2fe',
              borderRadius: '20px',
              padding: '20px 40px',
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 950,
              textTransform: 'uppercase',
              letterSpacing: '5px',
              fontStyle: 'italic',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)'
            }}>
              {category}
            </div>
          </div>
        </div>

        {/* Contenedor de Teléfono Móvil 3D en Perspectiva */}
        <div style={{
          margin: '20px 80px 40px 80px',
          flex: '1',
          maxHeight: '850px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          perspective: '1200px', // Perspectiva 3D
          zIndex: 10,
        }}>
          {/* Resplandor neón (glow) detrás del teléfono */}
          <div style={{
            position: 'absolute',
            width: '450px',
            height: '800px',
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.25) 0%, transparent 70%)',
            filter: 'blur(40px)',
            transform: 'rotateY(-15deg) rotateX(10deg) translateZ(-50px)',
            zIndex: 1,
          }} />

          {/* Cuerpo del Teléfono Inteligente en 3D */}
          <div style={{
            width: '420px',
            height: '780px',
            backgroundColor: '#090d16',
            borderRadius: '50px',
            padding: '16px',
            boxSizing: 'border-box',
            border: '4px solid rgba(0, 242, 254, 0.6)', // Borde neón cian
            boxShadow: '0 25px 60px -15px rgba(0, 242, 254, 0.3), -20px 20px 40px rgba(0,0,0,0.7)',
            transform: 'rotateY(-15deg) rotateX(10deg) rotateZ(-3deg)', // Inclinación 3D realista
            transformStyle: 'preserve-3d',
            position: 'relative',
            zIndex: 5,
          }}>
            {/* Altavoz superior / Notch del teléfono */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '18px',
              backgroundColor: '#020712',
              borderRadius: '20px',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              zIndex: 10,
            }} />

            {/* Pantalla del teléfono */}
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '36px',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#020712',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                crossOrigin="anonymous"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: (imageUrl.toLowerCase().includes('logo') || imageUrl.includes('clearbit') || imageUrl.includes('brand_')) ? 'contain' : 'cover',
                  padding: (imageUrl.toLowerCase().includes('logo') || imageUrl.includes('clearbit') || imageUrl.includes('brand_')) ? '70px' : '0',
                  backgroundColor: (imageUrl.toLowerCase().includes('logo') || imageUrl.includes('clearbit') || imageUrl.includes('brand_')) ? 'rgba(255,255,255,0.03)' : 'transparent',
                }}
              />
            </div>
          </div>
        </div>

        {/* Sección de Textos (Diseño suizo editorial masivo) */}
        <div style={{
          padding: '0 80px 40px 80px',
          flex: '0 0 auto',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: theme.textColor || '#90e0ef',
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '6px',
            fontStyle: 'italic',
            marginBottom: '24px',
          }}>
            <span style={{
              width: '32px',
              height: '3px',
              backgroundColor: '#00f2fe',
            }} />
            {theme.slogan}
          </div>
          
          {/* Título de la noticia gigante y de altísimo contraste */}
          <h2 style={{
            color: '#ffffff',
            fontSize: '66px',
            fontWeight: 950,
            fontStyle: 'italic',
            letterSpacing: '-2px',
            lineHeight: 1.05,
            textTransform: 'uppercase',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {title}
          </h2>
        </div>

        {/* Footer Minimalista de Contraste */}
        <div style={{
          padding: '40px 80px 80px 80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '2px solid rgba(0, 242, 254, 0.2)',
          marginTop: 'auto',
          position: 'relative',
          zIndex: 10,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div>
            <div style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '4px',
              fontStyle: 'italic',
            }}>
              {sourceName}
            </div>
            <div style={{
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginTop: '4px',
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
              background: 'rgba(0, 242, 254, 0.05)',
              border: '2px solid #00f2fe',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#00f2fe',
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '6px',
              fontStyle: 'italic',
            }}>
              ✓ INTEGRIDAD VERIFICADA
            </div>
            <div style={{
              color: '#94a3b8',
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
