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

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (profile?.onboarding_completed || orgMember) {
    if (!profile?.onboarding_completed && orgMember) {
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
    }
    redirect('/dashboard')
  }

  return (
    <div className="w-full flex justify-center">
      <OnboardingWizard />
    </div>
  )
}
