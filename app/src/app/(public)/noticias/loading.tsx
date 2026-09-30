import { Newspaper } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function NewsLoading() {
  return (
    <div className="min-h-screen py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        {/* Header Skeleton */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
            <Newspaper className="h-3 w-3 animate-pulse" /> Cargando Central de Noticias...
          </div>
          <Skeleton className="h-14 sm:h-20 w-3/4 rounded-2xl" />
          <Skeleton className="h-6 w-1/2 rounded-xl" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-full rounded-[2.5rem] border-border/80 bg-white/90 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <Skeleton className="h-56 w-full rounded-none" />
                <CardContent className="p-6 sm:p-8 space-y-3">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-full rounded-lg" />
                  <Skeleton className="h-6 w-4/5 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </CardContent>
              </div>
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-border/40">
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
