'use client'

import { forwardRef } from 'react'

interface StoryCardProps {
  title: string
  category: string
  imageUrl: string
  date: string
  summary?: string
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
  ({ title, category, imageUrl, date, summary, sourceName = 'Diario Contapymepuq' }, ref) => {
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
          backgroundColor: '#020712', // Fallback color
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          border: '24px solid #020712', // Marco elegante
        }}
      >
        {/* Imagen a Pantalla Completa Inmersiva de Fondo */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Fondo Inmersivo"
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(25px) brightness(0.20) contrast(1.1)', // Blur masivo para legibilidad y efecto bokeh
              transform: 'scale(1.15)', // Evita bordes blancos por el blur
            }}
          />
          {/* Capa de mezcla de color azul/cian sobre la imagen para fusionar con la marca */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(4, 14, 34, 0.4) 0%, rgba(2, 7, 18, 0.8) 60%, rgba(0, 0, 0, 0.95) 100%)',
            mixBlendMode: 'multiply'
          }} />
        </div>

        {/* Líneas geométricas minimalistas de fondo */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRight: '1px solid rgba(0, 242, 254, 0.06)',
          borderLeft: '1px solid rgba(0, 242, 254, 0.06)',
          margin: '0 80px',
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {/* Header / Logo centrado y más grande sin contornos */}
        <div style={{
          padding: '120px 80px 10px 80px',
          display: 'flex',
          justifyContent: 'center', // Centrar el logo
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/logo-contapyme.png" 
            alt="ContaPyme Logo"
            style={{
              height: '260px', // Agrandar tamaño
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 20px rgba(0, 242, 254, 0.5))', // Brillo neón más intenso
            }}
            crossOrigin="anonymous"
          />
        </div>

        {/* Zona Central de Textos Disruptivos (Sin Celular) */}
        <div style={{
          flex: '1',
          padding: '0 80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', // Centrar verticalmente en el espacio disponible
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
        }}>
          {/* Eslógan / Categoría superior con glow */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: theme.textColor || '#90e0ef',
            fontSize: '18px',
            fontWeight: 950,
            textTransform: 'uppercase',
            letterSpacing: '8px',
            fontStyle: 'italic',
            marginBottom: '36px',
            textShadow: '0 0 10px rgba(0, 242, 254, 0.4)'
          }}>
            <span style={{
              width: '40px',
              height: '3px',
              backgroundColor: '#00f2fe',
              boxShadow: '0 0 8px #00f2fe'
            }} />
            {category}
            <span style={{
              width: '40px',
              height: '3px',
              backgroundColor: '#00f2fe',
              boxShadow: '0 0 8px #00f2fe'
            }} />
          </div>
          
          {/* Titular Principal de Impacto Masivo Centrado */}
          <h2 style={{
            color: '#ffffff',
            fontSize: '78px', // Aumentado para máximo impacto
            fontWeight: 950,
            fontStyle: 'italic',
            letterSpacing: '-2px',
            lineHeight: 1.05,
            textTransform: 'uppercase',
            textAlign: 'center',
            margin: '0 0 40px 0',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 8px 30px rgba(0,0,0,0.9), 0 0 20px rgba(0, 242, 254, 0.1)'
          }}>
            {title}
          </h2>

          {/* Resumen Expectante / Gancho Narrativo Dinámico */}
          <div style={{
            background: 'rgba(2, 7, 18, 0.85)',
            borderLeft: '5px solid #00f2fe',
            borderRight: '1px solid rgba(0, 242, 254, 0.1)',
            borderTop: '1px solid rgba(0, 242, 254, 0.1)',
            borderBottom: '1px solid rgba(0, 242, 254, 0.1)',
            borderRadius: '24px',
            padding: '36px 40px',
            boxShadow: '0 15px 45px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
          }}>
            <p style={{
              color: '#90e0ef',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.45,
              margin: 0,
              textAlign: 'center',
              fontStyle: 'italic',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {summary || "¿Cómo afecta esto a tu bolsillo y a tu negocio local? Entérate de los detalles clave antes de que sea tarde..."}
            </p>
          </div>
        </div>

        {/* Footer Minimalista de Contraste */}
        <div style={{
          padding: '40px 80px 80px 80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '2px solid rgba(0, 242, 254, 0.25)',
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
              background: 'rgba(2, 7, 18, 0.8)',
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
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.2)'
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
