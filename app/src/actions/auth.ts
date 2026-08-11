'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextPath = formData.get('next') as string | null

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    let msg = 'Credenciales incorrectas'
    if (error.message.toLowerCase().includes('email not confirmed')) {
      msg = 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
    } else if (error.message) {
      msg = error.message // Podría ser Invalid login credentials etc, pero lo mostramos para saber qué pasa
    }
    const emailParam = email ? `&email=${encodeURIComponent(email)}` : ''
    const nextParam = nextPath ? `&next=${encodeURIComponent(nextPath)}` : ''
    return redirect('/login?error=' + encodeURIComponent(msg) + emailParam + nextParam)
  }

  // Check if user has completed onboarding
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    // Verificamos si ya tiene empresas (cuentas legacy o pre-onboarding)
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!profile?.onboarding_completed && !orgMember) {
      return redirect('/onboarding')
    } else if (!profile?.onboarding_completed && orgMember) {
      // Auto-corregir el flag para el futuro
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
    }
  }

  // Redirigir al destino original si se proporcionó un parámetro 'next' válido (ruta interna)
  if (nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
    return redirect(nextPath)
  }

  return redirect('/dashboard')
}

export async function signUpWithEmail(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  if (!email || !password || !fullName) {
    return redirect('/register?error=Todos+los+campos+son+obligatorios')
  }

  if (password.length < 8) {
    return redirect('/register?error=La+contraseña+debe+tener+al+menos+8+caracteres')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })

  if (error) {
    const msg = error.message.includes('already registered')
      ? 'Este+correo+ya+está+registrado.+Intenta+iniciar+sesión.'
      : encodeURIComponent(error.message)
    return redirect(`/register?error=${msg}`)
  }

  // Si Supabase requiere confirmación de email, no devuelve sesión
  if (!data?.session) {
    return redirect('/login?success=Cuenta+creada.+Revisa+tu+correo+y+haz+clic+en+el+enlace+de+verificación+antes+de+iniciar+sesión.')
  }

  return redirect('/onboarding')
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    return redirect('/reset-password?error=Ingresa+tu+correo+electrónico')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password`,
  })

  if (error) {
    return redirect('/reset-password?error=' + encodeURIComponent(error.message))
  }

  return redirect('/reset-password?success=Te+enviamos+un+enlace+de+recuperación+a+tu+correo')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Limpiamos la empresa activa para que no se herede en la próxima sesión del navegador.
  const cookieStore = await cookies()
  cookieStore.delete('active_organization_id')
  return redirect('/')
}
