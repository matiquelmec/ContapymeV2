'use client'

import React, { useState, useEffect } from 'react'
import { 
  Sparkles, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  ChevronRight, 
  Loader2,
  X,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function SubscriptionBadge({ organizationId }: { organizationId?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<'emprendedor' | 'pyme_pro' | 'estudio' | 'corporativo'>('pyme_pro')
  
  // Cuenta regresiva calculada (14 días por defecto para cuentas nuevas)
  const [daysRemaining, setDaysRemaining] = useState(14)

  const plans = [
    {
      id: 'emprendedor',
      name: 'Plan Emprendedor',
      price: 9990,
      badge: 'Microempresa',
      desc: 'Hasta 3 trabajadores, DTEs y boletas ilimitadas, cálculo de F29.',
      popular: false,
    },
    {
      id: 'pyme_pro',
      name: 'Plan Pyme Pro',
      price: 24990,
      badge: '⭐ Más Popular',
      desc: 'Hasta 15 trabajadores, LRE automático, contratos + 1 aviso de empleo gratis cada 2 meses.',
      popular: true,
    },
    {
      id: 'estudio',
      name: 'Estudio Contable',
      price: 49990,
      badge: 'Contadores',
      desc: 'Multi-empresa, hasta 100 trabajadores, conciliación y reportes avanzados.',
      popular: false,
    },
    {
      id: 'corporativo',
      name: 'Corporativo',
      price: 89990,
      badge: 'Faena / Gran Pyme',
      desc: 'Trabajadores ilimitados, turnos 7x7/14x14, soporte tributario prioritario.',
      popular: false,
    },
  ]

  const handlePay = async (planId: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/create-subscription-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: planId,
          billingCycle,
          organizationId,
          returnTo: typeof window !== 'undefined' ? window.location.pathname : '/dashboard',
        }),
      })

      const data = await res.json()
      if (data.success && data.init_point) {
        toast.loading('Redirigiendo a Mercado Pago...')
        window.location.href = data.init_point
      } else {
        toast.error(data.error || 'Error al conectar con Mercado Pago')
        setLoading(false)
      }
    } catch (e: any) {
      toast.error('Error al procesar la solicitud de pago.')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-900 transition-all hover:scale-105 active:scale-95 shadow-sm group">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <div className="text-left leading-none">
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 block">
            Prueba Gratuita
          </span>
          <span className="text-[11px] font-bold text-foreground">
            {daysRemaining} días restantes
          </span>
        </div>
        <span className="ml-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-primary text-white shadow-sm group-hover:bg-primary/90">
          Pagar Plan ➔
        </span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-6 sm:p-8 bg-white border border-border">
        <DialogHeader className="text-center space-y-3 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mx-auto">
            <Sparkles className="w-3.5 h-3.5" /> Suscripción Oficial ContaPymePUQ
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
            Elige tu Plan de Software ERP & Nómina
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-medium max-w-lg mx-auto">
            Paga en pesos chilenos vía <strong>Mercado Pago / Webpay</strong> con Débito, Redcompra, CuentaRUT o Tarjeta de Crédito. Sin amarras ni contratos forzados.
          </p>

          {/* Toggle Mensual / Anual */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensual
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${billingCycle === 'annual' ? 'bg-emerald-600' : 'bg-zinc-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1 ${billingCycle === 'annual' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              Anual <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">20% OFF</span>
            </span>
          </div>
        </DialogHeader>

        {/* Grid de 4 Planes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {plans.map((p) => {
            const isSelected = selectedPlan === p.id
            const price = billingCycle === 'annual' ? Math.round(p.price * 0.8) : p.price

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id as any)}
                className={`p-5 rounded-3xl border-2 flex flex-col justify-between transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-xl ring-2 ring-primary/20 scale-[1.02]'
                    : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest shadow-sm">
                    {p.badge}
                  </div>
                )}

                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                    {p.badge}
                  </span>
                  <h4 className="text-base font-black uppercase text-foreground leading-tight">
                    {p.name}
                  </h4>
                  <div className="text-2xl font-black text-foreground">
                    ${price.toLocaleString('es-CL')}
                    <span className="text-[10px] text-muted-foreground font-bold lowercase">/mes</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium leading-snug">
                    {p.desc}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-zinc-200/60">
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={() => handlePay(p.id)}
                    className={`w-full h-10 rounded-xl text-xs font-black uppercase tracking-wider ${
                      isSelected
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25'
                        : 'bg-zinc-200 hover:bg-primary hover:text-white text-zinc-800'
                    }`}
                  >
                    {loading && selectedPlan === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Pagar Plan ➔'
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-4 text-center">
          <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Transacción procesada por Mercado Pago Chile con cifrado bancario SSL de 256 bits.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
