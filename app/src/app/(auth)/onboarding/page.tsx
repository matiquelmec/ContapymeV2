import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingWizard from './onboarding-wizard'

export const metadata: Metadata = {
  title: 'Configuración Inicial | Contapymepuq',
  description: 'Configura tu empresa para comenzar a usar Contapymepuq.',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // If already completed onboarding, go to dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  return (
    <div className="w-full flex justify-center">
      <OnboardingWizard />
    </div>
  )
}
