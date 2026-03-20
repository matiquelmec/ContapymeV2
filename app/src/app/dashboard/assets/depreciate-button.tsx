'use client'

import { useState } from 'react'
import { TrendingDown, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { depreciateAssets } from '@/actions/assets'
import { toast } from 'sonner'

export function DepreciateButton() {
  const [loading, setLoading] = useState(false)

  async function handleDepreciate() {
    setLoading(true)
    const result = await depreciateAssets()

    if (!result.success && result.error) {
      toast.error('Error en el motor de depreciación', {
        description: result.error,
        icon: <AlertTriangle className="w-5 h-5 text-rose-500" />
      })
    } else {
      const count = result.count ?? 0
      const skipped = result.skipped ?? 0

      if (count === 0 && skipped > 0) {
        toast.warning('Período ya procesado', {
          description: 'Ya depreciaste todos los activos este mes. Vuelve el próximo período.',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />
        })
      } else if (skipped > 0) {
        toast.success(`${count} activos depreciados.`, {
          description: `${skipped} activos ya estaban procesados este período.`,
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        })
      } else {
        toast.success(`${count} activos depreciados correctamente.`, {
          description: 'Los asientos contables han sido generados por el motor Python.',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        })
      }
    }

    setLoading(false)
  }

  return (
    <Button
      onClick={handleDepreciate}
      disabled={loading}
      variant="outline"
      className="h-14 rounded-2xl border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 font-black uppercase text-xs tracking-[0.2em] px-8 shadow-lg shadow-amber-500/5 hover:scale-[1.03] active:scale-95 transition-all gap-3"
    >
      {loading
        ? <><Loader2 className="w-5 h-5 animate-spin" /> CALCULANDO...</>
        : <><TrendingDown className="w-5 h-5" /> DEPRECIAR PERÍODO</>
      }
    </Button>
  )
}
