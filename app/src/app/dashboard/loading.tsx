import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4 p-8 animate-in fade-in duration-300">
      <div className="relative">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-inner">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
      <div className="flex flex-col items-center space-y-1 text-center">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
          Cargando Módulo...
        </span>
        <span className="text-[10px] font-bold text-muted-foreground italic uppercase tracking-wider">
          Sincronizando estado financiero con Supabase Cloud
        </span>
      </div>
    </div>
  )
}
