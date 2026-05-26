import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase Administrador.
 * Bypassea las políticas de RLS utilizando la clave secreta SUPABASE_SERVICE_ROLE_KEY.
 * ⚠️ SOLO utilizar del lado del servidor (Server Actions o API Routes).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabaseServiceKey) {
    throw new Error('Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
