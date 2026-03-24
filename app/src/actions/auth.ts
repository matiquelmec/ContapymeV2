'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    let msg = 'Credenciales incorrectas'
    if (error.message.toLowerCase().includes('email not confirmed')) {
      msg = 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
    } else if (error.message) {
      msg = error.message // Podría ser Invalid login credentials etc, pero lo mostramos para saber qué pasa
    }
    return redirect('/login?error=' + encodeURIComponent(msg))
  }

  // Check if user has completed onboarding
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_completed) {
      return redirect('/onboarding')
    }
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
  return redirect('/login')
}
