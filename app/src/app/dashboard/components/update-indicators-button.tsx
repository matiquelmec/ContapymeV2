'use client'

import { useState } from 'react'
import { RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateIndicators } from '@/actions/indicators'

export function UpdateIndicatorsButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleUpdate() {
    setLoading(true)
    setMessage(null)

    const result = await updateIndicators()

    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Fallo de conexión.' })
    } else {
      const errText = result.errores && result.errores.length > 0
        ? ` (${result.errores.length} nulos)`
        : ''
      setMessage({ type: 'success', text: `Sync: ${result.total} datos${errText}` })
    }

    setLoading(false)
    setTimeout(() => setMessage(null), 8000)
  }

  return (
    <div className="flex items-center gap-4">
      {message && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-4 fade-in duration-500 shadow-sm border ${message.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
          {message.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {message.text}
        </div>
      )}
      <Button
        onClick={handleUpdate}
        disabled={loading}
        variant="outline"
        className="border-border text-foreground font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl hover:bg-muted shadow-sm active:scale-95 transition-all"
      >
        {loading
          ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
          : <RefreshCw className="w-4 h-4 mr-2 text-primary" />}
        {loading ? 'Consultando...' : 'Sincronizar Indicadores'}
      </Button>
    </div>
  )
}
