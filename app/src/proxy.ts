import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase()

  // 1. 🛑 Bloqueo perimetral de Escáneres de Vulnerabilidades
  if (BLOCKED_USER_AGENTS.some(agent => userAgent.includes(agent))) {
    return new NextResponse('Access Denied', { status: 403 })
  }

  // 2. 🔒 Modo Mantenimiento de Emergencia
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true'
  if (isMaintenance) {
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/static') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/mantenimiento')
    ) {
      return NextResponse.next()
    }
    const maintenanceUrl = request.nextUrl.clone()
    maintenanceUrl.pathname = '/mantenimiento'
    return NextResponse.redirect(maintenanceUrl)
  }

  // 3. ⚡ Rate Limiting Inteligente por IP para Rutas Críticas
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    const rate = checkRateLimit(`auth:${ip}`, 15, 60 * 1000)
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfter, 'Demasiados intentos de acceso. Por favor espera antes de reintentar.')
    }
  }

  if (pathname.startsWith('/api/contact')) {
    const rate = checkRateLimit(`contact:${ip}`, 5, 5 * 60 * 1000)
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfter, 'Límite de envíos excedido. Espera unos minutos.')
    }
  }

  if (pathname.startsWith('/api/v1/news/sync')) {
    const rate = checkRateLimit(`news_sync:${ip}`, 6, 5 * 60 * 1000)
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfter, 'Sincronización en curso. Espera antes de volver a solicitar.')
    }
  }

  // 4. Supabase Session Management & Route Protection
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión del usuario sin bloquear la UI
  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rutas del dashboard: redirigir al login si no hay sesión
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si ya está autenticado y va al login sin parámetro 'next', redirigir al dashboard
  if (user && request.nextUrl.pathname === '/login' && !request.nextUrl.searchParams.has('next')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Inyectar cabecera auditada de IP
  supabaseResponse.headers.set('x-client-ip', ip)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)',
  ],
}
