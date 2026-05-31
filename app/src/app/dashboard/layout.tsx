import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MarketTicker } from '@/components/market-ticker'
import { getLatestIndicators } from '@/actions/indicators'
import { ScrollToTop } from './components/scroll-to-top'
import { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const indicatorsRes = await getLatestIndicators()
  const indicators = indicatorsRes.success ? indicatorsRes.data : []

  return (
    <div className="fixed inset-0 flex bg-background text-foreground overflow-hidden font-sans" suppressHydrationWarning>
      <ScrollToTop />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MarketTicker indicators={indicators} />
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
