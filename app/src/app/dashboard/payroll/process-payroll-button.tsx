'use client'

import { useState } from 'react'
import { FileText, Loader2, CheckCircle, XCircle, Calculator, Zap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { processPayroll } from '@/actions/process_payroll'
import { toast } from 'sonner'

export function ProcessPayrollButton() {
  const [loading, setLoading] = useState(false)

  async function handleProcess() {
    setLoading(true)
    
    try {
        const result = await processPayroll()
        
        if (!result.success && result.error) {
            toast.error(result.error || "Error en el procesamiento de haberes.")
        } else {
            toast.success(`Cálculo finalizado: ${result.count} liquidaciones generadas con éxito.`, {
                description: "Los registros han sido inyectados en la base de datos central.",
                icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
            })
        }
    } catch (err) {
        toast.error("Fallo crítico en el Motor Algorítmico.")
    } finally {
        setLoading(false)
    }
  }

  return (
    <Button 
        onClick={handleProcess}
        disabled={loading}
        className="bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl h-11 px-6 shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all group"
    >
        {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
            <Calculator className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
        )}
        {loading ? 'MODO CÁLCULO...' : 'PROCESAR NÓMINA'}
    </Button>
  )
}
