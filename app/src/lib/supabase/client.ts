import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para Client Components ('use client').
 * Solo usar para suscripciones en tiempo real o interacciones
 * que no pueden hacerse desde el servidor.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
