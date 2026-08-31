export default function ModuleLoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-muted/60 rounded-full" />
          <div className="h-8 w-64 bg-muted rounded-2xl" />
          <div className="h-3 w-80 bg-muted/40 rounded-full" />
        </div>
        <div className="h-10 w-48 bg-muted/60 rounded-2xl" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white border border-border/40 rounded-3xl p-5 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-muted/60 rounded-full" />
              <div className="h-7 w-32 bg-muted rounded-xl" />
            </div>
            <div className="h-12 w-12 bg-muted/40 rounded-2xl" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-border/60 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 bg-muted/60 rounded-xl" />
          <div className="h-8 w-32 bg-muted/40 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-12 bg-muted/20 rounded-2xl flex items-center px-4 gap-4">
              <div className="h-4 w-1/4 bg-muted/40 rounded-lg" />
              <div className="h-4 w-1/4 bg-muted/30 rounded-lg" />
              <div className="h-4 w-1/4 bg-muted/30 rounded-lg" />
              <div className="h-4 w-1/4 bg-muted/40 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
