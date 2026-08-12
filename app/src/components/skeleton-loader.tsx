/**
 * Skeleton Loaders — Componentes de carga visual suave (glassmorphism + animate-pulse)
 * Reemplaza las pantallas en blanco o ruedas giratorias mientras se cargan datos.
 */

export function NewsCardSkeleton() {
  return (
    <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-border/30 bg-muted/40 animate-pulse">
      {/* Imagen placeholder */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-800 via-zinc-700/60 to-zinc-600/30" />

      {/* Top badges placeholder */}
      <div className="absolute top-3 sm:top-5 left-3 sm:left-5 right-3 sm:right-5 flex justify-between z-10">
        <div className="h-5 w-28 rounded-full bg-white/10 backdrop-blur-xl" />
        <div className="h-5 w-20 rounded-full bg-white/10 backdrop-blur-xl" />
      </div>

      {/* Bottom content placeholder */}
      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 space-y-3 z-10">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-lg bg-white/10" />
          <div className="h-5 w-20 rounded-lg bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-[90%] rounded bg-white/15" />
          <div className="h-5 w-[70%] rounded bg-white/10" />
        </div>
        <div className="flex justify-between pt-1">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function SmallNewsCardSkeleton() {
  return (
    <div className="flex gap-4 p-3 rounded-2xl border border-border/30 bg-muted/20 animate-pulse">
      <div className="w-20 h-20 rounded-xl bg-muted/40 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 w-16 rounded bg-muted/40" />
        <div className="h-4 w-[90%] rounded bg-muted/50" />
        <div className="h-4 w-[60%] rounded bg-muted/40" />
      </div>
    </div>
  );
}

export function MarketTickerSkeleton() {
  return (
    <div className="flex items-center gap-6 px-4 py-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-3 w-10 rounded bg-muted/40" />
          <div className="h-4 w-16 rounded bg-muted/50" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-2 animate-pulse">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-border/30">
        <div className="h-3 w-[20%] rounded bg-muted/50" />
        <div className="h-3 w-[30%] rounded bg-muted/40" />
        <div className="h-3 w-[20%] rounded bg-muted/40" />
        <div className="h-3 w-[15%] rounded bg-muted/40" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b border-border/10">
          <div className="h-4 w-[20%] rounded bg-muted/30" />
          <div className="h-4 w-[30%] rounded bg-muted/25" />
          <div className="h-4 w-[20%] rounded bg-muted/20" />
          <div className="h-4 w-[15%] rounded bg-muted/25" />
        </div>
      ))}
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/30 bg-card/50 p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-muted/40" />
        <div className="h-8 w-8 rounded-xl bg-muted/30" />
      </div>
      <div className="h-8 w-32 rounded bg-muted/50" />
      <div className="h-3 w-20 rounded bg-muted/30" />
    </div>
  );
}
