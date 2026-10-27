import { NextRequest, NextResponse } from 'next/server'
import { syncNewsAction } from '@/actions/news'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function handleNewsSync(req: NextRequest) {
  const startMs = Date.now()
  try {
    const authHeader = req.headers.get('authorization') || ''
    const cronSecretHeader = req.headers.get('x-cron-secret') || ''
    const vercelCronHeader = req.headers.get('x-vercel-cron') || ''
    const expectedSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    let isAuthorized = false

    // 1. Verificación por Token Criptográfico (GitHub Actions / Vercel Cron)
    if (expectedSecret) {
      if (authHeader.startsWith('Bearer ') && authHeader.substring(7) === expectedSecret) {
        isAuthorized = true
      } else if (cronSecretHeader === expectedSecret) {
        isAuthorized = true
      }
    }

    // 2. Cabecera nativa Vercel Cron en entorno desplegado
    if (!isAuthorized && vercelCronHeader === '1' && process.env.VERCEL) {
      isAuthorized = true
    }

    // 3. Verificación por Sesión de Administrador
    if (!isAuthorized) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const adminDb = createAdminClient()
          const { data: profile } = await adminDb
            .from('profiles')
            .select('role, plan')
            .eq('id', user.id)
            .single()

          if (
            (profile?.role || '').toLowerCase() === 'admin' ||
            (profile?.plan || '').toLowerCase() === 'consorcio'
          ) {
            isAuthorized = true
          }
        }
      } catch (e) {
        // Fallback silencioso
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere CRON_SECRET o sesión de Administrador.' },
        { status: 401 }
      )
    }

    // 4. Ejecutar sincronización de noticias
    const syncResult = await syncNewsAction()
    const durationMs = Date.now() - startMs

    // 5. Registrar telemetría en audit_logs
    const adminDb = createAdminClient()
    try {
      await adminDb.from('audit_logs').insert({
        action: 'CRON_NEWS_SYNC_EXECUTED',
        entity_type: 'regional_news_cron',
        entity_id: 'cron_news_sync_' + new Date().toISOString().slice(0, 10),
        details: {
          added_count: syncResult.addedCount,
          success: syncResult.success,
          duration_ms: durationMs,
          source: vercelCronHeader === '1' ? 'vercel_cron' : authHeader ? 'bearer_cron_secret' : 'admin_session',
          timestamp: new Date().toISOString(),
        }
      })
    } catch (logErr: any) {
      console.warn('[News Sync Audit Log Warning]:', logErr.message)
    }

    // 6. Revalidar rutas públicas
    revalidatePath('/')
    revalidatePath('/noticias')

    return NextResponse.json({
      success: true,
      message: 'Sincronización de noticias completada con éxito.',
      metrics: {
        added_count: syncResult.addedCount,
        duration_ms: durationMs,
      },
      sync: syncResult,
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('[News Sync API Error]:', err.message)
    return NextResponse.json(
      { error: 'Error interno en sincronización de noticias: ' + err.message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return handleNewsSync(req)
}

export async function POST(req: NextRequest) {
  return handleNewsSync(req)
}
