import { NextRequest, NextResponse } from 'next/server'
import { syncRegionalJobs } from '@/lib/jobs/jobs-feed-sync'
import { cleanupExpiredJobsAction } from '@/actions/jobs'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function handleSync(req: NextRequest) {
  const startMs = Date.now()
  try {
    const authHeader = req.headers.get('authorization') || ''
    const cronSecretHeader = req.headers.get('x-cron-secret') || ''
    const vercelCronHeader = req.headers.get('x-vercel-cron') || ''
    const expectedSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    let isAuthorized = false

    // 1. Verificación por Token Criptográfico (para crons automáticos / GitHub Actions / Vercel Cron)
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

    // 2. Verificación por Sesión de Administrador
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
        // Fallback silencioso si falla sesión
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere CRON_SECRET o sesión de Administrador.' },
        { status: 401 }
      )
    }

    // 3. Ejecutar limpieza de ofertas caducadas
    const cleanupResult = await cleanupExpiredJobsAction()

    // 4. Ejecutar sincronización e ingesta de vacantes regionales
    const syncResult = await syncRegionalJobs()

    // 5. Revalidar rutas públicas
    revalidatePath('/empleos')
    revalidatePath('/dashboard/empleos')
    revalidatePath('/sitemap-jobs.xml')

    const durationMs = Date.now() - startMs

    return NextResponse.json({
      success: true,
      message: 'Sincronización y ciclo de vida de empleos completado con éxito.',
      metrics: {
        inserted_count: syncResult.insertedCount,
        skipped_count: syncResult.skippedCount,
        expired_cleaned: cleanupResult.expiredCount,
        duration_ms: durationMs,
      },
      cleanup: cleanupResult,
      sync: syncResult,
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('[Jobs Sync API Error]:', err.message)
    return NextResponse.json(
      { error: 'Error interno en sincronización de empleos: ' + err.message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return handleSync(req)
}

export async function POST(req: NextRequest) {
  return handleSync(req)
}
