import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

// 🛡️ User-Agents de escáneres y bots maliciosos conocidos
const BLOCKED_USER_AGENTS = [
  'sqlmap',
  'nikto',
  'dirbuster',
  'gobuster',
  'wpscan',
  'masscan',
  'nmap',
  'acunetix',
  'havij',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = getClientIp(req)
  const userAgent = (req.headers.get('user-agent') || '').toLowerCase()

  // 1. 🛑 Bloqueo de Escáneres de Vulnerabilidades
  if (BLOCKED_USER_AGENTS.some(agent => userAgent.includes(agent))) {
    return new NextResponse('Access Denied', { status: 403 })
  }

  // 2. 🔒 Modo Mantenimiento de Emergencia (activable vía variable de entorno)
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true'
  if (isMaintenance) {
    // Permitir assets estáticos y páginas de mantenimiento
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/static') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/mantenimiento')
    ) {
      return NextResponse.next()
    }
    const maintenanceUrl = req.nextUrl.clone()
    maintenanceUrl.pathname = '/mantenimiento'
    return NextResponse.redirect(maintenanceUrl)
  }

  // 3. ⚡ Rate Limiting Inteligente por IP para Rutas Críticas
  // A. Autenticación (Login / Registro / Reset Password)
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    const rate = checkRateLimit(`auth:${ip}`, 15, 60 * 1000) // 15 intentos por minuto
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfter, 'Demasiados intentos de acceso. Por favor espera antes de reintentar.')
    }
  }

  // B. Formularios de Contacto y Feedback
  if (pathname.startsWith('/api/contact')) {
    const rate = checkRateLimit(`contact:${ip}`, 5, 5 * 60 * 1000) // 5 envíos cada 5 minutos
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfter, 'Límite de envíos excedido. Espera unos minutos.')
    }
  }

  // C. Sincronización de Noticias (Disparador de IA)
  if (pathname.startsWith('/api/v1/news/sync')) {
    const rate = checkRateLimit(`news_sync:${ip}`, 6, 5 * 60 * 1000) // 6 peticiones cada 5 minutos
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfter, 'Sincronización en curso. Espera antes de volver a solicitar.')
    }
  }

  // 4. Continuar flujo estándar
  const response = NextResponse.next()

  // Inyectar cabecera con IP auditada para observabilidad interna
  response.headers.set('x-client-ip', ip)

  return response
}

// Configurar matcher para interceptar rutas sensibles, APIs y navegación principal
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)',
  ],
}
