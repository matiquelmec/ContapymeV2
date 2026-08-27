/**
 * color-extractor.ts — Motor de Extracción Cromática y Análisis de Marca para ContaEmpleos
 * =========================================================================================
 * Analiza imágenes y logotipos corporativos (PNG, SVG, JPG, WebP) mediante cuantización de
 * píxeles sobre HTML5 Canvas, filtrando fondos transparentes, blancos puros y negros absolutos.
 */

export interface BrandPalette {
  primaryHex: string
  accentHex: string
  backgroundHex: string
  textHex: string
  surfaceHex: string
  isDark: boolean
}

/**
 * Convierte valores RGB a formato Hexadecimal (#RRGGBB).
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

/**
 * Calcula la luminancia relativa según la fórmula estándar WCAG (ITU-R BT.709).
 */
export function getLuminance(r: number, g: number, b: number): number {
  return 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255)
}

/**
 * Extrae los colores dominantes y de acento a partir de una URL o Base64 de imagen.
 */
export async function extractBrandPaletteFromImage(imageSrc: string): Promise<BrandPalette> {
  // Paleta fallback de ContaPyme por defecto si falla la carga o es monocromático
  const defaultPalette: BrandPalette = {
    primaryHex: '#004080',
    accentHex: '#10B981',
    backgroundHex: '#FFFFFF',
    textHex: '#0F172A',
    surfaceHex: '#F8FAFC',
    isDark: false,
  }

  if (typeof window === 'undefined' || !imageSrc) {
    return defaultPalette
  }

  return new Promise((resolve) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return resolve(defaultPalette)
        }

        // Muestrear a resolución controlada (100x100) para rendimiento instantáneo
        const width = 100
        const height = 100
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data

        // Diccionario de cubos de color cuantizados
        const colorCounts: Record<string, { r: number; g: number; b: number; count: number; sat: number }> = {}

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3]
          // Ignorar píxeles transparentes
          if (a < 128) continue

          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          // Ignorar blanco puro y negro casi absoluto (típicos de fondos o letras menores)
          const isWhite = r > 240 && g > 240 && b > 240
          const isBlack = r < 20 && g < 20 && b < 20
          if (isWhite || isBlack) continue

          // Cuantizar en pasos de 16 para agrupar tonos similares
          const qr = Math.round(r / 16) * 16
          const qg = Math.round(g / 16) * 16
          const qb = Math.round(b / 16) * 16
          const key = `${qr},${qg},${qb}`

          // Calcular saturación simple
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          const sat = max === 0 ? 0 : (max - min) / max

          if (!colorCounts[key]) {
            colorCounts[key] = { r, g, b, count: 1, sat }
          } else {
            colorCounts[key].count++
          }
        }

        const sortedColors = Object.values(colorCounts).sort((a, b) => {
          // Ponderar frecuencia y saturación cromática para capturar el color de marca real
          const scoreA = a.count * (1 + a.sat * 2)
          const scoreB = b.count * (1 + b.sat * 2)
          return scoreB - scoreA
        })

        if (sortedColors.length === 0) {
          return resolve(defaultPalette)
        }

        const dominant = sortedColors[0]
        const primaryHex = rgbToHex(dominant.r, dominant.g, dominant.b)

        // Buscar un color secundario con distancia cromática
        let secondary = sortedColors.find((c) => {
          const dist = Math.abs(c.r - dominant.r) + Math.abs(c.g - dominant.g) + Math.abs(c.b - dominant.b)
          return dist > 100 && c.sat > 0.3
        })

        const accentHex = secondary ? rgbToHex(secondary.r, secondary.g, secondary.b) : '#10B981'
        const lum = getLuminance(dominant.r, dominant.g, dominant.b)
        const isDark = lum < 0.4

        resolve({
          primaryHex,
          accentHex,
          backgroundHex: '#FFFFFF',
          textHex: '#0F172A',
          surfaceHex: isDark ? '#0F172A' : '#F8FAFC',
          isDark,
        })
      } catch (err) {
        console.warn('[ColorExtractor] Error analizando imagen:', err)
        resolve(defaultPalette)
      }
    }

    img.onerror = () => {
      resolve(defaultPalette)
    }

    img.src = imageSrc
  })
}
