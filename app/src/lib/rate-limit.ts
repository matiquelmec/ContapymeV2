import { NextRequest, NextResponse } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// Almacenamiento en memoria para Rate Limiting (por IP y namespace)
const rateLimitMap = new Map<string, RateLimitRecord>()

// Limpieza periódica de memoria para evitar memory leaks en procesos de larga duración
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000) // cada 5 minutos
}

/**
 * Extrae la IP real del cliente considerando proxies (Cloudflare, Vercel, Nginx).
 */
export function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const xForwardedFor = req.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim()
    if (firstIp) return firstIp
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return '127.0.0.1'
}

/**
 * Verifica si una clave (IP + namespace) ha excedido el límite de solicitudes.
 * @param key Identificador único (ej: `ip:login`, `ip:api`)
 * @param limit Número máximo de solicitudes permitidas
 * @param windowMs Ventana de tiempo en milisegundos (por defecto 60 segundos)
 */
export function checkRateLimit(
  key: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): { allowed: boolean; retryAfter?: number; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000))
    return { allowed: false, retryAfter, remaining: 0 }
  }

  record.count += 1
  return { allowed: true, remaining: limit - record.count }
}

/**
 * Genera una respuesta estándar 429 Too Many Requests con cabeceras Retry-After.
 */
export function rateLimitResponse(retryAfter: number = 60, message: string = 'Demasiadas solicitudes. Por favor espera antes de intentar nuevamente.') {
  return new NextResponse(
    JSON.stringify({
      error: message,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  )
}
