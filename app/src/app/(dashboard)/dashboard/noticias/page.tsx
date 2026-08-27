import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCompanyNewsAction } from '@/actions/news'
import { DashboardNewsClient } from '@/components/dashboard/dashboard-news-client'
import { Newspaper } from 'lucide-react'

export const revalidate = 0

export default async function DashboardNoticiasPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return redirect('/login?next=/dashboard/noticias')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, plan')
    .eq('id', user.id)
    .single()

  const newsRes = await getCompanyNewsAction()
  const news = newsRes.success ? newsRes.data : []

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-wider">
          <Newspaper className="h-4 w-4" />
          <span>Prensa & Comunicación Regional</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
          Mis Comunicados y Publirreportajes
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Difunde notas de prensa, noticias corporativas y anuncios en el Diario Regional de Punta Arenas.
        </p>
      </div>

      <DashboardNewsClient 
        initialNews={news} 
        companyName={profile?.full_name || ''} 
      />
    </div>
  )
}
