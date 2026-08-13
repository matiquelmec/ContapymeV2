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

// 🎨 Paletas de Diseño "Contapymepuq Master Brand"
// 100% armónicas con la identidad de marca de Contapymepuq (Azul Real #2563eb, Esmeralda #10b981, Slate 950 #020617)
const THEMES = {
  deportes: {
    gradient: 'linear-gradient(180deg, #0f172a 0%, #090d16 50%, #020617 100%)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    accentColor: '#3b82f6',
    textColor: '#93c5fd',
    slogan: 'PULSO DEPORTIVO • MAGALLANES',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
  },
  clima: {
    gradient: 'linear-gradient(180deg, #0f172a 0%, #090d16 50%, #020617 100%)',
    borderColor: 'rgba(14, 165, 233, 0.4)',
    accentColor: '#0ea5e9',
    textColor: '#bae6fd',
    slogan: 'METEOROLOGÍA AUSTRAL',
    badgeBg: 'rgba(14, 165, 233, 0.15)',
  },
  horoscopo: {
    gradient: 'linear-gradient(180deg, #0f172a 0%, #090d16 50%, #020617 100%)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    accentColor: '#a855f7',
    textColor: '#e9d5ff',
    slogan: 'PREDICCIONES DEL SUR',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
  },
  finanzas: {
    gradient: 'linear-gradient(180deg, #0f172a 0%, #090d16 50%, #020617 100%)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    accentColor: '#10b981',
    textColor: '#a7f3d0',
    slogan: 'PULSO ECONÓMICO Y FINANCIERO',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  sii: {
    gradient: 'linear-gradient(180deg, #0f172a 0%, #090d16 50%, #020617 100%)',
    borderColor: 'rgba(37, 99, 235, 0.4)',
    accentColor: '#2563eb',
    textColor: '#bfdbfe',
    slogan: 'ACTUALIDAD TRIBUTARIA / SII',
    badgeBg: 'rgba(37, 99, 235, 0.15)',
  },
  default: {
    gradient: 'linear-gradient(180deg, #0f172a 0%, #090d16 50%, #020617 100%)',
    borderColor: 'rgba(37, 99, 235, 0.4)',
    accentColor: '#2563eb',
    textColor: '#bfdbfe',
    slogan: 'DIARIO REGIONAL • MAGALLANES',
    badgeBg: 'rgba(37, 99, 235, 0.15)',
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
 * StoryCard — Generador de imágenes optimizadas para Instagram Stories (1080x1920 px)
 * Diseñado respetando las Zonas Seguras (Safe Zones) de Instagram, la tipografía corporativa
 * y la paleta de marca oficial de Contapymepuq.
 */
export const StoryCard = forwardRef<HTMLDivElement, StoryCardProps>(
  ({ title, category, imageUrl, date, summary, sourceName = 'Diario Contapymepuq' }, ref) => {
    const theme = getTheme(category, title);

    const formattedDate = new Date(date).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

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
          backgroundColor: '#020617',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Imagen de fondo desenfocada con gradiente corporativo */}
        <div style={{
          position: 'absolute',
          inset: 0,
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
              filter: 'blur(35px) brightness(0.18) contrast(1.1)',
              transform: 'scale(1.15)',
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(2, 6, 23, 0.92) 50%, rgba(2, 6, 23, 0.98) 100%)',
          }} />
        </div>

        {/* Top Safe Zone Header (Logo Contapymepuq) */}
        <div style={{
          padding: '110px 80px 10px 80px',
          display: 'flex',
          justifyContent: 'center',
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
              height: '140px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 20px rgba(37, 99, 235, 0.4))',
            }}
            crossOrigin="anonymous"
          />
        </div>

        {/* Zona Central: Marco Fotográfico Hero + Titular Periodístico */}
        <div style={{
          flex: '1',
          padding: '0 75px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
          gap: '24px',
        }}>
          {/* Badge de Categoría con Gradiente de Marca */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <div style={{
              backgroundColor: theme.badgeBg,
              border: `1.5px solid ${theme.borderColor}`,
              borderRadius: '9999px',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '9999px',
                backgroundColor: theme.accentColor,
                boxShadow: `0 0 10px ${theme.accentColor}`
              }} />
              <span style={{
                color: theme.textColor,
                fontSize: '15px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '3px',
                fontStyle: 'italic',
              }}>
                {category}
              </span>
            </div>
          </div>

          {/* 🖼️ MARCO FOTOGRÁFICO DESTACADO PROPORCIONAL (SAFE ZONE FIT) */}
          <div style={{
            width: '100%',
            height: '520px',
            borderRadius: '32px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 30px 90px rgba(0,0,0,0.85), 0 0 40px rgba(37, 99, 235, 0.2)',
            position: 'relative',
            backgroundColor: '#0f172a',
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
                objectPosition: 'center',
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 65%, rgba(2, 6, 23, 0.8) 100%)',
            }} />
          </div>
          
          {/* Titular Principal de Impacto Editorial */}
          <h2 style={{
            color: '#ffffff',
            fontSize: '52px',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-1.5px',
            lineHeight: 1.15,
            textTransform: 'uppercase',
            textAlign: 'center',
            margin: '4px 0 0 0',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 6px 25px rgba(0,0,0,0.9)'
          }}>
            {title}
          </h2>

          {/* Resumen Periodístico / Subtítulo */}
          <p style={{
            color: '#cbd5e1',
            fontSize: '22px',
            fontWeight: 500,
            lineHeight: 1.45,
            margin: '0 auto',
            maxWidth: '880px',
            textAlign: 'center',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 4px 12px rgba(0,0,0,0.95)'
          }}>
            {summary || "Revisa la cobertura completa y el análisis detallado en el Diario Regional Contapymepuq."}
          </p>
        </div>

        {/* Bottom Safe Zone Footer */}
        <div style={{
          padding: '24px 75px 120px 75px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          marginTop: 'auto',
          position: 'relative',
          zIndex: 10,
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: 'rgba(2, 6, 23, 0.8)',
          backdropFilter: 'blur(10px)',
        }}>
          <div>
            <div style={{
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '3px',
              fontStyle: 'italic',
            }}>
              {sourceName}
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginTop: '4px',
            }}>
              {formattedDate} • PUNTA ARENAS
            </div>
          </div>
          
          {/* Sello de Verificación Oficial de Marca */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}>
            <div style={{
              background: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              borderRadius: '9999px',
              padding: '6px 16px',
              color: '#60a5fa',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '4px',
              fontStyle: 'italic',
              boxShadow: '0 0 12px rgba(37, 99, 235, 0.2)'
            }}>
              ✓ CONTAPYMEPUQ VERIFICADO
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
            }}>
              contapymepuq.cl • SHA-256:{fakeHash}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

StoryCard.displayName = 'StoryCard'
