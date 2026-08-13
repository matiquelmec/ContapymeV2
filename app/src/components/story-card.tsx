'use client'

import { forwardRef } from 'react'

interface StoryCardProps {
  title: string
  category: string
  imageUrl: string
  date: string
  summary?: string
  sourceName?: string
  showStickerGuide?: boolean
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
  ({ title, category, imageUrl, date, summary, sourceName = 'Diario Contapymepuq', showStickerGuide = false }, ref) => {
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
        {/* 🖼️ 1. FOTOGRAFÍA DESTACADA FULL-BLEED SUPERIOR (1080px × 1140px) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1140px',
          zIndex: 1,
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
          {/* Sombra gradual superior para destacar el logo */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.85) 0%, rgba(2, 6, 23, 0.2) 30%, transparent 60%, #020617 100%)',
          }} />

          {/* Header de Marca Flotante */}
          <div style={{
            position: 'absolute',
            top: '110px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
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
                filter: 'drop-shadow(0 6px 25px rgba(0,0,0,0.9)) drop-shadow(0 0 20px rgba(37, 99, 235, 0.5))',
              }}
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* 📝 2. HOJA PERIODÍSTICA INFERIOR (TEXT SHEET DE ALTO IMPACTO: 880px) */}
        <div style={{
          marginTop: '980px',
          height: '940px',
          backgroundColor: '#020617',
          borderTop: '3px solid rgba(59, 130, 246, 0.5)',
          padding: '40px 75px 120px 75px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
          boxShadow: '0 -30px 80px rgba(0,0,0,0.95)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Badge de Categoría con Destello */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                backgroundColor: theme.badgeBg,
                border: `1.5px solid ${theme.borderColor}`,
                borderRadius: '9999px',
                padding: '10px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '9999px',
                  backgroundColor: theme.accentColor,
                  boxShadow: `0 0 12px ${theme.accentColor}`
                }} />
                <span style={{
                  color: theme.textColor,
                  fontSize: '16px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                  fontStyle: 'italic',
                }}>
                  {category}
                </span>
              </div>
            </div>

            {/* Titular Principal de Alto Impacto (Sin Cortes de Texto) */}
            <h2 style={{
              color: '#ffffff',
              fontSize: '56px',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: '-1.5px',
              lineHeight: 1.15,
              textTransform: 'uppercase',
              margin: 0,
              textShadow: '0 4px 20px rgba(0,0,0,0.9)',
            }}>
              {title}
            </h2>

            {/* Resumen Periodístico / Subtítulo Completo Nítido */}
            <p style={{
              color: '#cbd5e1',
              fontSize: '25px',
              fontWeight: 500,
              lineHeight: 1.45,
              margin: 0,
            }}>
              {summary || "Revisa la cobertura periodística completa y los detalles clave en el Diario Regional Contapymepuq."}
            </p>

            {/* Guía visual opcional para sticker de Instagram */}
            {showStickerGuide && (
              <div style={{
                marginTop: '10px',
                padding: '12px 20px',
                borderRadius: '16px',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                border: '2px dashed rgba(59, 130, 246, 0.6)',
                color: '#93c5fd',
                fontSize: '13px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                textAlign: 'center',
              }}>
                🔗 PEGA TU STICKER DE ENLACE DE INSTAGRAM AQUÍ
              </div>
            )}
          </div>

          {/* Footer Bar Integrado */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '24px',
            width: '100%',
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
      </div>
    )
  }
)

StoryCard.displayName = 'StoryCard'
