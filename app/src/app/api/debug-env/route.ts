import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'no-definida'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  const parseKey = (key: string) => {
    if (!key) return { status: 'no-definida' }
    try {
      const parts = key.split('.')
      if (parts.length !== 3) return { status: 'formato-invalido', length: key.length }
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'))
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
      return {
        status: 'valida',
        length: key.length,
        role: payload.role || 'no-role',
        iss: payload.iss,
        exp: payload.exp,
        starts_with: key.substring(0, 15) + '...',
        ends_with: '...' + key.substring(key.length - 10)
      }
    } catch (e: any) {
      return { status: 'error-al-decodificar', error: e.message }
    }
  }

  return NextResponse.json({
    supabase_url: url,
    anon_key_status: parseKey(anonKey),
    service_key_status: parseKey(serviceKey),
    are_keys_identical: serviceKey === anonKey
  })
}
